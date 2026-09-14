import {
  CreatePermission,
  DeletePermission,
  Domain,
  ExecutePermission,
  Method,
  Permission,
  PermissionScope,
  Resource,
  UpdatePermission,
} from './brands';
import { ApiDescriptor, MethodDescriptor, ResourceDescriptor, ResourceOperation } from './descriptor';
import { Capability, PermissionDigestState, WithCapabilities, rowCapabilities } from './digest';
import { BatchResult, Operation, OperationRoute, operationRoute } from './operations';
import { ClientResponse, PermissionStore, Requester, RequestOptions, ResponseRequester } from './permissions';
import { dryRunHeader } from './transport';
import {
  LinkHeader,
  ListQuery,
  PageMoreHeader,
  ReadOptions,
  Sort,
  TotalCountHeader,
  listSearchParams,
  parseLinkHeader,
  readSearchParams,
} from './query';
import { ApiError, HttpMethod, Transport, fetchTransport } from './transport';

export interface ClientOptions {
  /** The API prefix every route is served under, e.g. `/api` or `https://host/api`. */
  baseUrl: string;
  /** Defaults to fetchTransport(). */
  transport?: Transport;
  /** Observes every non-2xx response before it is thrown. */
  onError?: (error: ApiError) => void;
}

/** What every resource handle offers, whatever operations the resource supports. */
export interface ResourceHandleBase<Row, Key extends unknown[]> {
  readonly resource: Resource;
  readonly descriptor: ResourceDescriptor;
  /** The partition this handle is bound to; undefined for a global resource. */
  readonly domain?: Domain;
  /** The absolute URL of the collection, or of one row when a key is given. */
  url(key?: Key): string;
  /** The operation path (route plus key segments, no API prefix) used in mutation bodies. */
  path(key?: Key): string;
  /** The row's primary key, in route order. */
  keyOf(row: Row): Key;
  /** Asks the digest of this handle's scope. Conditional grants answer true. */
  can(permission: Permission): boolean;
  state(permission: Permission): PermissionDigestState | undefined;
  /**
   * The fields this handle's digest says the session user may supply for the
   * permission — `Create` narrows a create form to the inputs worth rendering:
   * sorted JSON field names whose dotted field target is granted or conditional
   * (conditional renders; the server judges the write). Undefined when the digest
   * carries no field-level entries for the permission — no field information (the
   * permission is denied outright, or the resource has no grant-bearing fields) —
   * so narrow only on a defined answer. Key fields never appear: they are
   * structural, not grant-bearing.
   */
  grantedFields(permission: Permission): readonly string[] | undefined;
  /**
   * Asks the row first, the digest second: a capability envelope on the row decides
   * `Update`/`Delete` for that row — `Execute` whether the named RPC method's
   * declared transition applies to it, and `Create` whether the named workflow member
   * resource may be created beneath it — while without an envelope the scope's digest
   * decides. `Execute` requires the method name; `Create` the member resource name.
   */
  rowCan(row: Row, permission: Capability, target?: Method | string): boolean;
  /** Whether the session user may write this field on this row (envelope first, digest second). */
  fieldEditable(row: Row, field: keyof Row & string): boolean;
}

/** The row type a read returns: with the capability envelope when the query asked for one. */
export type Returned<Row, Query> = Query extends { capabilities: Capability[] } ? WithCapabilities<Row> : Row;

/**
 * One page of a list. `next` and `prev` follow the server's Link relations exactly as
 * issued and are absent where no such page exists; `total` answers a `count: true`
 * request on a first page; `more` marks a page served in primary-key order (no sort,
 * no declared order) whose rows did not fit — the server issues no cursor there, so
 * paging further requires a sort.
 */
export interface Page<Row> {
  rows: Row[];
  total?: number;
  more: boolean;
  next?: () => Promise<Page<Row>>;
  prev?: () => Promise<Page<Row>>;
  /**
   * The same page again: the request that produced it, repeated as issued — the first
   * page's parameters, or the cursor a relation handed out — so a table refreshes the
   * page it is on after a write without losing its position.
   */
  reload: () => Promise<Page<Row>>;
}

export interface Listable<Row> {
  /** One page of rows, the resource's default page when the query names no limit. */
  list<Query extends ListQuery<Row> | undefined = undefined>(query?: Query): Promise<Returned<Row, Query>[]>;
  /** One page with its neighbors: follow `next` and `prev` as the server names them. */
  page<Query extends ListQuery<Row> | undefined = undefined>(query?: Query): Promise<Page<Returned<Row, Query>>>;
  /**
   * Every row. Asks `limit: 'all'` where the resource declares no maximum page size;
   * otherwise walks the pages to the end in the query's sort, or in primary-key order
   * when the query names none, so an export sees each row once.
   */
  all<Query extends ListQuery<Row> | undefined = undefined>(query?: Query): Promise<Returned<Row, Query>[]>;
}

export interface Readable<Row, Key extends unknown[]> {
  read<Options extends ReadOptions<Row> | undefined = undefined>(
    key: Key,
    options?: Options,
  ): Promise<Returned<Row, Options>>;
}

export interface Creatable<Create> {
  /**
   * Creates one row. Key fields present in the value become path segments; the
   * server-generated id of the new row is returned when the server allocates one.
   */
  create(value: Create): Promise<string | undefined>;
}

export interface Patchable<Patch, Key extends unknown[]> {
  patch(key: Key, value: Patch): Promise<void>;
}

export interface Removable<Key extends unknown[]> {
  remove(key: Key): Promise<void>;
}

/** Operation builders for the consolidated endpoint; pass their results to `client.batch`. */
export interface Batchable<Create, Patch, Key extends unknown[]> {
  readonly ops: {
    add(value: Create): Operation;
    patch(key: Key, value: Patch): Operation;
    remove(key: Key): Operation;
  };
}

/**
 * A typed handle on one resource in one scope. `Ops` names the operations the server
 * generated for it; the others do not exist on the type, so a call the server would
 * refuse does not compile.
 */
export type ResourceHandle<
  Row,
  Key extends unknown[],
  Ops extends ResourceOperation,
  Create = never,
  Patch = never,
> = ResourceHandleBase<Row, Key> &
  ('list' extends Ops ? Listable<Row> : unknown) &
  ('read' extends Ops ? Readable<Row, Key> : unknown) &
  ('create' extends Ops ? Creatable<Create> : unknown) &
  ('patch' extends Ops ? Patchable<Patch, Key> : unknown) &
  ('remove' extends Ops ? Removable<Key> : unknown) &
  ('batch' extends Ops ? Batchable<Create, Patch, Key> : unknown);

/** A handle with every operation, for resources the generator did not describe. */
export type AnyResourceHandle<Row = Record<string, unknown>, Key extends unknown[] = string[]> = ResourceHandle<
  Row,
  Key,
  ResourceOperation,
  Record<string, unknown>,
  Record<string, unknown>
>;

/**
 * The answer of a method that declares its statuses (`@answers`): the status the
 * method chose for this response and its typed result. A 4xx here is the method's own
 * refusal, resolved rather than thrown, because the method declared it and typed its
 * body.
 */
export interface MethodAnswer<Status extends number = number, Result = unknown> {
  status: Status;
  result: Result;
}

export interface MethodHandle<Body, Result = void> {
  readonly method: Method;
  readonly descriptor: MethodDescriptor;
  readonly domain?: Domain;
  url(): string;
  /**
   * Posts the body to the Execute-gated route and resolves with the method's answer:
   * the generated `<Method>Result` for a method whose Execute returns one, the
   * generated `<Method>Answer` (`{ status, result }`) for a method that declares its
   * statuses, nothing for the rest. A status the method did not declare, and every
   * refusal by the frame, rejects with ApiError.
   */
  execute(body: Body): Promise<Result>;
  /**
   * Runs the method's whole frame — decode, the entry check, the target's checks, the
   * body with every write it arms — and rolls the transaction back instead of
   * committing. It resolves when the real call would commit and rejects with the
   * same ApiError the real call would raise, so a control can be enabled or a refusal
   * explained before the user commits. A 4xx the method declares is still a refusal
   * here: nothing would commit, and the ApiError carries the method's typed body. A
   * method that runs outside a transaction rejects with 400.
   */
  dryRun(body: Body): Promise<void>;
  can(): boolean;
  state(): PermissionDigestState | undefined;
}

/**
 * The handle of an `@upload` method: `execute` and `dryRun` as on any method, and
 * `upload`, which sends the body with files as multipart/form-data — the JSON body
 * as the `request` part first, then one `file` part per file — and resolves like
 * `execute`. The sum of the files' sizes is checked against the declared maximum
 * before anything is sent, with the same message shape as the server's 413.
 */
export interface UploadMethodHandle<Body, Result = void> extends MethodHandle<Body, Result> {
  upload(body: Body, files: readonly (File | Blob)[]): Promise<Result>;
}

/** The name of the multipart part carrying the method's JSON, sent first. */
export const uploadRequestPart = 'request';
/** The name of each multipart file part. */
export const uploadFilePart = 'file';

/** Renders a byte count the way @upload declares it: whole GB, MB, or KB when even, bytes otherwise. */
export function formatByteSize(n: number): string {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (n >= gb && n % gb === 0) return `${n / gb}GB`;
  if (n >= mb && n % mb === 0) return `${n / mb}MB`;
  if (n >= kb && n % kb === 0) return `${n / kb}KB`;
  return `${n} bytes`;
}

export interface DomainClientBase {
  readonly domain: Domain;
  /** Asks this partition's digest about a domain-scoped resource or method. */
  can(permission: Permission, target: Resource | Method): boolean;
}

export type DomainClient<D> = DomainClientBase & D;

export interface ClientBase {
  readonly descriptor: ApiDescriptor;
  readonly baseUrl: string;
  readonly permissions: PermissionStore;
  /** Issues a request under baseUrl; the escape hatch for routes the generator did not describe. */
  readonly request: Requester;
  /** Issues a request and resolves with the headers too. */
  readonly requestResponse: ResponseRequester;
  /**
   * Sends operations as one transaction. Operations built by consolidated resources go
   * to the consolidated endpoint; operations built by one standalone resource (a
   * `consolidated: false` descriptor) go to that resource's own PATCH route, which
   * offers the same transaction over its own rows. Operations from more than one
   * endpoint cannot commit together and are refused before any request is sent.
   */
  batch(operations: Operation[]): Promise<BatchResult>;
  /**
   * Asks the right digest: the descriptor decides whether the target is global or
   * domain-scoped; a domain-scoped target with no domain answers false.
   */
  can(permission: Permission, target: Resource | Method, domain?: Domain): boolean;
  /**
   * The digest's field-level answer for a resource, scope resolved from the
   * descriptor like `can` (a domain-scoped resource with no domain answers
   * undefined) — see ResourceHandleBase.grantedFields.
   */
  grantedFields(permission: Permission, target: Resource, domain?: Domain): readonly string[] | undefined;
  /** Builds a handle for a resource outside the generated descriptor (a manually registered one). */
  define<Row, Key extends unknown[], Ops extends ResourceOperation, Create = never, Patch = never>(
    descriptor: ResourceDescriptor,
    domain?: Domain,
  ): ResourceHandle<Row, Key, Ops, Create, Patch>;
}

/**
 * The client for one generated API: global handles on the root, domain-scoped handles
 * under `domain(...)`. The generated `Api` type fills in G and D.
 */
export type Client<G, D> = ClientBase & G & { domain(domain: Domain | string): DomainClient<D> };

export function createClient<G, D>(descriptor: ApiDescriptor, options: ClientOptions): Client<G, D> {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const transport = options.transport ?? fetchTransport();
  const requestResponse = createRequester(baseUrl, transport, options.onError);
  const request: Requester = async <T>(method: HttpMethod, path: string, requestOptions?: RequestOptions): Promise<T> =>
    (await requestResponse<T>(method, path, requestOptions)).body;
  const permissions = new PermissionStore(request, {
    digest: descriptor.permissionDigestRoute,
    domains: descriptor.userDomainsRoute,
  });

  const base: ClientBase = {
    descriptor,
    baseUrl,
    permissions,
    request,
    requestResponse,
    batch: (operations) => batch(request, descriptor, operations),
    can: (permission, target, domain) => {
      const scope =
        descriptor.resources[target]?.scope ?? descriptor.methods[target]?.scope ?? (domain ? 'domain' : 'global');
      if (scope === 'domain' && !domain) {
        return false;
      }
      return permissions.can({ resource: target, permission, domain: scope === 'domain' ? domain : undefined });
    },
    grantedFields: (permission, target, domain) => {
      const scope = descriptor.resources[target]?.scope ?? (domain ? 'domain' : 'global');
      if (scope === 'domain' && !domain) {
        return undefined;
      }
      return definedFields(permissions, {
        resource: target,
        permission,
        domain: scope === 'domain' ? domain : undefined,
      });
    },
    define: (resource, domain) => createResourceHandle(base, resource, domain) as never,
  };

  const domains = new Map<string, DomainClient<D>>();
  const client = Object.assign(base, {
    domain: (domain: Domain | string): DomainClient<D> => {
      let bound = domains.get(domain);
      if (!bound) {
        bound = createDomainClient<D>(base, domain as Domain);
        domains.set(domain, bound);
      }
      return bound;
    },
  }) as Client<G, D>;

  attachHandles(client, base, 'global', undefined);
  return client;
}

function createDomainClient<D>(client: ClientBase, domain: Domain): DomainClient<D> {
  const bound: DomainClientBase = {
    domain,
    can: (permission, target) => client.can(permission, target, domain),
  };
  attachHandles(bound, client, 'domain', domain);
  return bound as DomainClient<D>;
}

function attachHandles(
  target: object,
  client: ClientBase,
  scope: 'global' | 'domain',
  domain: Domain | undefined,
): void {
  const handles = target as Record<string, unknown>;
  for (const resource of Object.values(client.descriptor.resources)) {
    if (resource.scope === scope) {
      handles[resource.property] = createResourceHandle(client, resource, domain);
    }
  }
  for (const method of Object.values(client.descriptor.methods)) {
    if (method.scope === scope) {
      handles[method.property] = createMethodHandle(client, method, domain);
    }
  }
}

/** The digest's field-level enumeration for a scope, as sorted names — undefined when it holds none. */
function definedFields(permissions: PermissionStore, scope: PermissionScope): readonly string[] | undefined {
  const fields = Object.keys(permissions.fieldStates(scope)).sort();
  return fields.length > 0 ? fields : undefined;
}

function createRequester(
  baseUrl: string,
  transport: Transport,
  onError?: (error: ApiError) => void,
): ResponseRequester {
  return async <T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<ClientResponse<T>> => {
    const query = options?.query?.toString();
    const url = options?.absolute ? resolveAbsolute(baseUrl, path) : `${baseUrl}/${path}${query ? `?${query}` : ''}`;
    const response = await transport({ method, url, body: options?.body, headers: options?.headers });
    if (response.status >= 400 && !options?.accept?.includes(response.status)) {
      const error = new ApiError(method, url, response.status, response.body);
      onError?.(error);
      throw error;
    }
    return { status: response.status, body: response.body as T, headers: response.headers ?? {} };
  };
}

/**
 * Resolves a URL reference the server issued. The server writes path-absolute
 * references carrying the API prefix, so under a baseUrl with an origin they are
 * joined to that origin; a same-origin baseUrl passes them through, and a complete
 * URL is used as given.
 */
export function resolveAbsolute(baseUrl: string, reference: string): string {
  if (/^https?:\/\//i.test(reference)) {
    return reference;
  }
  const origin = /^https?:\/\/[^/]+/i.exec(baseUrl);
  return origin && reference.startsWith('/') ? origin[0] + reference : reference;
}

async function batch(request: Requester, descriptor: ApiDescriptor, operations: Operation[]): Promise<BatchResult> {
  const endpoints = new Set(operations.map((operation) => operationRoute(operation) ?? descriptor.consolidatedRoute));
  if (endpoints.size > 1) {
    throw new Error(
      `operations for more than one endpoint (${[...endpoints].map(String).join(', ')}) cannot commit as one transaction: ` +
        'a standalone resource has its own PATCH route; send its operations in their own batch',
    );
  }
  const [endpoint] = endpoints;
  if (operations.length === 0 || !endpoint) {
    throw new Error('this API has no consolidated endpoint; mutate resources individually');
  }
  // The binding is the client's own bookkeeping; the wire carries the operation alone.
  const body = operations.map(({ op, path, value }) => (value === undefined ? { op, path } : { op, path, value }));
  return (await request<BatchResult | null>('PATCH', endpoint, { body })) ?? {};
}

/** The route of a resource or method in a scope: the domain pair is prepended for domain-scoped targets. */
function scopedRoute(
  descriptor: ApiDescriptor,
  route: string,
  scope: 'global' | 'domain',
  domain: Domain | undefined,
): string {
  if (scope !== 'domain') {
    return route;
  }
  if (!domain) {
    throw new Error(`${route} is domain-scoped: bind a domain with client.domain(...) first`);
  }
  if (!descriptor.domainRoute) {
    throw new Error(`${route} is domain-scoped but the API declares no domain route`);
  }
  return `${descriptor.domainRoute.segment}/${encodeURIComponent(domain)}/${route}`;
}

function keySegments(key: readonly unknown[] | undefined): string {
  return key && key.length > 0 ? `/${key.map((part) => encodeURIComponent(String(part))).join('/')}` : '';
}

function createResourceHandle<Row extends object, Key extends unknown[]>(
  client: ClientBase,
  descriptor: ResourceDescriptor,
  domain: Domain | undefined,
): AnyResourceHandle<Row, Key> {
  const api = client.descriptor;
  const route = scopedRoute(api, descriptor.route, descriptor.scope, domain);
  const scopeDomain = descriptor.scope === 'domain' ? domain : undefined;
  const digestScope = (permission: Permission, target: string = descriptor.resource) => ({
    resource: target as Resource,
    permission,
    domain: scopeDomain,
  });

  const path = (key?: readonly unknown[]): string => {
    const segments = keySegments(key);
    return descriptor.consolidated ? `/${route}${segments}` : segments || '/';
  };
  // A standalone resource's operations carry their route, so client.batch delivers
  // them to the resource's own PATCH handler; a consolidated one's carry nothing.
  const bound = (operation: Operation): Operation =>
    descriptor.consolidated ? operation : { ...operation, [OperationRoute]: route };
  const mutate = async (operation: Operation): Promise<BatchResult> => {
    if (descriptor.consolidated && !api.consolidatedRoute) {
      throw new Error(`${descriptor.resource} is consolidated but the API declares no consolidated route`);
    }
    return client.batch([operation]);
  };

  const ops = {
    add: (value: Record<string, unknown>): Operation => {
      const body = { ...value };
      const key: unknown[] = [];
      for (const field of descriptor.keys) {
        if (body[field] !== undefined) {
          key.push(body[field]);
          delete body[field];
        }
      }
      // A partial compound key would address the wrong row: either every key field is
      // supplied (client-assigned keys) or none is (server-generated key).
      if (key.length !== 0 && key.length !== descriptor.keys.length) {
        throw new Error(
          `${descriptor.resource}: a create must supply every key field (${descriptor.keys.join(', ')}) or none`,
        );
      }
      return bound({ op: 'add', path: path(key), value: body });
    },
    patch: (key: Key, value: Record<string, unknown>): Operation => bound({ op: 'patch', path: path(key), value }),
    remove: (key: Key): Operation => bound({ op: 'remove', path: path(key) }),
  };

  const handle: AnyResourceHandle<Row, Key> = {
    resource: descriptor.resource,
    descriptor,
    domain: scopeDomain,
    url: (key?: Key) => `${client.baseUrl}/${route}${keySegments(key)}`,
    path,
    keyOf: (row: Row) => descriptor.keys.map((field) => (row as Record<string, unknown>)[field]) as Key,
    can: (permission) => client.permissions.can(digestScope(permission)),
    state: (permission) => client.permissions.state(digestScope(permission)),
    grantedFields: (permission) => definedFields(client.permissions, digestScope(permission)),
    rowCan: (row, permission, target) => {
      const envelope = rowCapabilities(row);
      if (permission === 'Execute') {
        if (!target) {
          throw new Error(`${descriptor.resource}: rowCan(row, 'Execute', method) requires the method name`);
        }
        if (envelope) {
          return envelope.Execute?.includes(target) ?? false;
        }
        return client.permissions.can(digestScope(ExecutePermission, target));
      }
      if (permission === 'Create') {
        if (!target) {
          throw new Error(`${descriptor.resource}: rowCan(row, 'Create', member) requires the member resource name`);
        }
        if (envelope) {
          return envelope.Create?.includes(target) ?? false;
        }
        return client.permissions.can(digestScope(CreatePermission, target));
      }
      if (envelope) {
        return permission === 'Update' ? (envelope.Update?.length ?? 0) > 0 : envelope.Delete === true;
      }
      return client.permissions.can(digestScope(permission === 'Update' ? UpdatePermission : DeletePermission));
    },
    fieldEditable: (row, field) => {
      const envelope = rowCapabilities(row);
      if (envelope) {
        return envelope.Update?.includes(field) ?? false;
      }
      return (
        client.permissions.can(digestScope(UpdatePermission, `${descriptor.resource}.${field}`)) ||
        client.permissions.can(digestScope(UpdatePermission))
      );
    },
    list: (async (query?: ListQuery<Row>) => {
      const { method, params, body } = listRequest(query);
      return (await client.request<Row[] | null>(method, route, { query: params, body })) ?? [];
    }) as Listable<Row>['list'],
    page: ((query?: ListQuery<Row>) => {
      const { method, params, body } = listRequest(query);
      return pageOf<Row>(client, method, body, () => client.requestResponse(method, route, { query: params, body }));
    }) as Listable<Row>['page'],
    all: (async (query?: ListQuery<Row>) => {
      if (descriptor.page?.max === undefined) {
        return handle.list({ ...query, limit: 'all' } as ListQuery<Row>);
      }
      const rows: Row[] = [];
      let page = await handle.page({ ...query, sort: walkSort(descriptor, query?.sort), count: false } as ListQuery<Row>);
      for (;;) {
        rows.push(...page.rows);
        if (!page.next) {
          return rows;
        }
        page = await page.next();
      }
    }) as Listable<Row>['all'],
    read: (async (key: Key, options?: ReadOptions<Row>) =>
      client.request<Row>('GET', `${route}${keySegments(key)}`, { query: readSearchParams(options) })) as Readable<
      Row,
      Key
    >['read'],
    create: async (value) => {
      const result = await mutate(ops.add(value));
      return result[descriptor.property]?.[0] ?? result['iDs']?.[0];
    },
    patch: async (key, value) => {
      await mutate(ops.patch(key, value));
    },
    remove: async (key) => {
      await mutate(ops.remove(key));
    },
    ops,
  };
  return handle;
}

/**
 * The sort a paged walk sends so the server issues cursors: the caller's when the query
 * names one; nothing when the resource declares an `@order`, which the server applies
 * and pages by; otherwise the primary key, since a list with no order is served in
 * primary-key order without a cursor. The same rule serves a table over one page and
 * an export over every page.
 */
export function walkSort<Row>(
  descriptor: ResourceDescriptor,
  sort: Sort<Row> | Sort<Row>[] | undefined,
): Sort<Row> | Sort<Row>[] | undefined {
  if (sort !== undefined && (!Array.isArray(sort) || sort.length > 0)) {
    return sort;
  }
  if (descriptor.order && descriptor.order.length > 0) {
    return undefined;
  }
  return descriptor.keys.map((key) => ({ field: key as keyof Row & string, direction: 'asc' as const }));
}

/**
 * The request a list query makes: a GET with every parameter in the URL, or, for a
 * sensitive filter, a POST carrying the filter in the body and the rest in the URL.
 */
function listRequest<Row>(query: ListQuery<Row> | undefined): {
  method: HttpMethod;
  params: URLSearchParams;
  body: { filter: string } | undefined;
} {
  const params = listSearchParams(query);
  if (!query?.sensitiveFilter || !params.has('filter')) {
    return { method: 'GET', params, body: undefined };
  }
  const filter = params.get('filter') ?? '';
  params.delete('filter');
  return { method: 'POST', params, body: { filter } };
}

/**
 * Reads one list response into a Page, with `next` and `prev` following the Link
 * relations as issued — by the same method and with the same body, so a filter carried
 * in the body travels with the walk — and `reload` repeating the request that produced
 * the page.
 */
async function pageOf<Row>(
  client: ClientBase,
  method: HttpMethod,
  body: unknown,
  request: () => Promise<ClientResponse<Row[] | null>>,
): Promise<Page<Row>> {
  const { body: rows, headers } = await request();
  const relations = parseLinkHeader(headers[LinkHeader]);
  const total = headers[TotalCountHeader];
  const follow = (reference: string) => () =>
    pageOf<Row>(client, method, body, () =>
      client.requestResponse<Row[] | null>(method, reference, { absolute: true, body }),
    );
  return {
    rows: rows ?? [],
    total: total === undefined ? undefined : Number(total),
    more: headers[PageMoreHeader] === 'true',
    next: relations['next'] ? follow(relations['next']) : undefined,
    prev: relations['prev'] ? follow(relations['prev']) : undefined,
    reload: () => pageOf<Row>(client, method, body, request),
  };
}

function createMethodHandle<Body, Result = void>(
  client: ClientBase,
  descriptor: MethodDescriptor,
  domain: Domain | undefined,
): MethodHandle<Body, Result> {
  const route = scopedRoute(client.descriptor, descriptor.route, descriptor.scope, domain);
  const scope = {
    resource: descriptor.method,
    permission: ExecutePermission,
    domain: descriptor.scope === 'domain' ? domain : undefined,
  };
  // Posts one body — JSON, or the multipart form of an upload — and resolves with
  // the method's answer. A method with declared statuses resolves every declared
  // code as { status, result }; the rest resolve the result or nothing.
  const post = async (body: unknown, headers?: Record<string, string>): Promise<Result> => {
    if (descriptor.statuses) {
      const response = await client.requestResponse<unknown>('POST', route, {
        body,
        headers,
        accept: descriptor.statuses,
      });
      if (!descriptor.answers) {
        // An answerless method declaring 204: nothing to pair.
        return undefined as Result;
      }
      const answer: MethodAnswer = { status: response.status, result: response.body ?? undefined };
      return answer as Result;
    }
    // A method without an answer serves an empty 200; the transport decodes that
    // to undefined, which is the void the handle promises.
    const answer = await client.request<Result | null | undefined>('POST', route, { body, headers });
    return (answer ?? undefined) as Result;
  };
  const handle: MethodHandle<Body, Result> = {
    method: descriptor.method,
    descriptor,
    domain: scope.domain,
    url: () => `${client.baseUrl}/${route}`,
    execute: (body) => post(body),
    dryRun: async (body) => {
      await client.request<unknown>('POST', route, { body, headers: { [dryRunHeader]: 'true' } });
    },
    can: () => client.permissions.can(scope),
    state: () => client.permissions.state(scope),
  };
  if (!descriptor.upload) {
    return handle;
  }
  const maxBytes = descriptor.upload.maxBytes;
  const upload: UploadMethodHandle<Body, Result> = {
    ...handle,
    upload: (body, files) => {
      const total = files.reduce((sum, file) => sum + file.size, 0);
      if (total > maxBytes) {
        throw new ApiError(
          'POST',
          handle.url(),
          413,
          `the upload exceeds the declared maximum of ${formatByteSize(maxBytes)}`,
        );
      }
      const form = new FormData();
      form.append(uploadRequestPart, new Blob([JSON.stringify(body)], { type: 'application/json' }));
      for (const file of files) {
        if (file instanceof File) {
          form.append(uploadFilePart, file, file.name);
        } else {
          form.append(uploadFilePart, file);
        }
      }
      return post(form);
    },
  };
  return upload;
}
