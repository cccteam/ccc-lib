import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, Injector, ResourceRef, Signal, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AlertLevel,
  API_URL,
  ColumnConfig,
  CreateNotificationMessage,
  FieldName,
  FieldSort,
  METHOD_META,
  RecordData,
  Resource,
  ResourceMeta,
  RPCConfig,
} from '@cccteam/ccc-lib/types';
import { NotificationService } from '@cccteam/ccc-lib/ui-notification-service';
import { Observable, of, tap } from 'rxjs';
import { Operation } from './resources-helpers';

@Injectable()
export class ResourceStore {
  resourceMeta = signal({} as ResourceMeta);
  resourceName = signal<Resource>('' as Resource);
  filter = signal<string>('');
  disableCacheForFilterPii = signal(false);
  searchTokens = signal<string>('');
  sorts = signal<FieldSort[]>([]);
  listColumns = signal<ColumnConfig[]>([]);
  requireSearchToDisplayResults = signal(false);
  uuid = signal<string>('');
  error = signal<string>('');

  notifications = inject(NotificationService);
  http = inject(HttpClient);
  router = inject(Router);
  injector = inject(Injector);
  apiUrl = inject(API_URL);
  methodMeta = inject(METHOD_META);

  private resourceListRef = signal<ResourceRef<RecordData[]> | undefined>(undefined);
  listData = computed(() => {
    const ref = this.resourceListRef();
    if (ref && ref.status() === 'resolved') {
      return ref.value();
    }
    return [];
  });
  listStatus = computed(() => {
    return this.resourceListRef()?.status();
  });

  private resourceViewRef = signal<ResourceRef<RecordData> | undefined>(undefined);
  viewData = computed(() => {
    const ref = this.resourceViewRef();
    if (ref && ref.status() === 'resolved') {
      return ref.value();
    }
    return {} as RecordData;
  });
  viewStatus = computed(() => {
    return this.resourceViewRef()?.status();
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

  reloadViewData(): void {
    this.resourceViewRef()?.reload();
  }

  reloadListData(): void {
    this.resourceListRef()?.reload();
  }

  buildStoreListData(): void {
    const route = this.route();
    const name = this.resourceName();
    if (!route || name === '') {
      return;
    }
    const columnIds = this.listColumns().flatMap((col) => {
      return [col.id];
    });
    const resourceMeta = this.resourceMeta();
    if (resourceMeta && resourceMeta.fields.some((field) => field.fieldName === 'id')) {
      columnIds.push('id' as FieldName);
    }
    const uniqueColumns = signal([...new Set([...columnIds])]);

    const ref = this.resourceList(
      this.route,
      this.filter,
      uniqueColumns,
      this.disableCacheForFilterPii,
      this.searchTokens,
      this.sorts,
    );
    this.resourceListRef.set(ref);
    this.reloadListData();
  }

  buildStoreViewData(): void {
    const route = this.route();
    const uuid = this.uuid();
    if (!route || !uuid || uuid === 'undefined') {
      return;
    }

    const ref = this.resourceView(this.route, this.uuid);
    this.resourceViewRef.set(ref);
    this.reloadListData();
  }

  routes = {
    resources: (rootUrl: string, resources: string): string => `${rootUrl}/${resources}`,
    resource: (rootUrl: string, resources: string, uuid: string): string => `${rootUrl}/${resources}/${uuid}`,
    method: (rootUrl: string, method: string): string => `${rootUrl}/${method}`,
  };

  makePatches(operations: Operation[], route: string, resource: Resource): Observable<Record<string, unknown>> {
    return this.patchMultiple(String(route), operations).pipe(
      tap(() => {
        this.notifications.addGlobalNotification({
          message: `${resource} updated successfully`,
          level: AlertLevel.SUCCESS,
          duration: 5000,
          link: '',
        } satisfies CreateNotificationMessage);
      }),
    );
  }

  createPatch(operation: Operation, route: string, resource: Resource): Observable<Record<string, unknown>> {
    return this.patchMultiple(String(route), [operation]).pipe(
      tap(() => {
        this.notifications.addGlobalNotification({
          message: `${resource} created successfully`,
          level: AlertLevel.SUCCESS,
          duration: 5000,
          link: '',
        } satisfies CreateNotificationMessage);
      }),
    );
  }

  private patchMultiple(resourceRoute: string, data: Operation[]): Observable<Record<string, unknown>> {
    return this.http.patch<Record<string, unknown>>(this.routes.resources(this.apiUrl, resourceRoute), data);
  }

  resourceView(route: Signal<string>, uuid: Signal<string>): ResourceRef<RecordData> {
    return untracked(
      () =>
        rxResource({
          injector: this.injector,
          params: () => ({
            route: route,
            uuid: uuid,
          }),
          stream: ({ params }) => {
            if (!params.route() || !params.uuid() || params.uuid() === 'undefined') return of({} as RecordData);
            return this.http.get<RecordData>(
              this.routes.resource(this.apiUrl, String(params.route()), params.uuid() || ''),
            );
          },
        }) as ResourceRef<RecordData>,
    );
  }

  resourceList(
    route: Signal<string>,
    filter: Signal<string> = signal(''),
    columns: Signal<string[]> = signal([]),
    disableCacheForFilterPii: Signal<boolean> = signal(false),
    searchTokens: Signal<string> = signal(''),
    sorts: Signal<FieldSort[]> = signal([]),
    defaultEmpty = false,
  ): ResourceRef<RecordData[]> {
    return untracked(() => {
      return rxResource({
        defaultValue: [] as RecordData[],
        injector: this.injector,
        params: () => ({
          route: route(),
          filter: filter(),
          columns: columns(),
          searchTokens: searchTokens(),
          sorts: sorts(),
        }),
        stream: ({ params }) => {
          if (!params.route) return of([] as RecordData[]);
          if (defaultEmpty && (!params.searchTokens || params.searchTokens.trim() === '')) {
            return of([] as RecordData[]);
          }
          return this.list<RecordData>(
            String(params.route),
            params.filter,
            disableCacheForFilterPii(),
            params.columns,
            params.searchTokens,
            params.sorts,
          );
        },
      }) as ResourceRef<RecordData[]>;
    });
  }

  private list<T>(
    resourceRoute: string,
    filter?: string,
    disableCacheForFilterPii?: boolean,
    columns?: string[],
    searchTokens?: string,
    sort?: FieldSort[],
  ): Observable<T[]> {
    const paramsObj: Record<string, string> = {};
    if (filter && filter.trim() !== '') paramsObj['filter'] = filter;
    if (columns && columns.length > 0) paramsObj['columns'] = columns.join(',');
    if (searchTokens && searchTokens.trim() !== '') paramsObj['SearchTokens'] = searchTokens;
    if (sort && sort.length > 0) {
      paramsObj['sort'] = sort.map((s) => `${s.field}:${s.direction}`).join(',');
    }
    const params = new HttpParams({ fromObject: paramsObj });
    if (disableCacheForFilterPii) {
      const paramsObjWithoutFilter = { ...paramsObj };
      delete paramsObjWithoutFilter['filter'];
      return this.http.post<T[]>(
        this.routes.resources(this.apiUrl, resourceRoute),
        { filter: filter },
        paramsObjWithoutFilter,
      );
    }
    return this.http.get<T[]>(this.routes.resources(this.apiUrl, resourceRoute), { params });
  }

  rpcCall<T>(rpcConfig: RPCConfig, body: T): Observable<T> {
    const methodData = this.methodMeta(rpcConfig.method);
    if (!methodData) {
      console.error('Method not found in methodMap:', rpcConfig.method);
      return of({} as T);
    }

    return this.http.post<T>(this.routes.method(this.apiUrl, methodData.route), body).pipe(
      tap(() => {
        this.notifications.addGlobalNotification({
          message: rpcConfig.successMessage ? rpcConfig.successMessage : `${rpcConfig.method} called successfully`,
          level: AlertLevel.SUCCESS,
          duration: 5000,
          link: '',
        } satisfies CreateNotificationMessage);
        if (rpcConfig.afterMethodRedirect) {
          if (typeof rpcConfig.afterMethodRedirect === 'string') {
            this.router.navigate([rpcConfig.afterMethodRedirect]);
          } else {
            this.router.navigate(rpcConfig.afterMethodRedirect);
          }
        }
      }),
    );
  }
}
