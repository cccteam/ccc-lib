type Brand<K, T> = K & { __brand: T };

export type Permission = Brand<string, 'Permission'>;
export type Resource = Brand<string, 'Resource'>;
export type Domain = Brand<string, 'Domain'>;
export type FieldName = Brand<string, 'FieldName'>;
export type Method = Brand<string, 'Method'>;

export type UserPermissionCollection = Record<Domain, Record<Resource | Method, Record<Resource, Permission>>>;
export type RolePermissionCollection = Partial<Record<Permission, (Resource | Method)[]>>;
export interface PermissionScope {
  resource: Resource | Method;
  permission: Permission;
  domain: Domain;
}

export const ReadPermission = 'Read' as Permission;
export const UpdatePermission = 'Update' as Permission;
