import { computed, inject, Injectable, Injector, ResourceRef, Signal, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AlertType,
  ColumnConfig,
  CreateNotificationMessage,
  FieldName,
  FieldSort,
  METHOD_META,
  RecordData,
  Resource,
  ResourceMeta,
  rowCapabilities,
  RPCConfig,
} from '@cccteam/resource-angular/types';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';
import { AnyResourceHandle, BatchResult, Operation, Resource as ClientResource, ResourceDescriptor } from '@cccteam/resource';
import { from, map, mergeMap, Observable, of, tap, toArray } from 'rxjs';

@Injectable()
export class ResourceStore {
  private static readonly BATCH_REQUEST_CONCURRENCY = 5;

  resourceMeta = signal({} as ResourceMeta);
  resourceName = signal<Resource>('' as Resource);
  filter = signal<string>('');
  disableCacheForFilterPii = signal(false);
  sorts = signal<FieldSort[]>([]);
  listColumns = signal<ColumnConfig[]>([]);
  limit = signal<number | undefined>(undefined);
  uuid = signal<string>('');
  error = signal<string>('');

  notifications = inject(NotificationService);
  client = inject(RESOURCE_CLIENT);
  router = inject(Router);
  injector = inject(Injector);
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
  /**
   * The list request's error when it failed — an ApiError for a server refusal — else
   * undefined, so a table can show a refusal as a refusal rather than as an empty list.
   */
  listError = computed<unknown>(() => {
    const ref = this.resourceListRef();
    return ref && ref.status() === 'error' ? ref.error() : undefined;
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
  /** The view request's error when it failed — an ApiError for a server refusal — else undefined. */
  viewError = computed<unknown>(() => {
    const ref = this.resourceViewRef();
    return ref && ref.status() === 'error' ? ref.error() : undefined;
  });

  /**
   * The viewed row's capability envelope: which fields the session user may edit and
   * whether they may delete it. Undefined until the row resolves.
   */
  viewCapabilities = computed(() => rowCapabilities(this.viewData()));

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
      this.sorts,
      this.limit,
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

  /**
   * The typed client handle for the store's resource, built from the descriptor the
   * generator emitted. Mutations assemble their operations here (ops.add lifts key
   * fields into the path, ops.patch and ops.remove address one row) and apply()
   * sends them.
   */
  handle(): AnyResourceHandle {
    const name = this.resourceName();
    const descriptor = this.client.descriptor.resources[name];
    if (!descriptor) {
      throw new Error(`${name} is not in the generated API descriptor`);
    }
    return this.client.define(descriptor);
  }

  /**
   * The client handle for a resource the configs address by route: the generated
   * descriptor's when the route is one of its resources, otherwise a read-only handle
   * over the route alone (an override route, or a resource registered by hand), keyed
   * by `id`. Every read the store makes goes through the client, so one transport,
   * one paging contract, and one error shape serve the whole library.
   */
  private handleFor(route: string): AnyResourceHandle {
    const known = Object.values(this.client.descriptor.resources).find((r) => r.route === route);
    const descriptor: ResourceDescriptor = known ?? {
      resource: route as ClientResource,
      property: route,
      route,
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
    };
    return this.client.define(descriptor);
  }

  /**
   * Sends operations through the client's consolidated endpoint as one transaction
   * and reports success. The client raises ApiError on refusal, so the notification
   * fires only on commit.
   */
  async apply(operations: Operation[], message: string): Promise<BatchResult> {
    const result = await this.client.batch(operations);
    this.notifications.addGlobalNotification({
      message,
      type: AlertType.SUCCESS,
      duration: 5000,
      link: '',
    } satisfies CreateNotificationMessage);
    return result;
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
            // The view is the edit surface: opt into the capability envelope so each
            // field and the delete button render from the row's own affordances.
            return from(
              this.handleFor(String(params.route())).read([params.uuid()], {
                capabilities: ['Update', 'Delete'],
              }) as Promise<RecordData>,
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
    sorts: Signal<FieldSort[]> = signal([]),
    limit: Signal<number | undefined> = signal(undefined),
  ): ResourceRef<RecordData[]> {
    return untracked(() => {
      return rxResource({
        defaultValue: [] as RecordData[],
        injector: this.injector,
        params: () => ({
          route: route(),
          filter: filter(),
          columns: columns(),
          sorts: sorts(),
          limit: limit(),
        }),
        stream: ({ params }) => {
          if (!params.route) return of([] as RecordData[]);
          return this.list<RecordData>(
            String(params.route),
            params.filter,
            disableCacheForFilterPii(),
            params.columns,
            params.sorts,
            params.limit,
          );
        },
      }) as ResourceRef<RecordData[]>;
    });
  }

  resourceListByKeys(
    route: Signal<string>,
    keyField: Signal<string>,
    keys: Signal<string[]>,
    columns: Signal<string[]> = signal([]),
    batchSize = 200,
  ): ResourceRef<RecordData[]> {
    if (!Number.isInteger(batchSize) || batchSize <= 0) {
      throw new Error(`resourceListByKeys: batchSize must be a positive integer, got ${batchSize}`);
    }

    return untracked(() => {
      return rxResource({
        defaultValue: [] as RecordData[],
        injector: this.injector,
        params: () => ({
          route: route(),
          keyField: keyField(),
          keys: keys(),
          columns: columns(),
        }),
        stream: ({ params }) => {
          if (!params.route || !params.keyField || params.keys.length === 0) {
            return of([] as RecordData[]);
          }
          const batches: string[][] = [];
          for (let i = 0; i < params.keys.length; i += batchSize) {
            batches.push(params.keys.slice(i, i + batchSize));
          }
          return from(batches).pipe(
            mergeMap(
              (batch) =>
                this.list<RecordData>(
                  params.route,
                  `${params.keyField}:in:(${batch.join(',')})`,
                  false,
                  params.columns,
                  [],
                  batch.length,
                ),
              ResourceStore.BATCH_REQUEST_CONCURRENCY,
            ),
            toArray(),
            map((results) => results.flat()),
          );
        },
      }) as ResourceRef<RecordData[]>;
    });
  }

  /**
   * Lists a resource for the table through the client. With a configured limit the
   * server's first page of that size is the table's data, as before. Without one the
   * client's all() reads every row — limit=all where the resource declares no maximum,
   * otherwise a walk through the pages in the configured sorts, or in primary-key order
   * when none is configured. A PII filter travels in the request body.
   */
  private list<T>(
    resourceRoute: string,
    filter?: string,
    disableCacheForFilterPii?: boolean,
    columns?: string[],
    sort?: FieldSort[],
    limit?: number,
  ): Observable<T[]> {
    const handle = this.handleFor(resourceRoute);
    const query = {
      filter: filter && filter.trim() !== '' ? filter : undefined,
      sensitiveFilter: disableCacheForFilterPii || undefined,
      columns: columns && columns.length > 0 ? columns : undefined,
      sort: sort && sort.length > 0 ? sort.map((s) => ({ field: s.field as string, direction: s.direction })) : undefined,
      limit: limit && limit > 0 ? limit : undefined,
    };
    const rows = query.limit ? handle.list(query as never) : handle.all(query as never);
    return from(rows as Promise<T[]>);
  }

  rpcCall<T>(rpcConfig: RPCConfig, body: T): Observable<T> {
    const methodData = this.methodMeta(rpcConfig.method);
    if (!methodData) {
      console.error('Method not found in methodMap:', rpcConfig.method);
      return of({} as T);
    }

    return from(this.client.request<T>('POST', methodData.route, { body })).pipe(
      tap(() => {
        this.notifications.addGlobalNotification({
          message: rpcConfig.successMessage ? rpcConfig.successMessage : `${rpcConfig.method} called successfully`,
          type: AlertType.SUCCESS,
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
