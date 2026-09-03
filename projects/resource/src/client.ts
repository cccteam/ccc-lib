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
import { BatchResult, Operation } from './operations';
import { PermissionStore, Requester, RequestOptions } from './permissions';
import { ListQuery, ReadOptions, listSearchParams, readSearchParams } from './query';
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

export interface Listable<Row> {
  list<Query extends ListQuery<Row> | undefined = undefined>(query?: Query): Promise<Returned<Row, Query>[]>;
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

export interface MethodHandle<Body> {
  readonly method: Method;
  readonly descriptor: MethodDescriptor;
  readonly domain?: Domain;
  url(): string;
  /** Posts the body to the Execute-gated route. The server answers with no body. */
  execute(body: Body): Promise<void>;
  can(): boolean;
  state(): PermissionDigestState | undefined;
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
  /** Sends operations to the consolidated endpoint as one transaction. */
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
  const request = createRequester(baseUrl, transport, options.onError);
  const permissions = new PermissionStore(request, {
    digest: descriptor.permissionDigestRoute,
    domains: descriptor.userDomainsRoute,
  });

  const base: ClientBase = {
    descriptor,
    baseUrl,
    permissions,
    request,
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

function createRequester(baseUrl: string, transport: Transport, onError?: (error: ApiError) => void): Requester {
  return async <T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T> => {
    const query = options?.query?.toString();
    const url = `${baseUrl}/${path}${query ? `?${query}` : ''}`;
    const response = await transport({ method, url, body: options?.body });
    if (response.status >= 400) {
      const error = new ApiError(method, url, response.status, response.body);
      onError?.(error);
      throw error;
    }
    return response.body as T;
  };
}

async function batch(request: Requester, descriptor: ApiDescriptor, operations: Operation[]): Promise<BatchResult> {
  if (!descriptor.consolidatedRoute) {
    throw new Error('this API has no consolidated endpoint; mutate resources individually');
  }
  return (await request<BatchResult | null>('PATCH', descriptor.consolidatedRoute, { body: operations })) ?? {};
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
  const mutationRoute = descriptor.consolidated ? api.consolidatedRoute : route;
  const mutate = async (operation: Operation): Promise<BatchResult> => {
    if (!mutationRoute) {
      throw new Error(`${descriptor.resource} is consolidated but the API declares no consolidated route`);
    }
    return (await client.request<BatchResult | null>('PATCH', mutationRoute, { body: [operation] })) ?? {};
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
      return { op: 'add', path: path(key), value: body };
    },
    patch: (key: Key, value: Record<string, unknown>): Operation => ({ op: 'patch', path: path(key), value }),
    remove: (key: Key): Operation => ({ op: 'remove', path: path(key) }),
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
    list: (async (query?: ListQuery<Row>) =>
      (await client.request<Row[] | null>('GET', route, { query: listSearchParams(query) })) ??
      []) as Listable<Row>['list'],
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

function createMethodHandle<Body>(
  client: ClientBase,
  descriptor: MethodDescriptor,
  domain: Domain | undefined,
): MethodHandle<Body> {
  const route = scopedRoute(client.descriptor, descriptor.route, descriptor.scope, domain);
  const scope = {
    resource: descriptor.method,
    permission: ExecutePermission,
    domain: descriptor.scope === 'domain' ? domain : undefined,
  };
  return {
    method: descriptor.method,
    descriptor,
    domain: scope.domain,
    url: () => `${client.baseUrl}/${route}`,
    execute: async (body) => {
      await client.request<unknown>('POST', route, { body });
    },
    can: () => client.permissions.can(scope),
    state: () => client.permissions.state(scope),
  };
}
