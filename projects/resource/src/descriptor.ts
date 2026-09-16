import { Method, Resource, ScopeKind } from './brands';

/**
 * The operations a resource handle exposes. `batch` marks a resource whose mutations
 * ride the consolidated endpoint and can therefore be combined with other resources'
 * operations in one transaction.
 */
export type ResourceOperation = 'list' | 'read' | 'create' | 'patch' | 'remove' | 'batch';

/**
 * A resource's page sizes: the page a request without `limit` receives, and the
 * largest page it may ask for. A resource with no `max` also permits `limit: 'all'`.
 */
export interface PageDescriptor {
  default: number;
  max?: number;
}

/** One entry of a resource's declared `@order`: a JSON field name and its direction. */
export interface OrderDescriptor {
  field: string;
  direction: 'asc' | 'desc';
}

/** One generated resource as the client needs to address it. */
export interface ResourceDescriptor {
  resource: Resource;
  /** The camelCase property the handle is exposed under on the client. */
  property: string;
  /** The kebab-case route segment, without API prefix or domain segment. */
  route: string;
  scope: ScopeKind;
  /** Mutations go to the consolidated endpoint (true) or to the resource's own PATCH route (false). */
  consolidated: boolean;
  /** JSON names of the primary-key fields, in route order. */
  keys: readonly string[];
  operations: readonly ResourceOperation[];
  /**
   * JSON names of the fields a patch may change — the same set that shapes the
   * generated Patch interface. Absent when the resource has no patch operation.
   * `changes()` enforces it: a form diff outside this list is an error, never a
   * silent drop.
   */
  patchable?: readonly string[];
  /** The resource's page sizes. Absent on a descriptor written by hand: the server's default applies. */
  page?: PageDescriptor;
  /**
   * The resource's declared `@order`, the order a list takes when the request names no
   * sort, with the primary key appended by the server so it is total. A resource that
   * declares one issues cursors for a sort-less list; one that declares none is not
   * sorted and issues no cursor, so a walk over it must send a sort (see walkSort).
   */
  order?: readonly OrderDescriptor[];
}

/** One generated RPC method as the client needs to address it. */
export interface MethodDescriptor {
  method: Method;
  property: string;
  /** The kebab-case route segment, without API prefix or domain segment. */
  route: string;
  scope: ScopeKind;
  /** Set when the method answers with a result body; absent methods resolve with nothing. */
  answers?: boolean;
  /**
   * The statuses the method declares with `@answers`. A listed 4xx is the method's own
   * answer with its typed body, not a refusal by the frame: `execute` resolves with
   * `{ status, result }` for a method that declares statuses and throws ApiError for
   * every status outside the list.
   */
  statuses?: readonly number[];
  /**
   * Set on an `@upload` method: the request travels as multipart/form-data with the
   * JSON `request` part first and one `file` part per file, and the whole body is
   * bounded by `maxBytes`. The handle gains `upload(body, files)`.
   */
  upload?: { maxBytes: number };
}

/** The domain route pair domain-scoped routes are served under: `<segment>/<domain>/...`. */
export interface DomainRouteDescriptor {
  segment: string;
  param: string;
}

/**
 * Everything the client needs to know about one generated API. The ccc TypeScript
 * generator emits it; the runtime interprets it. Routes carry no API prefix — the
 * client's `baseUrl` supplies it.
 */
export interface ApiDescriptor {
  resources: Record<string, ResourceDescriptor>;
  methods: Record<string, MethodDescriptor>;
  domainRoute?: DomainRouteDescriptor;
  /** The consolidated mutation route (`resources`), when consolidation is enabled. */
  consolidatedRoute?: string;
  permissionDigestRoute: string;
  userDomainsRoute: string;
}
