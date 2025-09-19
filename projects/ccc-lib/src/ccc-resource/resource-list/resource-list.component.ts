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
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppGridComponent } from '@cccteam/ccc-lib/src/ccc-grid';
import { ChildResourceConfig, ColumnConfig, FieldName, ListViewConfig, RecordData, Resource, RESOURCE_META, RootConfig } from '@cccteam/ccc-lib/src/types';
import {
  hyphenConcatWithoutResource,
  hyphenSpaceConcatWithoutResource,
  noSpaceConcatWithoutResource,
  spaceConcatWithoutResource,
  spaceHyphenConcatWithoutResource,
} from '../concat-fns';
import { applyFormatting, formatDateString } from '../format-fns';
import { ResourceCacheService } from '../resource-cache.service';
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
  ],
  selector: 'ccc-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  providers: [ResourceStore],
})
export class ResourceListComponent implements OnInit {
  router = inject(Router);
  store = inject(ResourceStore);
  injector = inject(Injector);
  activatedRoute = inject(ActivatedRoute);
  cache = inject(ResourceCacheService);
  resourceMeta = inject(RESOURCE_META);

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
  resourceWatchList: ResourceRef<RecordData[]>[] = [];
  primaryKeys = computed(() => {
    const meta = this.meta();
    if (!meta) {
      return [];
    }
    return meta.fields.filter((field) => field.primaryKey !== undefined);
  });
  columns = computed(() => {
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

    const cols = [...idCols, ...config.listColumns];
    const columns: ColumnConfig[] = [];
    const usedIds = new Set<string>();

    // preset all resource list caches so a value is available for the valueGetter
    for (const col of cols) {
      if (!('additionalIds' in col)) {
        continue;
      }
      col.additionalIds.forEach((id) => {
        if (id.resource === undefined) {
          return;
        }
        const resource = signal(id.resource as Resource);
        const ref = this.cache.registerList(resource, resource);
        if (!this.resourceWatchList.includes(ref)) this.resourceWatchList.push(ref);
      });
    }

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
                const resourceRef = this.cache.registerList(resource, resource);
                for (const res of resourceRef.value()) {
                  if (res[additionalCol.id] === data[col.id] && res['id'] !== undefined && additionalCol.field) {
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

  processedRowData = computed(() => {
    for (const ref of this.resourceWatchList) {
      ref.value();
    }
    const data = this.store.listData();
    if (!data) return [];
    const columns = this.columns();

    return data.map((row) => {
      const updatedRow = { ...row };
      for (const col of columns) {
        if (typeof col.valueGetter === 'function') {
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

    runInInjectionContext(this.injector, () => {
      this.config().listColumns.forEach((element) => {
        if (!('additionalIds' in element)) return;
        element.additionalIds.forEach((id) => {
          if (id.resource === undefined) return;
          const meta = this.resourceMeta(id.resource);
          if (meta === undefined) return;
          const route = signal(meta.route);
          const resource = signal(id.resource);
          const ref = this.cache.registerList(route, resource);
          this.resourceWatchList.push(ref);
        });
      });

      effect(() => {
        this.filter();
        this.relatedData();
        this.store.filter.set(this.filters());
        this.store.resetResourceList();
      });
    });
  }
}
