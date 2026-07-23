import { Component, computed, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppGridComponent } from '@cccteam/ccc-lib/ccc-grid';
import { ColumnConfig, FieldName, RecordData } from '@cccteam/ccc-lib/types';

interface VirtualScrollShowcaseRow extends RecordData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ROW_COUNT = 5000;
const ROLES = ['Engineer', 'Researcher', 'Mathematician', 'Manager', 'Analyst'];

function buildRows(count: number): VirtualScrollShowcaseRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return {
      id,
      name: `Test User ${id}`,
      email: `test.user.${id}@example.com`,
      role: ROLES[index % ROLES.length],
    };
  });
}

@Component({
  selector: 'app-virtual-scroll-grid-showcase',
  standalone: true,
  imports: [AppGridComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './virtual-scroll-grid-showcase.component.html',
  styleUrl: './virtual-scroll-grid-showcase.component.scss',
})
export class VirtualScrollGridShowcaseComponent {
  readonly rowCount = ROW_COUNT;
  rowData = signal<VirtualScrollShowcaseRow[]>(buildRows(ROW_COUNT));

  columnDefs = signal<ColumnConfig[]>([
    { id: 'id' as FieldName, header: 'ID', width: 80 },
    { id: 'name' as FieldName, header: 'Name', width: 220 },
    { id: 'email' as FieldName, header: 'Email', width: 260 },
    { id: 'role' as FieldName, header: 'Role', width: 160 },
  ]);

  rowHeightInput = signal<number | undefined>(undefined);
  virtualizedPadding = signal<number>(5);

  virtualScrollConfig = computed(() => ({
    rowHeight: this.rowHeightInput(),
    virtualizedPadding: this.virtualizedPadding(),
  }));

  onRowHeightChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.rowHeightInput.set(value > 0 ? value : undefined);
  }

  onVirtualizedPaddingChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.virtualizedPadding.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }
}
