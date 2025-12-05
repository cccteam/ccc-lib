import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  OnInit,
  output,
  ResourceRef,
  runInInjectionContext,
  signal,
  Type,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppGridComponent } from '@cccteam/ccc-lib/ccc-grid';
import {
  ChildResourceConfig,
  ColumnConfig,
  FieldName,
  ListViewConfig,
  RecordData,
  Resource,
  RESOURCE_META,
  RootConfig,
} from '@cccteam/ccc-lib/types';
import { ActionAccessControlWrapperComponent } from '../actions/action-button-smart/action-access-control-wrapper.component';
import { ActionButtonContext } from '../actions/actions.interface';
import {
  hyphenConcatWithoutResource,
  hyphenSpaceConcatWithoutResource,
  noSpaceConcatWithoutResource,
  spaceConcatWithoutResource,
  spaceHyphenConcatWithoutResource,
} from '../concat-fns';
import { applyFormatting, formatDateString } from '../format-fns';
import { ResourceStore } from '../resource-store.service';

@Component({
  standalone: true,
  imports: [
    AppGridComponent,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatInputModule,
    ActionAccessControlWrapperComponent,
    NgComponentOutlet,
  ],
  selector: 'ccc-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  providers: [ResourceStore],
})
export class ResourceListComponent implements OnInit {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  compoundResourceComponent = input.required<Type<any>>();

  resourceMeta = inject(RESOURCE_META);
  router = inject(Router);
  store = inject(ResourceStore);
  injector = inject(Injector);
  activatedRoute = inject(ActivatedRoute);

  hideCreateButton = input<boolean>(true);
  createMode = output<boolean>();
  resourceConfig = input<ChildResourceConfig>();
  viewRoute = input<string>();
  filter = input<string>('');
  linkCreateType = input<boolean>(false);
  isRootList = input<boolean>(true);

  showCreateButton = computed(() => {
    const config = this.config();
    if (config.createTitle !== '' && !config.collapsible && !this.hideCreateButton()) {
      return true;
    }
    if (config.createConfig && Object.keys(config.createConfig).length !== 0) {
      return true;
    }
    return false;
  });

  createButtonContext = computed(() => {
    const config = this.resourceConfig();
    const showCreate = this.showCreateButton();

    if (config === undefined || showCreate === undefined) {
      return undefined;
    }

    if (config.shouldRenderActions === undefined) {
      return undefined;
    }

    return {
      actionType: 'create',
      meta: this.meta(),
      shouldRender: (data: RecordData): boolean => showCreate && config.shouldRenderActions.create(data),
      resourceData: this.relatedData() ?? {},
    } satisfies ActionButtonContext;
  });

  searchableFields = computed(() => {
    const meta = this.meta();
    if (!meta) return '';
    return `over fields of ${meta.route}`;
    // TODO: implement searchable fields based on resource meta
    // return meta.searchableFields.join(', ') || '';
  });

  relatedData = input<RecordData>();
  parentId = input<string>();

  routeConfig = computed(() => {
    return this.activatedRoute.snapshot.data['config'] as RootConfig;
  });

  config = computed(() => {
    return this.resourceConfig() as ListViewConfig;
  });

  expansionConfig = computed(() => {
    const config = this.config().rowExpansionConfig;
    if (config.type !== 'Component' && config.type !== 'Array') {
      config.showBackButton = false;
    }
    return config;
  });

  viewRouteFallback = computed(() => {
    if (this.viewRoute()) {
      return this.viewRoute();
    }

    return this.resourceMeta(this.config().primaryResource).route;
  });

  listTitle = computed(() => {
    if (this.config()?.collapsible) return '';
    return this.config().title || '';
  });

  indentTitle = computed(() => {
    if (this.config() === undefined) {
      return false;
    }

    return true;
  });

  createButtonLabel = computed(() => {
    return this.config().createButtonLabel || 'Create';
  });

  meta = computed(() => {
    const config = this.config();
    return this.resourceMeta(config.overrideResource || config.primaryResource);
  });
  resourceRefMap = signal(new Map<Resource, ResourceRef<RecordData[]>>());
  primaryKeys = computed(() => {
    const meta = this.meta();
    if (!meta) {
      return [];
    }
    return meta.fields.filter((field) => field.primaryKey !== undefined);
  });
  rootColumns = computed(() => {
    const config = this.config();
    const idCols = [];
    for (const pk of this.primaryKeys()) {
      if (pk.required) {
        continue;
      }
      idCols.push({
        id: pk.fieldName as FieldName,
        hidden: true,
      });
    }
    for (const col of config.listColumns) {
      if (!('additionalIds' in col)) continue;
      for (const additionalCol of col.additionalIds) {
        if (additionalCol.resource !== undefined) continue;
        idCols.push({
          id: additionalCol.id as FieldName,
          hidden: true,
        });
      }
    }

    return [...new Set([...idCols, ...config.listColumns])];
  });
  columns = computed(() => {
    const refmap = this.resourceRefMap();
    const cols = this.rootColumns();
    const columns: ColumnConfig[] = [];
    const usedIds = new Set<string>();

    for (const col of cols) {
      const indexId = this.getUniqueId(col.id, usedIds) as FieldName;
      usedIds.add(indexId);

      if (col.hidden) {
        continue;
      }

      if ('additionalIds' in col) {
        columns.push({
          id: indexId,
          header: col.header,
          width: col.width,
          resizable: col.resizable,
          valueGetter: (data) => {
            const concatArray: string[] = [];

            col.additionalIds.forEach((additionalCol) => {
              if (!additionalCol.resource) {
                concatArray.push(data[additionalCol.id]);
              } else {
                const resource = signal(additionalCol.resource as Resource);
                const resourceRef = refmap.get(resource());
                const resData = resourceRef?.value();
                if (!resData) {
                  return;
                }
                for (const res of resData) {
                  if (res[additionalCol.id] === data[col.id] && additionalCol.field) {
                    const value = res[additionalCol.field];
                    if (col.formatType && typeof value === 'string') {
                      concatArray.push(formatDateString(col.formatType, value));
                    } else if (value) {
                      concatArray.push(value as string);
                    }
                  }
                }
              }
            });

            if (concatArray.length === 0) {
              return col.emptyDataValue as string;
            }

            switch (col.concatFn) {
              case 'space-concat':
                return spaceConcatWithoutResource(concatArray);
              case 'space-hyphen-concat':
                return spaceHyphenConcatWithoutResource(concatArray);
              case 'hyphen-space-concat':
                return hyphenSpaceConcatWithoutResource(concatArray);
              case 'no-space-concat':
                return noSpaceConcatWithoutResource(concatArray);
              default: {
                // default case is hyphen-concat
                return hyphenConcatWithoutResource(concatArray);
              }
            }
          },
        });
      } else {
        columns.push({
          id: indexId,
          header: col.header,
          width: col.width,
          resizable: col.resizable,
          valueFormatter: (params) => {
            if (col.formatType) {
              const retValue = applyFormatting(col.formatType, params);
              return retValue || col.emptyDataValue;
            }
            return params || col.emptyDataValue;
          },
        });
      }
    }

    if (this.config().showViewButton) {
      let route = '';
      const isRootList = this.isRootList() === undefined;

      if (this.viewRouteFallback() && isRootList) {
        route = this.viewRouteFallback() || '';
      } else {
        let viewResource = this.config().viewResource;
        if (!viewResource || viewResource === '') {
          viewResource = this.config().primaryResource;
        }

        const meta = this.resourceMeta(viewResource as Resource);
        if (meta !== undefined) {
          route = meta.route;
        }
      }

      columns.push({
        id: 'view' as FieldName,
        header: 'View',
        hideHeader: true,
        buttonConfig: {
          label: 'View',
          icon: 'arrow_forward',
          viewRoute: route,
          actionType: 'link',
        },
      });
    }

    return columns;
  });

  reloadListData(): void {
    this.store.reloadListData();
  }

  processedRowData = computed(() => {
    this.filter();
    this.relatedData();
    const data = this.store.listData();
    if (!data) return [];
    const columns = this.columns();

    return data.map((row) => {
      const updatedRow = { ...row };
      for (const col of columns) {
        if (col.valueGetter) {
          updatedRow[col.id] = col.valueGetter(row);
        } else {
          updatedRow[col.id] = row[col.id];
        }

        if (typeof col.valueFormatter === 'function') {
          updatedRow[col.id] = col.valueFormatter(updatedRow[col.id]);
        }
      }
      return updatedRow;
    });
  });

  filters = computed(() => {
    const configFilter = this.config().filter?.(this.relatedData()) || '';
    const inputFilter = this.filter();
    if (inputFilter && configFilter) {
      return `(${inputFilter}),(${configFilter})`;
    }
    if (inputFilter) {
      return `(${inputFilter})`;
    }
    return configFilter || '';
  });

  createResource(event: MouseEvent): void {
    event.stopPropagation();
    this.createMode.emit(true);
  }

  parentKey = computed(() => {
    if (this.relatedData() === undefined || this.childKey() === undefined) {
      return '';
    }
    const parent = this.config().parentRelation?.parentKey;
    return this.relatedData()?.[parent] || '';
  });

  childKey = computed(() => {
    if (!this.config().parentRelation) {
      return '';
    }
    return this.config().parentRelation?.childKey as string;
  });

  private getUniqueId(baseId: string, usedIds: Set<string>): string {
    if (!usedIds.has(baseId)) {
      return baseId;
    }

    let counter = 1;
    let newId = `${baseId}_${counter}`;
    while (usedIds.has(newId)) {
      counter++;
      newId = `${baseId}_${counter}`;
    }
    return newId;
  }

  ngOnInit(): void {
    const primaryResource = this.config().primaryResource;
    if (this.meta()) {
      this.store.resourceName.set(primaryResource);
      this.store.resourceMeta.set(this.meta());
      this.store.listColumns.set(this.config().listColumns || []);
      this.store.requireSearchToDisplayResults.set(this.config().requireSearchToDisplayResults || false);
      this.store.sorts.set(this.config().sorts || []);
    }

    this.store.filter.set(this.filters());
    this.store.disableCacheForFilterPii.set(this.config().disableCacheForFilterPii);

    runInInjectionContext(this.injector, () => {
      this.config().listColumns.forEach((element) => {
        if (!('additionalIds' in element)) {
          return;
        }
        element.additionalIds.forEach((id) => {
          if (id.resource === undefined) {
            return;
          }
          const meta = this.resourceMeta(id.resource);
          if (meta === undefined) {
            return;
          }
          const route = signal(meta.route);
          const resource = signal(id.resource);
          if (!this.resourceRefMap().has(resource())) {
            const ref = this.store.resourceList(route);
            if (ref === undefined) {
              return;
            }
            this.resourceRefMap.set(this.resourceRefMap().set(resource(), ref));
          }
        });
      });

      effect(() => {
        this.filter();
        this.relatedData();
        this.store.filter.set(this.filters());
        this.store.disableCacheForFilterPii.set(this.config().disableCacheForFilterPii);
        this.store.buildStoreListData();
      });
    });
  }
}
