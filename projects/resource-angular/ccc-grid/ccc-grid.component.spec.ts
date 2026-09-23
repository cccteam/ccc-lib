import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { RecordData } from '@cccteam/resource-angular/types';

import { AppGridComponent } from './ccc-grid.component';
import { RowKey } from './grid-types';

// The grid identifies a row by `rowKey`, the caller's function from a row to its identity,
// or by the row's position in the page when the caller passes none. The track expression,
// the selection, and the expansion are keyed by it, so two rows alike in every field, or
// alike in a field called `id`, are still two rows.

describe('AppGridComponent', () => {
  let fixture: ComponentFixture<AppGridComponent>;
  let component: AppGridComponent;

  const create = async (rows: RecordData[], rowKey: RowKey | undefined): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [AppGridComponent],
      providers: [provideResourceTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppGridComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rowData', rows);
    fixture.componentRef.setInput('columnDefs', Object.keys(rows[0]).map((id) => ({ id })));
    fixture.componentRef.setInput('selectionType', 'multiple');
    fixture.componentRef.setInput('enableRowExpansion', true);
    fixture.componentRef.setInput('rowKey', rowKey);
    fixture.detectChanges();
  };

  const selectedInDom = (): number => (fixture.nativeElement as HTMLElement).querySelectorAll('tr.ccc-row.selected').length;

  const cases: { name: string; rows: RecordData[]; rowKey: RowKey | undefined; pick: number; wantKey: unknown }[] = [
    {
      name: 'a compound key the caller joins',
      rows: [
        { squadronId: 'sq-1', pilotId: 'p-1' },
        { squadronId: 'sq-1', pilotId: 'p-2' },
      ],
      rowKey: (row): string => {
        return `${row['squadronId']}/${row['pilotId']}`;
      },
      pick: 0,
      wantKey: 'sq-1/p-1',
    },
    {
      name: 'a key not named id, with id alike on every row',
      rows: [
        { code: 'A', id: 'same' },
        { code: 'B', id: 'same' },
      ],
      rowKey: (row): unknown => {
        return row['code'];
      },
      pick: 1,
      wantKey: 'B',
    },
    {
      name: 'no key: the position, with every field alike',
      rows: [{ section: 'General' }, { section: 'General' }],
      rowKey: undefined,
      pick: 1,
      wantKey: 1,
    },
  ];

  for (const tt of cases) {
    describe(tt.name, () => {
      const other = 1 - tt.pick;

      beforeEach(async () => {
        await create(tt.rows, tt.rowKey);
      });

      it('identifies the row by it', () => {
        expect(component.keyOf(tt.rows[tt.pick])).toEqual(tt.wantKey);
        expect(component.keyOf(tt.rows[other])).not.toEqual(tt.wantKey);
      });

      it('selects the one row, and selecting all selects both', () => {
        const emitted: RecordData[][] = [];
        component.selectedRows.subscribe((rows) => emitted.push(rows));

        component.toggleRow(tt.rows[tt.pick]);
        fixture.detectChanges();
        expect(component.isSelected(tt.rows[tt.pick])).toBe(true);
        expect(component.isSelected(tt.rows[other])).toBe(false);
        expect(component.allSelected()).toBe(false);
        expect(component.someSelected()).toBe(true);
        expect(selectedInDom()).toBe(1);
        expect(emitted.at(-1)).toEqual([tt.rows[tt.pick]]);

        component.toggleSelectAll();
        fixture.detectChanges();
        expect(component.allSelected()).toBe(true);
        expect(selectedInDom()).toBe(2);
        expect(emitted.at(-1)?.length).toBe(2);
      });

      it('expands the one row', () => {
        component.toggleExpand(tt.rows[tt.pick]);
        expect(component.isExpanded(tt.rows[tt.pick])).toBe(true);
        expect(component.isExpanded(tt.rows[other])).toBe(false);

        component.toggleExpand(tt.rows[tt.pick]);
        expect(component.isExpanded(tt.rows[tt.pick])).toBe(false);
      });

      it('draws both rows', () => {
        expect((fixture.nativeElement as HTMLElement).querySelectorAll('tr.ccc-row').length).toBe(2);
      });
    });
  }

  // jsdom, where an application's specs run, has no ResizeObserver: the grid keeps the
  // one measurement of its container and draws the page instead of failing in its render hook.
  it('draws the page under virtual scroll where the environment has no ResizeObserver', async () => {
    expect(typeof ResizeObserver).toBe('undefined');
    await create([{ section: 'General' }, { section: 'Flight' }], undefined);
    fixture.componentRef.setInput('enableVirtualScroll', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tr.ccc-row').length).toBe(2);
  });
});
