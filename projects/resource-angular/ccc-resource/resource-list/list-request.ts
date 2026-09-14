import { ApiError, ResourceMeta } from '@cccteam/resource';
import { ColumnFilterability, PageTurn } from '@cccteam/resource-angular/ccc-grid';

// The list page's pure parts around the server's page: which columns the server filters,
// where the page sits after a turn, and what an empty table says.

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
