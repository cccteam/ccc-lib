import { Capability, CapabilitiesQueryParam } from './digest';

/** The operators the server's filter grammar accepts. */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notin' | 'isnull' | 'isnotnull';

export type FilterValue = string | number | boolean | Date;

/** One `field:operator:value` condition. `isnull`/`isnotnull` take no value; `in`/`notin` take a list. */
export interface Condition<Row> {
  field: keyof Row & string;
  op: FilterOperator;
  value?: FilterValue | FilterValue[];
}

export interface AndGroup<Row> {
  and: FilterExpression<Row>[];
}

export interface OrGroup<Row> {
  or: FilterExpression<Row>[];
}

export type FilterExpression<Row> = Condition<Row> | AndGroup<Row> | OrGroup<Row>;

/** A filter: the server's grammar as a string, or a typed expression the client serializes. */
export type Filter<Row> = string | FilterExpression<Row>;

export function where<Row>(
  field: keyof Row & string,
  op: FilterOperator,
  value?: FilterValue | FilterValue[],
): Condition<Row> {
  return { field, op, value };
}

export function and<Row>(...expressions: FilterExpression<Row>[]): AndGroup<Row> {
  return { and: expressions };
}

export function or<Row>(...expressions: FilterExpression<Row>[]): OrGroup<Row> {
  return { or: expressions };
}

/**
 * Renders a filter in the server grammar: conditions are `field:op:value`, lists are
 * parenthesized and comma-separated, `,` joins with AND, `|` with OR, and nested
 * groups are parenthesized.
 */
export function serializeFilter<Row>(filter: Filter<Row>): string {
  if (typeof filter === 'string') {
    return filter;
  }
  if ('and' in filter) {
    return filter.and.map(serializeGroupMember).join(',');
  }
  if ('or' in filter) {
    return filter.or.map(serializeGroupMember).join('|');
  }
  return serializeCondition(filter);
}

function serializeGroupMember<Row>(expression: FilterExpression<Row>): string {
  const rendered = serializeFilter(expression);
  return 'and' in expression || 'or' in expression ? `(${rendered})` : rendered;
}

function serializeCondition<Row>(condition: Condition<Row>): string {
  const { field, op, value } = condition;
  if (value === undefined) {
    return `${field}:${op}`;
  }
  if (Array.isArray(value)) {
    return `${field}:${op}:(${value.map(serializeValue).join(',')})`;
  }
  return `${field}:${op}:${serializeValue(value)}`;
}

function serializeValue(value: FilterValue): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export type SortDirection = 'asc' | 'desc';

export interface Sort<Row> {
  field: keyof Row & string;
  direction?: SortDirection;
}

/**
 * The reserved list parameters. The server answers at most `limit` rows (its default
 * is 50) and rejects any parameter it does not know.
 */
export interface ListQuery<Row> {
  filter?: Filter<Row>;
  sort?: Sort<Row> | Sort<Row>[];
  /** JSON field names to return; omitted means every field the caller may read. */
  columns?: (keyof Row & string)[];
  limit?: number;
  offset?: number;
  /** Ask the server to evaluate these per row and attach the capability envelope. */
  capabilities?: Capability[];
}

export interface ReadOptions<Row> {
  columns?: (keyof Row & string)[];
  capabilities?: Capability[];
}

export function listSearchParams<Row>(query: ListQuery<Row> | undefined): URLSearchParams {
  const params = new URLSearchParams();
  if (!query) {
    return params;
  }
  if (query.filter !== undefined) {
    const filter = serializeFilter(query.filter);
    if (filter !== '') {
      params.set('filter', filter);
    }
  }
  if (query.sort !== undefined) {
    const sorts = Array.isArray(query.sort) ? query.sort : [query.sort];
    if (sorts.length > 0) {
      params.set(
        'sort',
        sorts.map((sort) => (sort.direction ? `${sort.field}:${sort.direction}` : sort.field)).join(','),
      );
    }
  }
  if (query.columns && query.columns.length > 0) {
    params.set('columns', query.columns.join(','));
  }
  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }
  if (query.offset !== undefined) {
    params.set('offset', String(query.offset));
  }
  if (query.capabilities && query.capabilities.length > 0) {
    params.set(CapabilitiesQueryParam, query.capabilities.join(','));
  }
  return params;
}

export function readSearchParams<Row>(options: ReadOptions<Row> | undefined): URLSearchParams {
  return listSearchParams(options);
}
