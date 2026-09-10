import { EnumeratedConfig } from '@cccteam/resource-angular/types';

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
 * when the listed resource has no read handler (readDisabled), so no record can be
 * fetched by id: the matching option, or the id shown as itself when the list holds no
 * match, never a blank.
 */
export function displayFromOptions(options: readonly PickerOption[], value: string): PickerOption {
  return options.find((option) => option.id === value) ?? { id: value, display: value };
}
