type Brand<K, T> = K & { __brand: T };

export type Permission = Brand<string, 'Permission'>;
export type Resource = Brand<string, 'Resource'>;
export type Domain = Brand<string, 'Domain'>;
export type FieldName = Brand<string, 'FieldName'>;
export type Method = Brand<string, 'Method'>;

/**
 * One permission question: may the session user exercise `permission` on `resource`
 * (a resource, a dotted `Resource.field` name, or an RPC method)? `domain` names the
 * tenant partition the question is asked in; omit it for the global scope.
 */
export interface PermissionScope {
  resource: Resource | Method;
  permission: Permission;
  domain?: Domain;
}

export const CreatePermission = 'Create' as Permission;
export const DeletePermission = 'Delete' as Permission;
export const ExecutePermission = 'Execute' as Permission;
export const ListPermission = 'List' as Permission;
export const ReadPermission = 'Read' as Permission;
export const UpdatePermission = 'Update' as Permission;

/**
 * The state of one grant in the permission digest: `granted` when an unconditional
 * grant covers the target, `conditional` when only condition-limited grants do —
 * render the surface and expect the server to narrow it. Denied is never a value:
 * a target the user cannot reach is absent from the digest, so consumers fail closed.
 */
export type PermissionDigestState = 'granted' | 'conditional';

/**
 * The session user's structural grant enumeration for one scope, served by the
 * generated `GET <api>/permission-digest` endpoint (`?domain=` names a tenant
 * partition; absent means global). Keys are resource names and dotted
 * `Resource.field` names; RPC methods appear under their method name with the
 * `Execute` permission. Advisory UI material only: which routes, menus, and form
 * inputs to render. Enforcement stays server-side.
 */
export type PermissionDigest = Record<string, Record<string, PermissionDigestState | undefined> | undefined>;

/**
 * One row's capability envelope, attached under the reserved `zzCapabilities`
 * property when a list or read opted in with `?capabilities=Update,Delete`.
 * `Update` is the positive list of editable JSON field names (a field absent from it
 * is not editable on this row); `Delete` is whether the row may be deleted. Advisory
 * hints evaluated against the row the server returned; enforcement stays server-side.
 */
export interface RowCapabilities {
  Update?: string[];
  Delete?: boolean;
}

/** The reserved per-row property the capability envelope rides under. */
export const CapabilitiesProperty = 'zzCapabilities';

/**
 * Reads a row's capability envelope, if the read opted in. Rows arrive as generic
 * records, so the reserved property is read structurally; undefined means the read
 * carried no envelope and nothing about the row's editability is known.
 */
export function rowCapabilities(row: object | null | undefined): RowCapabilities | undefined {
  const capabilities = (row as Record<string, unknown> | null | undefined)?.[CapabilitiesProperty];
  return capabilities && typeof capabilities === 'object' ? (capabilities as RowCapabilities) : undefined;
}

/** The reserved query parameter that opts a list or read into the capability envelope. */
export const CapabilitiesQueryParam = 'capabilities';
