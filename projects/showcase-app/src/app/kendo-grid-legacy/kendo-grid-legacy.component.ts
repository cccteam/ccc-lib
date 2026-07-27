import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal, TemplateRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CamelCaseToTitlePipe } from '@cccteam/ccc-lib/ccc-camel-case-to-title';
import { TableButtonComponent } from '@cccteam/ccc-lib/ccc-grid';
import { ColumnConfig, RecordData } from '@cccteam/ccc-lib/types';
import { GridDataResult, GridModule, PageChangeEvent, SelectableMode, SelectableSettings } from '@progress/kendo-angular-grid';

/**
 * Snapshot of the pre-rewrite ccc-grid (Kendo UI Angular Grid wrapper), kept only in the
 * showcase app under a renamed selector/class so it can run side-by-side with the new
 * `ccc-grid` for the kendo-perf benchmark. Not part of the published library.
 *
 * The original only ever used `scrollable="none"` + `kendoGridBinding` (a plain in-memory
 * array). `enableVirtualScroll` is an addition for the benchmark: Kendo's `scrollable="virtual"`
 * mode doesn't work with `kendoGridBinding` — it needs the windowed `[data]`/`[skip]` +
 * `(pageChange)` pattern from Kendo's own virtual-scrolling docs, so that path is wired up
 * separately below rather than as a flag on the same binding.
 */
@Component({
  selector: 'kendo-grid-legacy',
  standalone: true,
  imports: [
    GridModule,
    CommonModule,
    TableButtonComponent,
    CamelCaseToTitlePipe,
    RouterModule,
    MatIconButton,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <ng-template #gridColumns>
      @if (selectionMode() !== false) {
        <kendo-grid-checkbox-column
          [width]="40"
          [showSelectAll]="selectionType() === 'multiple'"></kendo-grid-checkbox-column>
      }
      @for (col of columnDefs(); track col.id + col.header) {
        @if (col.buttonConfig) {
          <kendo-grid-column [field]="col.id" [width]="66" [resizable]="col.resizable ?? true">
            <ng-template kendoGridHeaderTemplate> </ng-template>
            <ng-template kendoGridCellTemplate let-dataItem>
              @if (col.buttonConfig.actionType === 'link' && col.buttonConfig.viewRoute) {
                <a
                  mat-icon-button
                  [routerLink]="['/', col.buttonConfig.viewRoute, dataItem['id']]"
                  [matTooltip]="col.buttonConfig.label || ''"
                  [matTooltipPosition]="col.tooltipPosition || 'above'">
                  <mat-icon>{{ col.buttonConfig.icon || 'arrow_forward' }}</mat-icon>
                </a>
              } @else {
                <ccc-table-button
                  [config]="col.buttonConfig"
                  [rowData]="dataItem"
                  [tooltipPosition]="col.tooltipPosition || 'above'"
                  [viewRoute]="col.buttonConfig.viewRoute || ''"
                  [id]="dataItem['id']">
                </ccc-table-button>
              }
            </ng-template>
          </kendo-grid-column>
        } @else {
          @if (col.width) {
            <kendo-grid-column [field]="col.id" [width]="col.width" [resizable]="col.resizable ?? true">
              <ng-template kendoGridHeaderTemplate>
                @if (!col.hideHeader) {
                  <span class="col-header">{{ col.header || col.id | camelCaseToTitle }}</span>
                }
              </ng-template>
              <ng-template kendoGridCellTemplate let-dataItem>{{ dataItem[col.id] }} </ng-template>
            </kendo-grid-column>
          } @else {
            <kendo-grid-column [field]="col.id" [resizable]="col.resizable ?? true">
              <ng-template kendoGridHeaderTemplate>
                @if (!col.hideHeader) {
                  <span class="col-header">{{ col.header || col.id | camelCaseToTitle }}</span>
                }
              </ng-template>
              <ng-template kendoGridCellTemplate let-dataItem>{{ dataItem[col.id] }} </ng-template>
            </kendo-grid-column>
          }
        }
      }
      @if (enableRowExpansion() && detailTemplate()) {
        <ng-template kendoGridDetailTemplate let-dataItem>
          <ng-container *ngTemplateOutlet="detailTemplate()!; context: { $implicit: dataItem }"></ng-container>
        </ng-template>
      }
      <ng-template kendoGridNoRecordsTemplate>
        <div style="text-align: center; padding: 20px;">No records found</div>
      </ng-template>
    </ng-template>

    @if (enableVirtualScroll()) {
      <kendo-grid
        [data]="virtualView()"
        [skip]="virtualSkip()"
        filterable="menu"
        [sortable]="true"
        scrollable="virtual"
        [height]="gridHeight()"
        [rowHeight]="rowHeight()"
        [selectable]="selectionMode()"
        [selectedKeys]="selectedKeys"
        kendoGridSelectBy="id"
        [loading]="loading()"
        (selectedKeysChange)="onSelectedKeysChange($event)"
        (pageChange)="onVirtualPageChange($event)">
        <ng-container *ngTemplateOutlet="gridColumns"></ng-container>
      </kendo-grid>
    } @else {
      <kendo-grid
        [kendoGridBinding]="rowData()"
        filterable="menu"
        [sortable]="true"
        scrollable="none"
        [pageable]="!!pageSize()"
        [pageSize]="pageSize() || 0"
        [selectable]="selectionMode()"
        [selectedKeys]="selectedKeys"
        kendoGridSelectBy="id"
        [loading]="loading()"
        (selectedKeysChange)="onSelectedKeysChange($event)">
        <ng-container *ngTemplateOutlet="gridColumns"></ng-container>
      </kendo-grid>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      kendo-grid {
        height: 100%;
      }
      .col-header {
        font-weight: bold;
      }
      app-table-button {
        position: relative;
        z-index: 10;
      }
      a[mat-button] {
        position: relative;
        z-index: 11;
      }
      ::ng-deep .k-grid .k-grid-aria-root {
        overflow-x: auto; /* Allow horizontal scrolling */
        overflow-y: hidden; /* Keep vertical behavior as needed */
      }
      ::ng-deep .k-grid .k-detail-cell {
        padding: 16px;
      }
    `,
  ],
})
export class KendoGridLegacyComponent {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  rowData = input<any[]>([]);
  columnDefs = input<ColumnConfig[]>([]);
  enableRowExpansion = input<boolean>(false);
  detailTemplate = input<TemplateRef<unknown>>();
  selectionType = input<'multiple' | 'single' | 'none'>('none');
  pageSize = input<number | undefined>(undefined);
  selectedRows = output<RecordData[]>();
  loading = input<boolean>(false);
  /** Kendo's own virtual scrolling (`scrollable="virtual"`), not part of the original production config. */
  enableVirtualScroll = input<boolean>(false);
  rowHeight = input<number>(36);
  gridHeight = input<number>(400);

  public selectedKeys: number[] = [];

  /**
   * Seeds the first windowed slice before Kendo has told us its real `take` via `pageChange` —
   * generous enough to cover the configured viewport plus overscan for any reasonable
   * `gridHeight`/`rowHeight` pairing.
   */
  private readonly initialVirtualTake = computed(() => Math.max(20, Math.ceil(this.gridHeight() / this.rowHeight()) * 3));

  virtualSkip = signal(0);
  private readonly virtualTake = computed(() => this.initialVirtualTake());
  private readonly virtualTakeOverride = signal<number | null>(null);

  virtualView = computed<GridDataResult>(() => {
    const rows = this.rowData();
    const skip = this.virtualSkip();
    const take = this.virtualTakeOverride() ?? this.virtualTake();
    return { data: rows.slice(skip, skip + take), total: rows.length };
  });

  onVirtualPageChange(event: PageChangeEvent): void {
    this.virtualSkip.set(event.skip);
    this.virtualTakeOverride.set(event.take);
  }

  onSelectedKeysChange(keys: number[]): void {
    this.selectedKeys = keys;
    const selectedRows = this.rowData().filter((row: any) => keys.includes(row.id));
    this.selectedRows.emit(selectedRows);
  }

  selectionMode = computed(() => {
    if (this.selectionType() === 'none') {
      return false;
    } else if (this.selectionType() === 'single') {
      return {
        mode: 'single' as SelectableMode,
        checkboxOnly: true,
      } as SelectableSettings;
    } else {
      return {
        mode: 'multiple' as SelectableMode,
        checkboxOnly: true,
      } as SelectableSettings;
    }
  });
}
