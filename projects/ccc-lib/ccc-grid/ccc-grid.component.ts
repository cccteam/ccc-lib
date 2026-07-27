import { CommonModule } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
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
import { matchesFilter } from './grid-filter.util';
import { ColumnFilter, FILTER_OPERATORS, FilterOperator, SortRule, VirtualScrollConfig } from './grid-types';
import { VirtualScrollState } from './grid-virtual-scroll';
import { TableButtonComponent } from './table-button/table-button.component';

const MIN_COLUMN_WIDTH = 48;
const ACTION_COLUMN_WIDTH = 66;

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
  enableVirtualScroll = input<boolean>(false);
  virtualScrollConfig = input<VirtualScrollConfig>({});

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

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private readonly tableBody = viewChild<ElementRef<HTMLTableSectionElement>>('tableBody');

  private readonly virtualScroll = new VirtualScrollState(
    computed(() => this.pagedRows().length),
    this.virtualScrollConfig,
  );

  /** The rows actually rendered in the DOM: all of `pagedRows` normally, or a scroll-windowed slice when virtualized. */
  visibleRows = computed(() => {
    if (!this.enableVirtualScroll()) {
      return this.pagedRows();
    }
    const { start, end } = this.virtualScroll.range();
    return this.pagedRows().slice(start, end);
  });

  virtualTopPadding = computed(() => (this.enableVirtualScroll() ? this.virtualScroll.topPadding() : 0));
  virtualBottomPadding = computed(() => (this.enableVirtualScroll() ? this.virtualScroll.bottomPadding() : 0));

  constructor() {
    // Measures the average rendered row height from the initial unvirtualized probe batch
    // (see INITIAL_PROBE_ROW_COUNT) so the rest of the grid's virtualization math has a
    // rowHeight to work with when one isn't explicitly configured. Uses afterRenderEffect
    // (rather than effect) because it must run once the probe rows have actually been
    // patched into the DOM, not just once the signals driving them have settled.
    afterRenderEffect(() => {
      if (!this.enableVirtualScroll() || this.virtualScroll.rowHeight() !== undefined) {
        return;
      }
      const rows = this.visibleRows();
      const body = this.tableBody()?.nativeElement;
      if (!body || !rows.length) {
        return;
      }
      const sampleRows = Array.from(body.querySelectorAll<HTMLTableRowElement>('tr.ccc-row'));
      if (!sampleRows.length) {
        return;
      }
      const average = sampleRows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0) / sampleRows.length;
      this.virtualScroll.measureRowHeight(average);
    });

    afterRenderEffect((onCleanup) => {
      if (!this.enableVirtualScroll()) {
        return;
      }
      const container = this.scrollContainer()?.nativeElement;
      if (!container) {
        return;
      }

      this.virtualScroll.setViewportHeight(container.clientHeight);
      const observer = new ResizeObserver((entries) => {
        const height = entries[0]?.contentRect.height;
        if (height !== undefined) {
          this.virtualScroll.setViewportHeight(height);
        }
      });
      observer.observe(container);
      onCleanup(() => observer.disconnect());
    });
  }

  onScroll(event: Event): void {
    this.virtualScroll.setScrollTop((event.target as HTMLElement).scrollTop);
  }

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
