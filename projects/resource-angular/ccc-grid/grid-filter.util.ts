import { and, Condition, serializeFilter, where } from '@cccteam/resource';
import { ColumnFilter, ColumnFilterability, FILTER_OPERATORS, FilterControl, FilterOperator, FilterOperatorOption } from './grid-types';

// The grid's filters, as pure functions: what the server grammar names, which columns
// may filter, when a companion column may join, and how the filters become the request.

export function operatorOption(operator: FilterOperator): FilterOperatorOption {
  return FILTER_OPERATORS.find((option) => option.value === operator) ?? FILTER_OPERATORS[0];
}

/** Whether a column filter says something: a value for an operator that takes one, or a null test. */
export function isComplete(filter: ColumnFilter): boolean {
  return !operatorOption(filter.operator).takesValue || filter.value.trim() !== '';
}

/**
 * The fields a filter in the server grammar names. A condition is `field:op[:value]`;
 * conditions join with `,` and `|` and group in parentheses, and a list value sits in
 * parentheses of its own, so splitting on those and keeping the identifier before the
 * first colon reads every field and no value.
 */
export function filterFields(filter: string): string[] {
  const fields = new Set<string>();
  for (const fragment of filter.split(/[(),|]/)) {
    const colon = fragment.indexOf(':');
    if (colon === -1) {
      continue;
    }
    const field = fragment.slice(0, colon).trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) {
      fields.add(field);
    }
  }
  return [...fields];
}

/**
 * Whether the request carries a filter on a column the server filters on its own: a
 * column filter on an `always` column, or a field of the page's own filter that is one.
 */
export function indexedFilterActive(
  filters: readonly ColumnFilter[],
  filterability: ColumnFilterability,
  externalFields: readonly string[] = [],
): boolean {
  return (
    filters.some((filter) => isComplete(filter) && filterability[filter.field] === 'always') ||
    externalFields.some((field) => filterability[field] === 'always')
  );
}

/**
 * The control a column draws: none when the metadata says the server will not filter
 * the field or the column opts out, enabled when it will, and waiting when the field
 * filters only beside an indexed one and none is in the request yet.
 */
export function filterControlFor(
  column: { id: string; filterable?: boolean },
  filterability: ColumnFilterability,
  indexedActive: boolean,
): FilterControl {
  const eligibility = filterability[column.id];
  if (column.filterable === false || eligibility === undefined) {
    return 'none';
  }
  if (eligibility === 'withIndexed' && !indexedActive) {
    return 'needsIndexed';
  }
  return 'enabled';
}

/**
 * The filters that stand after a change: once no indexed filter is left in the request,
 * the companion-only (`withIndexed`) filters are cleared with it, since the server would
 * refuse a filter carrying them alone.
 */
export function withoutOrphanedCompanions(
  filters: readonly ColumnFilter[],
  filterability: ColumnFilterability,
  externalFields: readonly string[] = [],
): ColumnFilter[] {
  if (indexedFilterActive(filters, filterability, externalFields)) {
    return [...filters];
  }
  return filters.filter((filter) => filterability[filter.field] !== 'withIndexed');
}

/** One column filter as a typed condition: a list operator splits its value on commas; a null test carries no value. */
export function conditionOf(filter: ColumnFilter): Condition<Record<string, unknown>> {
  const option = operatorOption(filter.operator);
  if (!option.takesValue) {
    return where(filter.field, filter.operator);
  }
  if (option.takesList) {
    return where(
      filter.field,
      filter.operator,
      filter.value
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value !== ''),
    );
  }
  return where(filter.field, filter.operator, filter.value.trim());
}

/**
 * The request filter: the page's own filter, already in the server grammar, and the
 * complete column filters, ANDed as parenthesized groups; empty when neither says
 * anything.
 */
export function composeFilter(pageFilter: string, filters: readonly ColumnFilter[]): string {
  const conditions = filters.filter(isComplete).map(conditionOf);
  const columnClause = conditions.length > 0 ? serializeFilter(and(...conditions)) : '';
  const page = pageFilter.trim();
  if (page !== '' && columnClause !== '') {
    return `(${page}),(${columnClause})`;
  }
  return page !== '' ? page : columnClause;
}
