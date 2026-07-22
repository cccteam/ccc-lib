import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal, TemplateRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CamelCaseToTitlePipe } from '@cccteam/ccc-lib/ccc-camel-case-to-title';
import { ColumnConfig, RecordData } from '@cccteam/ccc-lib/types';
import { TableButtonComponent } from './table-button/table-button.component';

const MIN_COLUMN_WIDTH = 48;
const ACTION_COLUMN_WIDTH = 66;

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

interface ColumnFilter {
  operator: FilterOperator;
  value: string;
}

interface SortRule {
  field: string;
  direction: 'asc' | 'desc';
}

function compareCellToFilterValue(cellValue: unknown, filterValue: string): number {
  const cellNum = typeof cellValue === 'number' ? cellValue : Number(cellValue);
  const filterNum = Number(filterValue);
  if (cellValue !== null && cellValue !== undefined && cellValue !== '' && !Number.isNaN(cellNum) && !Number.isNaN(filterNum)) {
    return cellNum - filterNum;
  }
  const cellStr = cellValue == null ? '' : String(cellValue);
  return cellStr.localeCompare(filterValue);
}

function matchesFilter(cellValue: unknown, filter: ColumnFilter): boolean {
  const value = filter.value.trim();
  if (!value) {
    return true;
  }

  if (filter.operator === 'gt' || filter.operator === 'gte' || filter.operator === 'lt' || filter.operator === 'lte') {
    const cmp = compareCellToFilterValue(cellValue, value);
    switch (filter.operator) {
      case 'gt':
        return cmp > 0;
      case 'gte':
        return cmp >= 0;
      case 'lt':
        return cmp < 0;
      case 'lte':
        return cmp <= 0;
    }
  }

  const cell = cellValue == null ? '' : String(cellValue).toLowerCase();
  const needle = value.toLowerCase();
  switch (filter.operator) {
    case 'doesNotContain':
      return !cell.includes(needle);
    case 'equals':
      return cell === needle;
    case 'notEqual':
      return cell !== needle;
    case 'startsWith':
      return cell.startsWith(needle);
    case 'endsWith':
      return cell.endsWith(needle);
    case 'contains':
    default:
      return cell.includes(needle);
  }
}

@Component({
  selector: 'ccc-grid',
  standalone: true,
  imports: [
    CommonModule,
    TableButtonComponent,
    CamelCaseToTitlePipe,
    RouterModule,
    MatIconButton,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ccc-grid.component.html',
  styleUrl: './ccc-grid.component.scss',
})
export class AppGridComponent {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  rowData = input<any[]>([]);
  columnDefs = input<ColumnConfig[]>([]);
  enableRowExpansion = input<boolean>(false);
  detailTemplate = input<TemplateRef<unknown>>();
  selectionType = input<'multiple' | 'single' | 'none'>('none');
  pageSize = input<number | undefined>(undefined);
  selectedRows = output<RecordData[]>();
  loading = input<boolean>(false);

  readonly filterOperators = FILTER_OPERATORS;

  private readonly selectedIds = signal<Set<unknown>>(new Set());
  private readonly expandedIds = signal<Set<unknown>>(new Set());
  private readonly filters = signal<Record<string, ColumnFilter>>({});
  private readonly columnWidths = signal<Record<string, number>>({});
  private readonly sorts = signal<SortRule[]>([]);
  private readonly pageIndex = signal<number>(0);

  totalColumnCount = computed(
    () => this.columnDefs().length + (this.selectionType() !== 'none' ? 1 : 0) + (this.enableRowExpansion() ? 1 : 0),
  );

  filteredRows = computed(() => {
    const rows = this.rowData();
    const activeFilters = Object.entries(this.filters()).filter(([, filter]) => filter.value.trim() !== '');
    if (!activeFilters.length) {
      return rows;
    }
    return rows.filter((row: RecordData) => activeFilters.every(([field, filter]) => matchesFilter(row[field], filter)));
  });

  sortedRows = computed(() => {
    const sorts = this.sorts();
    const rows = this.filteredRows();
    if (!sorts.length) {
      return rows;
    }
    return [...rows].sort((a: RecordData, b: RecordData) => {
      for (const { field, direction } of sorts) {
        const aVal = a[field];
        const bVal = b[field];
        let cmp = 0;
        if (aVal == null && bVal == null) {
          cmp = 0;
        } else if (aVal == null) {
          cmp = -1;
        } else if (bVal == null) {
          cmp = 1;
        } else if (aVal < bVal) {
          cmp = -1;
        } else if (aVal > bVal) {
          cmp = 1;
        }
        if (cmp !== 0) {
          return direction === 'asc' ? cmp : -cmp;
        }
      }
      return 0;
    });
  });

  displayPageIndex = computed(() => {
    const size = this.pageSize();
    if (!size) {
      return 0;
    }
    const maxIndex = Math.max(0, Math.ceil(this.sortedRows().length / size) - 1);
    return Math.min(this.pageIndex(), maxIndex);
  });

  pageCount = computed(() => {
    const size = this.pageSize();
    if (!size) {
      return 1;
    }
    return Math.max(1, Math.ceil(this.sortedRows().length / size));
  });

  pagedRows = computed(() => {
    const size = this.pageSize();
    const rows = this.sortedRows();
    if (!size) {
      return rows;
    }
    const start = this.displayPageIndex() * size;
    return rows.slice(start, start + size);
  });

  allSelected = computed(() => {
    const rows = this.filteredRows();
    return rows.length > 0 && rows.every((row: RecordData) => this.selectedIds().has(row['id']));
  });

  someSelected = computed(
    () => !this.allSelected() && this.filteredRows().some((row: RecordData) => this.selectedIds().has(row['id'])),
  );

  isSelected(row: RecordData): boolean {
    return this.selectedIds().has(row['id']);
  }

  toggleRow(row: RecordData): void {
    const mode = this.selectionType();
    if (mode === 'none') {
      return;
    }

    const id = row['id'];
    const current = new Set(this.selectedIds());
    if (mode === 'single') {
      const wasSelected = current.has(id);
      current.clear();
      if (!wasSelected) {
        current.add(id);
      }
    } else if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }

    this.selectedIds.set(current);
    this.emitSelectedRows();
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filteredRows().map((row: RecordData) => row['id'])));
    }
    this.emitSelectedRows();
  }

  private emitSelectedRows(): void {
    const ids = this.selectedIds();
    const selected = this.rowData().filter((row: RecordData) => ids.has(row['id']));
    this.selectedRows.emit(selected);
  }

  isExpanded(row: RecordData): boolean {
    return this.expandedIds().has(row['id']);
  }

  toggleExpand(row: RecordData): void {
    const id = row['id'];
    const current = new Set(this.expandedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedIds.set(current);
  }

  /** Direction plus 1-based priority among active sorts, or null if this column isn't sorted. */
  sortInfo(col: ColumnConfig): { direction: 'asc' | 'desc'; priority: number } | null {
    const sorts = this.sorts();
    const index = sorts.findIndex((sort) => sort.field === col.id);
    return index === -1 ? null : { direction: sorts[index].direction, priority: index + 1 };
  }

  hasMultipleSorts(): boolean {
    return this.sorts().length > 1;
  }

  /** Click sorts by this column alone; shift-click adds/cycles it as an additional sort key. */
  toggleSort(col: ColumnConfig, event: MouseEvent): void {
    const field = col.id;
    const current = this.sorts();

    if (!event.shiftKey) {
      const isSoleSort = current.length === 1 && current[0].field === field;
      if (!isSoleSort) {
        this.sorts.set([{ field, direction: 'asc' }]);
      } else if (current[0].direction === 'asc') {
        this.sorts.set([{ field, direction: 'desc' }]);
      } else {
        this.sorts.set([]);
      }
      return;
    }

    const existingIndex = current.findIndex((sort) => sort.field === field);
    if (existingIndex === -1) {
      this.sorts.set([...current, { field, direction: 'asc' }]);
    } else if (current[existingIndex].direction === 'asc') {
      const next = [...current];
      next[existingIndex] = { field, direction: 'desc' };
      this.sorts.set(next);
    } else {
      this.sorts.set(current.filter((_, index) => index !== existingIndex));
    }
  }

  filterOperator(col: ColumnConfig): FilterOperator {
    return this.filters()[col.id]?.operator ?? 'contains';
  }

  filterValue(col: ColumnConfig): string {
    return this.filters()[col.id]?.value ?? '';
  }

  hasFilter(col: ColumnConfig): boolean {
    return (this.filters()[col.id]?.value ?? '').trim() !== '';
  }

  setFilterOperator(col: ColumnConfig, event: Event): void {
    const operator = (event.target as HTMLSelectElement).value as FilterOperator;
    const next = { ...this.filters() };
    next[col.id] = { operator, value: this.filterValue(col) };
    this.filters.set(next);
    this.pageIndex.set(0);
  }

  setFilterValue(col: ColumnConfig, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const next = { ...this.filters() };
    if (value) {
      next[col.id] = { operator: this.filterOperator(col), value };
    } else {
      delete next[col.id];
    }
    this.filters.set(next);
    this.pageIndex.set(0);
  }

  clearFilter(col: ColumnConfig): void {
    if (!(col.id in this.filters())) {
      return;
    }
    const next = { ...this.filters() };
    delete next[col.id];
    this.filters.set(next);
  }

  widthFor(col: ColumnConfig): number | null {
    const defaultWidth = col.buttonConfig ? ACTION_COLUMN_WIDTH : null;
    return this.columnWidths()[col.id] ?? col.width ?? defaultWidth;
  }

  startResize(event: MouseEvent, col: ColumnConfig): void {
    event.preventDefault();
    event.stopPropagation();

    const header = (event.currentTarget as HTMLElement).parentElement;
    const startWidth = this.widthFor(col) ?? header?.getBoundingClientRect().width ?? 120;
    const startX = event.clientX;

    const onMove = (moveEvent: MouseEvent): void => {
      const nextWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + (moveEvent.clientX - startX));
      this.columnWidths.set({ ...this.columnWidths(), [col.id]: nextWidth });
    };
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  goToPage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Math.trunc(Number(input.value));
    if (!Number.isFinite(value) || !this.pageSize()) {
      input.value = String(this.displayPageIndex() + 1);
      return;
    }

    const page = Math.min(Math.max(value, 1), this.pageCount());
    this.pageIndex.set(page - 1);
    input.value = String(page);
  }
}
