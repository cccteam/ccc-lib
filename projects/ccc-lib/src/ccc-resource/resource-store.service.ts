import { computed, inject, Injectable, ResourceRef, signal } from '@angular/core';
import { ColumnConfig, FieldName, FieldSort, RecordData, Resource, ResourceMeta } from '@cccteam/ccc-lib/src/types';
import { NotificationService } from '@cccteam/ccc-lib/src/ui-notification-service';
import { ResourceCacheService } from './resource-cache.service';

@Injectable()
export class ResourceStore {
  resourceMeta = signal({} as ResourceMeta);
  resourceName = signal<Resource>('' as Resource);
  filter = signal<string>('');
  searchTokens = signal<string>('');
  sorts = signal<FieldSort[]>([]);
  listColumns = signal<ColumnConfig[]>([]);
  requireSearchToDisplayResults = signal(false);
  uuid = signal<string>('');
  error = signal<string>('');

  notifications = inject(NotificationService);
  cache = inject(ResourceCacheService);

  private resourceListRef = signal<ResourceRef<RecordData[]> | undefined>(undefined);
  listData = computed(() => {
    const ref = this.resourceListRef();
    if (ref && ref.status() === 'resolved') {
      return ref.value();
    }
    return [];
  });
  private resourceViewRef = signal<ResourceRef<RecordData> | undefined>(undefined);
  viewData = computed(() => {
    const ref = this.resourceViewRef();
    if (ref && ref.status() === 'resolved') {
      return ref.value();
    }
    return {} as RecordData;
  });

  overrideRoute = signal<string>('');
  resourceRoute = computed(() => this.resourceMeta()?.route);
  route = computed(() => {
    if (this.overrideRoute()) {
      return this.overrideRoute();
    }
    const route = this.resourceRoute();
    if (route) {
      return route;
    }
    return '';
  });

  reloadResourceView(): void {
    this.resourceViewRef()?.reload();
  }

  resetResourceList(): void {
    const route = this.route();
    const name = this.resourceName();
    if (!route || name === '') return;
    const columnIds = this.listColumns().flatMap((col) => {
      return [col.id];
    });
    const resourceMeta = this.resourceMeta() as ResourceMeta;
    if (resourceMeta && resourceMeta.fields.some((field) => field.fieldName === 'id')) {
      columnIds.push('id' as FieldName);
    }
    const uniqueColumns = [...new Set([...columnIds])];

    const ref = this.cache.registerList(
      this.route,
      this.resourceName,
      this.filter,
      signal(uniqueColumns),
      this.searchTokens,
      this.sorts,
      this.requireSearchToDisplayResults(),
    );
    this.resourceListRef.set(ref);
    this.resourceListRef()?.reload();
  }

  resetResourceView(): void {
    const route = this.route();
    const name = this.resourceName();
    const uuid = this.uuid();

    if (!route || name === '' || !uuid) return;

    if (this.resourceViewRef() === undefined) {
      const ref = this.cache.registerView(this.route, this.resourceName, this.uuid);
      this.resourceViewRef.set(ref);
    }
  }
}
