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

  private readonly selectedIds = signal<Set<unknown>>(new Set());
  private readonly expandedIds = signal<Set<unknown>>(new Set());
  private readonly filters = signal<Record<string, string>>({});
  private readonly columnWidths = signal<Record<string, number>>({});
  private readonly sortField = signal<string | null>(null);
  private readonly sortDirection = signal<'asc' | 'desc'>('asc');
  private readonly pageIndex = signal<number>(0);

  totalColumnCount = computed(
    () => this.columnDefs().length + (this.selectionType() !== 'none' ? 1 : 0) + (this.enableRowExpansion() ? 1 : 0),
  );

  filteredRows = computed(() => {
    const rows = this.rowData();
    const activeFilters = Object.entries(this.filters()).filter(([, value]) => value.trim() !== '');
    if (!activeFilters.length) {
      return rows;
    }
    return rows.filter((row: RecordData) =>
      activeFilters.every(([field, value]) => {
        const cell = row[field];
        return cell !== null && cell !== undefined && String(cell).toLowerCase().includes(value.toLowerCase());
      }),
    );
  });

  sortedRows = computed(() => {
    const field = this.sortField();
    const rows = this.filteredRows();
    if (!field) {
      return rows;
    }
    const direction = this.sortDirection();
    const sorted = [...rows].sort((a: RecordData, b: RecordData) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal == null && bVal == null) {
        return 0;
      }
      if (aVal == null) {
        return -1;
      }
      if (bVal == null) {
        return 1;
      }
      if (aVal < bVal) {
        return -1;
      }
      if (aVal > bVal) {
        return 1;
      }
      return 0;
    });
    return direction === 'asc' ? sorted : sorted.reverse();
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

  sortIndicator(col: ColumnConfig): 'asc' | 'desc' | null {
    return this.sortField() === col.id ? this.sortDirection() : null;
  }

  toggleSort(col: ColumnConfig): void {
    if (this.sortField() === col.id) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortField.set(null);
      }
    } else {
      this.sortField.set(col.id);
      this.sortDirection.set('asc');
    }
  }

  filterValue(col: ColumnConfig): string {
    return this.filters()[col.id] ?? '';
  }

  setFilter(col: ColumnConfig, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const next = { ...this.filters() };
    if (value) {
      next[col.id] = value;
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
