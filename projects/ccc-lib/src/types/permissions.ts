type Brand<K, T> = K & { __brand: T };

export type Permission = Brand<string, 'Permission'>;
export type Resource = Brand<string, 'Resource'>;
export type Domain = Brand<string, 'Domain'>;
export type DomainPermissions = Record<Domain, Record<Resource, Record<Permission, Permissions>>>;

export interface PermissionScope {
  resource: Resource;
  permission: Permission;
  domain: Domain;
}

export const ReadPermission = 'Read' as Permission;
export const UpdatePermission = 'Update' as Permission;
