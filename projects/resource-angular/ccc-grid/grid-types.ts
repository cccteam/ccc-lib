export type FilterOperator =
  | 'contains'
  | 'doesNotContain'
  | 'equals'
  | 'notEqual'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'doesNotContain', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'notEqual', label: 'Not equal to' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal to' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal to' },
];

export interface ColumnFilter {
  operator: FilterOperator;
  value: string;
}

export interface SortRule {
  field: string;
  direction: 'asc' | 'desc';
}

export interface VirtualScrollConfig {
  /**
   * Fixed row height in pixels. When omitted, the grid measures the average
   * rendered height of the rows initially visible in the viewport and uses
   * that measurement for the rest of the grid's lifetime.
   */
  rowHeight?: number;
  /**
   * Number of extra rows rendered above and below the visible viewport, as a
   * buffer against blank flashes while scrolling. For example, if 10 rows are
   * visible and virtualizedPadding is 5, 20 rows are rendered in total (5
   * above, 10 visible, 5 below). Defaults to 5.
   */
  virtualizedPadding?: number;
}
