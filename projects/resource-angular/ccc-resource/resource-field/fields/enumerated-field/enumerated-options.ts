import { EnumeratedConfig } from '@cccteam/resource-angular/types';
import { ApiError } from '@cccteam/resource';

/** An option of an enumerated picker: the id it stores and the text shown for it. */
export interface PickerOption {
  id: string;
  display: string;
}

/**
 * The columns an enumerated field asks the listed resource for: the id it stores plus
 * whatever the display concatenates, once each. Asking explicitly matters: a resource
 * whose fields carry no read permission of their own — a computed catalog served from
 * another service, say — answers a request with no columns parameter with one empty
 * object per row.
 */
export function optionColumns(config: Pick<EnumeratedConfig, 'listDisplay' | 'viewDisplay'>): string[] {
  return [...new Set<string>(['id', ...config.listDisplay, ...config.viewDisplay])];
}

/**
 * Narrows the loaded options to what was typed: the display text as a case-insensitive
 * substring, or the id as a substring, so an identifier can be pasted in. An empty or
 * blank query keeps every option. The server has no substring search; options are
 * fetched once and narrowed here.
 */
export function matchOptions(options: readonly PickerOption[], query: string): PickerOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...options];
  }
  return options.filter(
    (option) => option.display.toLowerCase().includes(needle) || option.id.toLowerCase().includes(needle),
  );
}

/**
 * The display of a stored value resolved from the option list — the path a picker takes
 * on a source read whole (no maximum page size), where the list holds every row and a
 * read route is not needed: the matching option, or the id shown as itself when the
 * list holds no match, never a blank.
 */
export function displayFromOptions(options: readonly PickerOption[], value: string): PickerOption {
  return options.find((option) => option.id === value) ?? { id: value, display: value };
}

/**
 * The options a paged picker offers: the open page's rows, with the chosen value's own
 * option ahead of them when the page does not hold it, so the control shows what is
 * stored whichever page is open. The page alone when nothing is chosen.
 */
export function withChosen(page: readonly PickerOption[], chosen: PickerOption | undefined): PickerOption[] {
  if (!chosen || page.some((option) => option.id === chosen.id)) {
    return [...page];
  }
  return [chosen, ...page];
}

/**
 * What a picker says when its request failed: the server's own words for a refusal (a
 * 403 on the listed resource; a 400 on the request, a bounded source with no order and
 * no configured sort, say), a plain sentence for any other failure, nothing while it
 * works. A refused picker must never read as an empty list.
 */
export function pickerRefusal(error: unknown): string | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }
  if (error instanceof ApiError && error.status === 403) {
    return `This picker is not available to you: ${error.message}`;
  }
  if (error instanceof ApiError && error.status === 400) {
    return `The server refused this picker's request: ${error.message}`;
  }
  return `This picker could not be loaded: ${error instanceof Error ? error.message : String(error)}`;
}
