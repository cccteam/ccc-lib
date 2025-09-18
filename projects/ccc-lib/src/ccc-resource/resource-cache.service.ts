import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, Injector, ResourceRef, signal, Signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap } from 'rxjs';
import type { FieldSort, RecordData, Resource } from '../internal-types';
import { AlertLevel, API_URL } from '../internal-types';
import { CreateNotificationMessage } from '../types';
import { NotificationService } from '../ui-notification-service/notification.service';
import { Operation } from './operation-types';

@Injectable()
export class ResourceCacheService {
  cache = new Map<string, ResourceRef<RecordData[] | RecordData>>();
  http = inject(HttpClient);
  notifications = inject(NotificationService);
  injector = inject(Injector);
  router = inject(Router);
  apiUrl = inject(API_URL);

  registerView(route: Signal<string>, resource: Signal<Resource>, uuid: Signal<string>): ResourceRef<RecordData> {
    const cacheKey = this.createCacheKey(resource(), 'view', uuid(), []);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ResourceRef<RecordData>;
    }

    return untracked(() => {
      const resourceRef = rxResource({
        injector: this.injector,
        params: () => ({
          route: route(),
          uuid: uuid(),
        }),
        stream: ({ params }) => {
          if (!params.route || !params.uuid || uuid() === 'undefined') return of({} as RecordData);
          return this.http.get<RecordData>(this.routes.resource(this.apiUrl, String(params.route), uuid() || ''));
        },
      }) as ResourceRef<RecordData>;

      this.cache.set(cacheKey, resourceRef);
      return resourceRef;
    });
  }

  registerList(
    route: Signal<string>,
    resource: Signal<Resource>,
    filter: Signal<string> = signal(''),
    columns: Signal<string[]> = signal([]),
    searchTokens: Signal<string> = signal(''),
    sorts: Signal<FieldSort[]> = signal([]),
    defaultEmpty = false,
  ): ResourceRef<RecordData[]> {
    const cacheKey = this.createCacheKey(resource(), 'list', filter(), columns());
    if (this.cache.has(cacheKey)) {
      const resourceRef = this.cache.get(cacheKey) as ResourceRef<RecordData[]>;
      return resourceRef as ResourceRef<RecordData[]>;
    }

    return untracked(() => {
      const resourceRef = rxResource({
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
            params.columns,
            params.searchTokens,
            params.sorts,
          );
        },
      }) as ResourceRef<RecordData[]>;
      this.cache.set(cacheKey, resourceRef);
      return resourceRef;
    });
  }

  createCacheKey(resource: Resource, type: 'view' | 'list', params: string, columns: string[] = []): string {
    const normalizedColumns = columns.map((col) => col || '').sort((a, b) => a.localeCompare(b));
    return `${resource}:${type}:${JSON.stringify(params)}:${JSON.stringify(normalizedColumns)}`;
  }

  /**
   *
   * @param resource
   * @returns void
   * @description This method tries to update the resource by exact name in the cache by calling the reload method on it.
   */
  updateResourceInCache(resource: Resource, type: 'view' | 'list'): void {
    this.cache.forEach((resourceRef, key) => {
      const [cachedResource, cachedType] = key.split(':');
      if (cachedResource === resource && cachedType === type) {
        resourceRef.reload();
      }
    });
  }

  /**
   *
   * @param resource
   * @returns void
   * @description This method tries to update any resource that includes the resource name in the cache by calling the reload method on it.
   * For example, updating ResourceTest will update both ResourceTest and ResourceTestRelatedResourceFoobar.
   */
  updateResourceGroupInCache(resource: Resource): void {
    this.cache.forEach((resourceRef, key) => {
      const [cachedResource] = key.split(':');
      if (cachedResource?.includes(resource)) {
        resourceRef.reload();
      }
    });
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
      catchError((error) => {
        this.notifications.addGlobalNotification({
          message: `${resource} failed to update: ${error}`,
          level: AlertLevel.ERROR,
          duration: 5000,
          link: '',
        } satisfies CreateNotificationMessage);
        return of({});
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
      catchError((error) => {
        this.notifications.addGlobalNotification({
          message: `${resource} failed to create: ${error}`,
          level: AlertLevel.ERROR,
          duration: 5000,
          link: '',
        } satisfies CreateNotificationMessage);
        return of({});
      }),
    );
  }

  private patchMultiple(resourceRoute: string, data: Operation[]): Observable<Record<string, unknown>> {
    return this.http.patch<Record<string, unknown>>(this.routes.resources(this.apiUrl, resourceRoute), data);
  }

  private list<T>(
    resourceRoute: string,
    filter?: string,
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
    return this.http.get<T[]>(this.routes.resources(this.apiUrl, resourceRoute), { params });
  }

  // rpcCall<T>(rpcConfig: RPCConfig, body: T): Observable<T> {
  //   const methodData = methodMeta(rpcConfig.method);
  //   if (!methodData) {
  //     console.error('Method not found in methodMap:', rpcConfig.method);
  //     return of({} as T);
  //   }

  //   return this.http.post<T>(this.routes.method(this.apiUrl, methodData.route), body).pipe(
  //     tap(() => {
  //       this.notifications.addGlobalNotification({
  //         message: rpcConfig.successMessage ? rpcConfig.successMessage : `${rpcConfig.method} called successfully`,
  //         level: AlertLevel.SUCCESS,
  //         duration: 5000,
  //         link: '',
  //       } satisfies CreateNotificationMessage);
  //       if (rpcConfig.afterMethodRedirect) {
  //         if (typeof rpcConfig.afterMethodRedirect === 'string') {
  //           this.router.navigate([rpcConfig.afterMethodRedirect]);
  //         } else {
  //           this.router.navigate(rpcConfig.afterMethodRedirect);
  //         }
  //       }
  //     }),
  //     catchError((error) => {
  //       this.notifications.addGlobalNotification({
  //         message: error,
  //         level: AlertLevel.ERROR,
  //         duration: 5000,
  //         link: '',
  //       } satisfies CreateNotificationMessage);
  //       return of();
  //     }),
  //   );
  // }
}
