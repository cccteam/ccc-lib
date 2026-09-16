import { computed, effect, EffectRef, inject, Injectable, Injector, ResourceRef, Signal, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  AlertType,
  ColumnConfig,
  CreateNotificationMessage,
  FieldSort,
  METHOD_META,
  RecordData,
  requestedColumns,
  Resource,
  RESOURCE_DOMAIN,
  ResourceMeta,
  rowCapabilities,
  RPCConfig,
} from '@cccteam/resource-angular/types';
import { ColumnFilter, composeFilter, PageTurn } from '@cccteam/resource-angular/ccc-grid';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';
import {
  AnyResourceHandle,
  BatchResult,
  ListQuery,
  Operation,
  Page,
  Resource as ClientResource,
  ResourceDescriptor,
  walkSort,
} from '@cccteam/resource';
import { from, map, mergeMap, Observable, of, tap, toArray } from 'rxjs';
import { PagePosition, positionAfter } from './resource-list/list-request';

/** One page of the listed resource as the table shows it, positioned in the server's list. */
export interface ListPage {
  rows: RecordData[];
  /** The rows before this page. */
  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** The total the first page answered, kept while turning; undefined until it answers. */
  total?: number;
}

export type ListPageStatus = 'idle' | 'loading' | 'resolved' | 'error';

const emptyListPage: ListPage = { rows: [], offset: 0, hasPrev: false, hasNext: false };

@Injectable()
export class ResourceStore {
  private static readonly BATCH_REQUEST_CONCURRENCY = 5;

  resourceMeta = signal({} as ResourceMeta);
  resourceName = signal<Resource>('' as Resource);
  filter = signal<string>('');
  disableCacheForFilterPii = signal(false);
  sorts = signal<FieldSort[]>([]);
  listColumns = signal<ColumnConfig[]>([]);
  /**
   * The server page size the list asks for; undefined sends no limit, so the resource's
   * declared default applies. A size over the declared maximum is the server's 400,
   * surfaced as the page's error.
   */
  pageSize = signal<number | undefined>(undefined);
  /** The grid's column filters, composed into the request filter beside `filter`. */
  columnFilters = signal<ColumnFilter[]>([]);
  /** Set while the page has nothing to ask for (the digest grants none of its columns): no request is made. */
  listSuspended = signal(false);
  uuid = signal<string>('');
  error = signal<string>('');

  notifications = inject(NotificationService);
  client = inject(RESOURCE_CLIENT);
  router = inject(Router);
  injector = inject(Injector);
  methodMeta = inject(METHOD_META);
  /** The selected tenant, which every request for a domain-scoped resource is bound to. */
  domain = inject(RESOURCE_DOMAIN);

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

  // The server's page, as the list component shows it. One paging model, the server's:
  // the store holds the page the client answered — its rows, whether a previous and a
  // next page exist, and the total the first page asked for, kept while turning — and
  // performs the turns the grid asks for through the page's own relations. A change to
  // the sorts, the filters, the columns, or the page size drops the cursor and asks for
  // a first page with the count.
  private readonly currentPage = signal<Page<RecordData> | undefined>(undefined);
  private readonly position = signal<PagePosition>({ offset: 0 });
  private pageEffect: EffectRef | undefined;
  private pageRequestSeq = 0;
  pageStatus = signal<ListPageStatus>('idle');
  /** The page request's error when it failed — an ApiError for a server refusal — else undefined. */
  pageError = signal<unknown>(undefined);
  page = computed<ListPage>(() => {
    const current = this.currentPage();
    if (!current) {
      return emptyListPage;
    }
    return {
      rows: current.rows,
      offset: this.position().offset,
      hasPrev: current.prev !== undefined,
      hasNext: current.next !== undefined,
      total: this.position().total,
    };
  });

  /**
   * The first-page request as the store's signals describe it: the route and the
   * request filter (the page's filter and the column filters composed), the columns
   * with every key field, the sorts, and the page size; undefined while the list has
   * nothing to ask for.
   */
  private readonly pageQuery = computed(() => {
    const route = this.route();
    if (!route || this.resourceName() === '' || this.listSuspended()) {
      return undefined;
    }
    return {
      route,
      filter: composeFilter(this.filter(), this.columnFilters()),
      sensitive: this.disableCacheForFilterPii(),
      columns: requestedColumns(
        this.listColumns().map((col) => col.id),
        this.resourceMeta(),
      ),
      sorts: this.sorts(),
      limit: this.pageSize(),
      domain: this.domain(),
    };
  });

  /**
   * Starts holding the server's page for the list: from here on, whenever the request the
   * signals describe changes, the store asks for a first page. Idempotent.
   */
  buildStorePage(): void {
    if (this.pageEffect) {
      return;
    }
    this.pageEffect = untracked(() =>
      effect(
        () => {
          const query = this.pageQuery();
          untracked(() => this.loadFirstPage(query));
        },
        { injector: this.injector },
      ),
    );
  }

  /** The first page of the current request, with the count. */
  firstPage(): void {
    this.loadFirstPage(untracked(() => this.pageQuery()));
  }

  /** The page the current one names as previous or next; nothing when there is none. */
  turnPage(direction: PageTurn): void {
    if (direction === 'first') {
      this.firstPage();
      return;
    }
    const current = this.currentPage();
    const step = direction === 'next' ? current?.next : current?.prev;
    if (!current || !step) {
      return;
    }
    void this.runPageRequest(step, direction, current.rows.length);
  }

  /** The page the table is on, requested again by its own cursor, so a write shows without losing the position. */
  reloadPage(): void {
    const current = this.currentPage();
    if (!current) {
      this.firstPage();
      return;
    }
    void this.runPageRequest(current.reload, 'reload', current.rows.length);
  }

  private loadFirstPage(query: ReturnType<typeof this.pageQuery>): void {
    if (!query) {
      this.pageRequestSeq++;
      this.currentPage.set(undefined);
      this.position.set({ offset: 0 });
      this.pageError.set(undefined);
      this.pageStatus.set('idle');
      return;
    }
    const handle = this.handleFor(query.route);
    // No limit unless the page names one, so the descriptor's default applies; no sort
    // unless the page names one, so a declared @order applies, and a resource declaring
    // none is served unsorted, its first page with no cursor until a header is clicked
    // — the client's walk rule.
    const sorts = query.sorts.map((s) => ({ field: s.field as string, direction: s.direction }));
    const request: ListQuery<RecordData> = {
      filter: query.filter !== '' ? query.filter : undefined,
      sensitiveFilter: query.sensitive || undefined,
      columns: query.columns.length > 0 ? query.columns : undefined,
      sort: walkSort(handle.descriptor, sorts) as ListQuery<RecordData>['sort'],
      limit: query.limit,
      count: true,
    };
    void this.runPageRequest(() => handle.page(request as never) as Promise<Page<RecordData>>, 'first', 0);
  }

  /** Runs one page request; a request that lands after a later one started is dropped. */
  private async runPageRequest(
    request: () => Promise<Page<RecordData>>,
    turn: PageTurn | 'reload',
    leftRows: number,
  ): Promise<void> {
    const seq = ++this.pageRequestSeq;
    this.pageStatus.set('loading');
    try {
      const landed = await request();
      if (seq !== this.pageRequestSeq) {
        return;
      }
      this.position.set(positionAfter(this.position(), turn, leftRows, { rows: landed.rows.length, total: landed.total }));
      this.currentPage.set(landed);
      this.pageError.set(undefined);
      this.pageStatus.set('resolved');
    } catch (error) {
      if (seq !== this.pageRequestSeq) {
        return;
      }
      this.currentPage.set(undefined);
      this.position.set({ offset: 0 });
      this.pageError.set(error);
      this.pageStatus.set('error');
    }
  }

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
    // The configured columns and every key field the metadata names, so a row carries
    // the key an operation or a row route lifts.
    const uniqueColumns = signal<string[]>(
      requestedColumns(
        this.listColumns().map((col) => col.id),
        this.resourceMeta(),
      ),
    );

    const ref = this.resourceList(this.route, this.filter, uniqueColumns, this.disableCacheForFilterPii, this.sorts);
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
    return this.defineScoped(descriptor);
  }

  /**
   * The client handle for a resource the configs address by route: the generated
   * descriptor's when the route is one of its resources — as the descriptor spells it,
   * or as the resource metadata spells a domain-scoped one, with the tenant parameter
   * in braces — otherwise a read-only handle over the route alone (an override route,
   * or a resource registered by hand), keyed by `id`. Every read the store makes goes
   * through the client, so one transport, one paging contract, and one error shape
   * serve the whole library.
   */
  private handleFor(route: string): AnyResourceHandle {
    const known = Object.values(this.client.descriptor.resources).find(
      (r) => r.route === route || this.metadataRoute(r) === route,
    );
    const descriptor: ResourceDescriptor = known ?? {
      resource: route as ClientResource,
      property: route,
      route,
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
    };
    return this.defineScoped(descriptor);
  }

  /**
   * The route as the generated resource metadata carries it: a domain-scoped resource's
   * is prefixed with the domain pair, the tenant parameter in braces
   * (`sectors/{sectorID}/missions`), which the client fills from the bound tenant.
   */
  private metadataRoute(descriptor: ResourceDescriptor): string | undefined {
    const domainRoute = this.client.descriptor.domainRoute;
    if (descriptor.scope !== 'domain' || !domainRoute) {
      return undefined;
    }
    return `${domainRoute.segment}/{${domainRoute.param}}/${descriptor.route}`;
  }

  /**
   * A handle bound to the selected tenant when the resource is domain-scoped. The client
   * refuses to build a domain-scoped handle with no tenant, so a page over such a
   * resource asks for nothing until one is selected.
   */
  private defineScoped(descriptor: ResourceDescriptor): AnyResourceHandle {
    return this.client.define(descriptor, descriptor.scope === 'domain' ? this.domain() : undefined);
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
            domain: this.domain(),
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
          domain: this.domain(),
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
          domain: this.domain(),
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
   * Lists a resource through the client for the readers that want every row — the
   * array view, the pickers, the referenced-resource columns. With a limit the server's
   * first page of that size is the answer. Without one the client's all() reads every
   * row — limit=all where the resource declares no maximum, otherwise a walk through
   * the pages in the configured sorts, or in the declared order when none is
   * configured; a resource with a maximum and no order cannot be walked without a
   * sort, and the client refuses rather than answering one unsorted page. A PII
   * filter travels in the request body. The list
   * component does not read here: it holds one server page (see buildStorePage).
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
