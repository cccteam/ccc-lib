import { ApiError, Resource, ResourceMeta } from '@cccteam/resource';
import { ColumnFilterability, PageTurn } from '@cccteam/resource-angular/ccc-grid';
import { keyFields, ListViewConfig } from '@cccteam/resource-angular/types';

// The list page's pure parts around the server's page: which columns the server filters,
// where the page sits after a turn, what an empty table says, and what a key-less
// resource's page refuses.

/**
 * Refuses a list configuration asking a key-less resource for what its page cannot have.
 * A resource whose metadata carries no key field (a `@computed` or `@virtual` struct with
 * no `@primarykey`) is served whole: its page is the whole list, every row identified by
 * its position, so there is no page size to set and no key to open an expanded row by.
 * A `pageSize` or `enableRowExpansion` on such a page is a configuration error and
 * throws when the page is built, naming the resource and the reason, as `rowRouteTarget`
 * does for a `rowRoute` naming no target. A keyed resource passes untouched.
 */
export function refuseKeylessConfig(
  resource: Resource,
  config: Pick<ListViewConfig, 'pageSize' | 'enableRowExpansion'>,
  meta: ResourceMeta | undefined,
): void {
  if (keyFields(meta).length > 0) {
    return;
  }
  if (config.pageSize !== undefined) {
    throw new Error(
      `${resource}: pageSize ${config.pageSize} is set, but the resource declares no primary key, so its list is served whole, no page size`,
    );
  }
  if (config.enableRowExpansion) {
    throw new Error(
      `${resource}: enableRowExpansion is set, but the resource declares no primary key, so there is no key to open a row by`,
    );
  }
}

/**
 * Which of the table's columns the server filters: the generated metadata's `filterable`
 * for the field each column shows, keyed by column id. A column whose id is not a field
 * of the listed resource (an action column, a renamed duplicate) is absent, so it draws
 * no control.
 */
export function filterEligibility(meta: ResourceMeta | undefined, columns: readonly { id: string }[]): ColumnFilterability {
  const byField = new Map((meta?.fields ?? []).map((field) => [field.fieldName, field.filterable]));
  const eligibility: Record<string, ColumnFilterability[string]> = {};
  for (const column of columns) {
    const filterable = byField.get(column.id);
    if (filterable !== undefined) {
      eligibility[column.id] = filterable;
    }
  }
  return eligibility;
}

/** Where a page sits: the rows before it, and the total the first page answered. */
export interface PagePosition {
  offset: number;
  total?: number;
}

/**
 * The position after a page lands. A first page starts at zero with its own total. A
 * turn moves the offset by the rows passed — forward by the page left, back by the page
 * landed on — and keeps the first page's total, since later pages carry none. A reload
 * stays put and takes a fresh total when the page carries one.
 */
export function positionAfter(
  position: PagePosition,
  turn: PageTurn | 'reload',
  leftRows: number,
  landed: { rows: number; total?: number },
): PagePosition {
  switch (turn) {
    case 'first':
      return { offset: 0, total: landed.total };
    case 'next':
      return { offset: position.offset + leftRows, total: landed.total ?? position.total };
    case 'prev':
      return { offset: Math.max(0, position.offset - landed.rows), total: landed.total ?? position.total };
    case 'reload':
      return { offset: position.offset, total: landed.total ?? position.total };
  }
}

/**
 * The pager's label under a paged reader: the rows on this page as a range of the total
 * the first page answered ("1–25 of 200"), the range alone when no total was asked, and
 * "No rows" for an empty page.
 */
export function pageLabel(offset: number, rows: number, total: number | undefined): string {
  if (rows === 0) {
    return total === undefined || total === 0 ? 'No rows' : `No rows here of ${total}`;
  }
  const range = `${offset + 1}–${offset + rows}`;
  return total === undefined ? range : `${range} of ${total}`;
}

/**
 * What the empty table says: the refusal when the digest leaves no column, the server's
 * own message when it refused the request (a 403 on the list, a 400 on a filter or page
 * size it will not serve) or the request failed, otherwise the plain empty-list text. A
 * refusal must never read as an empty list.
 */
export function listEmptyMessage(error: unknown, noListableColumns: boolean): string {
  if (noListableColumns) {
    return 'Your permissions cover none of the columns on this page.';
  }
  if (error instanceof ApiError && error.status === 403) {
    return `This list is not available to you: ${error.message}`;
  }
  if (error instanceof ApiError && error.status === 400) {
    return `The server refused this list's request: ${error.message}`;
  }
  if (error) {
    return `This list could not be loaded: ${error instanceof Error ? error.message : String(error)}`;
  }
  return 'No records found';
}
