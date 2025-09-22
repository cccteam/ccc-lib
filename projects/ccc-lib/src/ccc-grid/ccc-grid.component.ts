import { CommonModule } from '@angular/common';
import { Component, computed, input, output, TemplateRef } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CamelCaseToTitlePipe } from '@cccteam/ccc-lib/src/ccc-camel-case-to-title';
import { ColumnConfig, RecordData } from '@cccteam/ccc-lib/src/types';
import { GridModule, SelectableMode, SelectableSettings } from '@progress/kendo-angular-grid';
import { TableButtonComponent } from './table-button/table-button.component';

@Component({
  selector: 'ccc-grid',
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
    <kendo-grid
      [kendoGridBinding]="rowData()"
      filterable="menu"
      [sortable]="true"
      scrollable="none"
      [selectable]="selectionMode()"
      [selectedKeys]="selectedKeys"
      kendoGridSelectBy="id"
      (selectedKeysChange)="onSelectedKeysChange($event)">
      @if (selectionMode() !== false) {
        <kendo-grid-checkbox-column
          [width]="40"
          [showSelectAll]="selectionType() === 'multiple'"></kendo-grid-checkbox-column>
      }
      @for (col of columnDefs(); track col.id + col.header) {
        @if (col.buttonConfig) {
          <kendo-grid-column
            [field]="col.id"
            [filterable]="false"
            [sortable]="false"
            [width]="66"
            [resizable]="col.resizable ?? true">
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
      <ng-template kendoGridNoRecordsTemplate>
        <div style="text-align: center; padding: 20px;">No records found</div>
      </ng-template>
    </kendo-grid>
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
      ccc-table-button {
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
    `,
  ],
})
export class AppGridComponent {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  rowData = input<any[]>([]);
  columnDefs = input<ColumnConfig[]>([]);
  masterDetail = input<boolean>(false);
  detailTemplate = input<TemplateRef<unknown>>();
  selectionType = input<'multiple' | 'single' | 'none'>('none');
  selectedRows = output<RecordData[]>();

  public selectedKeys: number[] = [];

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
