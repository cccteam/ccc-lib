import { ResourceMeta } from '@cccteam/resource';
import { CamelCaseToTitlePipe } from '@cccteam/resource-angular/ccc-camel-case-to-title';

// What a search box over a resource searches for this caller, and how it says so. The
// set is the resource's (its metadata's searchFields) narrowed by the caller's grants,
// never the page's: a picker's box names the same fields as the list page of the same
// resource, and a page that should search fewer fields lists a view projecting fewer.

const title = new CamelCaseToTitlePipe();

/**
 * The search fields the box reads for this caller: the metadata's searchFields less the
 * fields the digest denies for List. `listable` is the digest's field set for the resource,
 * undefined when the digest carries no field information, which narrows nothing. A
 * child's field, under its dotted name, stays: its permission is the child resource's,
 * which the server applies when it drops the branch, and the metadata does not name the
 * child resource for the browser to ask.
 */
export function searchedFields(meta: ResourceMeta | undefined, listable: ReadonlySet<string> | undefined): string[] {
  return (meta?.searchFields ?? []).filter((field) => field.includes('.') || listable === undefined || listable.has(field));
}

/** The resource's search fields the digest denies this caller, so the box can say what it does not search. */
export function deniedSearchFields(meta: ResourceMeta | undefined, listable: ReadonlySet<string> | undefined): string[] {
  if (listable === undefined) {
    return [];
  }
  return (meta?.searchFields ?? []).filter((field) => !field.includes('.') && !listable.has(field));
}

/**
 * A search field's label: the header the page configured for its column, else its name
 * in title case; a child's dotted field under the child's name and its own.
 */
export function searchFieldLabel(field: string, headers: ReadonlyMap<string, string> = new Map()): string {
  const header = headers.get(field);
  if (header) {
    return header;
  }
  return field
    .split('.')
    .map((part) => title.transform(part))
    .join(' ');
}

/** What the box's placeholder says: the fields it searches, by label; "Search" alone when it can name none. */
export function searchPlaceholder(labels: readonly string[]): string {
  return labels.length === 0 ? 'Search' : `Search ${labels.join(', ')}`;
}

/** What the box says under itself about the fields the caller's role leaves out; nothing when none. */
export function searchDeniedHint(labels: readonly string[]): string {
  return labels.length === 0 ? '' : `Not searched for your role: ${labels.join(', ')}`;
}
