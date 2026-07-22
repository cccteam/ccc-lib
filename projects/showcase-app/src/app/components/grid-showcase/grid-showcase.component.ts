import { Component, computed, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppGridComponent } from '@cccteam/ccc-lib/ccc-grid';
import { ColumnConfig, FieldName, RecordData } from '@cccteam/ccc-lib/types';

interface GridShowcaseRow extends RecordData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ROWS: GridShowcaseRow[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com', role: 'Engineer' },
  { id: 3, name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher' },
  { id: 4, name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Engineer' },
  { id: 5, name: 'Katherine Johnson', email: 'katherine@example.com', role: 'Mathematician' },
  { id: 6, name: 'Radia Perlman', email: 'radia@example.com', role: 'Engineer' },
  { id: 7, name: 'Tim Berners-Lee', email: 'tim@example.com', role: 'Researcher' },
  { id: 8, name: 'Barbara Liskov', email: 'barbara@example.com', role: 'Researcher' },
  { id: 9, name: 'Donald Knuth', email: 'donald@example.com', role: 'Researcher' },
  { id: 10, name: 'Linus Torvalds', email: 'linus@example.com', role: 'Engineer' },
  { id: 11, name: 'Guido van Rossum', email: 'guido@example.com', role: 'Engineer' },
  { id: 12, name: 'Anita Borg', email: 'anita@example.com', role: 'Engineer' },
];

@Component({
  selector: 'app-grid-showcase',
  standalone: true,
  imports: [AppGridComponent, MatFormFieldModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './grid-showcase.component.html',
  styleUrl: './grid-showcase.component.scss',
})
export class GridShowcaseComponent {
  rowData = signal<GridShowcaseRow[]>(ROWS);

  columnDefs = signal<ColumnConfig[]>([
    { id: 'id' as FieldName, header: 'ID', width: 60 },
    { id: 'name' as FieldName, header: 'Name' },
    { id: 'email' as FieldName, header: 'Email', width: 240 },
    { id: 'role' as FieldName, header: 'Role', width: 160, hideHeader: true },
    {
      id: 'view' as FieldName,
      buttonConfig: {
        label: 'View',
        icon: 'visibility',
        actionType: 'link',
        viewRoute: 'view',
      },
    },
    {
      id: 'notify' as FieldName,
      buttonConfig: {
        label: 'Notify',
        icon: 'notifications',
        actionType: 'function',
        action: (row) => this.actionLog.set(`Notify clicked for id ${row.id}`),
      },
    },
  ]);

  selectionType = signal<'multiple' | 'single' | 'none'>('none');
  pageSize = signal<number | undefined>(undefined);
  loading = signal<boolean>(false);
  enableRowExpansion = signal<boolean>(false);

  selectedRows = signal<RecordData[]>([]);
  selectedSummary = computed(() => {
    const rows = this.selectedRows();
    if (!rows.length) {
      return `Selected: ${rows.length}`;
    }
    return `Selected: ${rows.length} (${rows.map((row) => row['id']).join(', ')})`;
  });
  actionLog = signal<string>('');

  onSelectionTypeChange(event: MatSelectChange): void {
    this.selectionType.set(event.value);
  }

  onPageSizeChange(event: MatSelectChange): void {
    this.pageSize.set(event.value === 0 ? undefined : event.value);
  }

  onLoadingChange(event: MatSlideToggleChange): void {
    this.loading.set(event.checked);
  }

  onRowExpansionChange(event: MatSlideToggleChange): void {
    this.enableRowExpansion.set(event.checked);
  }

  onSelectedRowsChange(rows: RecordData[]): void {
    this.selectedRows.set(rows);
  }
}
