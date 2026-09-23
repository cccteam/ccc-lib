import { FilterEligibility, FilterOperator } from '@cccteam/resource';
import { RecordData } from '@cccteam/resource-angular/types';

export type { FilterEligibility, FilterOperator } from '@cccteam/resource';

/**
 * A row's identity in the grid: what the row track expression, the selection, and the
 * expansion are keyed by. The grid asks it for every row of the page with the row's
 * position in the page; a list page hands it the row's key fields joined into one value,
 * and a grid given none identifies each row by its position.
 */
export type RowKey = (row: RecordData, index: number) => unknown;

/** One of the server's filter operators as the column filter menu offers it. */
export interface FilterOperatorOption {
  value: FilterOperator;
  label: string;
  /** Whether the operator compares against a value; the null tests take none. */
  takesValue: boolean;
  /** Whether the value is a comma-separated list. */
  takesList: boolean;
}

/**
 * The server's filter grammar, and nothing else: a filter the grid offers is one the
 * server answers. A substring match is not in the grammar, so none is offered.
 */
export const FILTER_OPERATORS: readonly FilterOperatorOption[] = [
  { value: 'eq', label: 'Equals', takesValue: true, takesList: false },
  { value: 'ne', label: 'Not equal to', takesValue: true, takesList: false },
  { value: 'gt', label: 'Greater than', takesValue: true, takesList: false },
  { value: 'gte', label: 'Greater than or equal to', takesValue: true, takesList: false },
  { value: 'lt', label: 'Less than', takesValue: true, takesList: false },
  { value: 'lte', label: 'Less than or equal to', takesValue: true, takesList: false },
  { value: 'in', label: 'One of', takesValue: true, takesList: true },
  { value: 'notin', label: 'None of', takesValue: true, takesList: true },
  { value: 'isnull', label: 'Is empty', takesValue: false, takesList: false },
  { value: 'isnotnull', label: 'Is not empty', takesValue: false, takesList: false },
];

/** One column's filter as the grid holds it: the field, the operator, and the typed value (a comma list for `in`/`notin`, empty for the null tests). */
export interface ColumnFilter {
  field: string;
  operator: FilterOperator;
  value: string;
}

/** One sort the rows were requested in. */
export interface SortRule {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Which columns the server filters, by column id: the generated field metadata's
 * `filterable` for the field the column shows. A column absent here draws no filter
 * control.
 */
export type ColumnFilterability = Readonly<Record<string, FilterEligibility | undefined>>;

/**
 * The control a column header draws: none where the server would refuse a filter,
 * enabled where it answers one, or waiting for an indexed filter to join first — a
 * `withIndexed` column is accepted only beside one.
 */
export type FilterControl = 'none' | 'enabled' | 'needsIndexed';

/** Where the rows sit in the server's list: the rows before this page, whether neighbors exist, and the total when the first page asked for it. */
export interface GridPageState {
  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
  total?: number;
}

/** A page turn the grid asks for; the data source performs it. */
export type PageTurn = 'first' | 'prev' | 'next';

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
