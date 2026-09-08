/**
 * The permission vocabulary lives in @cccteam/resource, the framework-neutral client
 * for generated APIs; @cccteam/resource-angular re-exports it so existing imports keep resolving.
 */
export {
  CreatePermission,
  DeletePermission,
  ExecutePermission,
  ListPermission,
  ReadPermission,
  UpdatePermission,
  CapabilitiesProperty,
  CapabilitiesQueryParam,
  rowCapabilities,
} from '@cccteam/resource';
export type {
  Capability,
  Domain,
  FieldName,
  Method,
  Permission,
  PermissionDigest,
  PermissionDigestState,
  PermissionScope,
  Resource,
  RowCapabilities,
  ScopeKind,
  WithCapabilities,
} from '@cccteam/resource';
