import { Method, Resource, ScopeKind } from './brands';

/**
 * The operations a resource handle exposes. `batch` marks a resource whose mutations
 * ride the consolidated endpoint and can therefore be combined with other resources'
 * operations in one transaction.
 */
export type ResourceOperation = 'list' | 'read' | 'create' | 'patch' | 'remove' | 'batch';

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
}

/** One generated RPC method as the client needs to address it. */
export interface MethodDescriptor {
  method: Method;
  property: string;
  /** The kebab-case route segment, without API prefix or domain segment. */
  route: string;
  scope: ScopeKind;
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
