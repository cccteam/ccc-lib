type Brand<K, T> = K & { __brand: T };

export type Permission = Brand<string, 'Permission'>;
export type Resource = Brand<string, 'Resource'>;
export type Domain = Brand<string, 'Domain'>;

export interface PermissionScope {
  resource: Resource;
  permission: Permission;
  domain: Domain;
}

export const Permissions = {
  Read: 'read' as Permission,
  Update: 'update' as Permission,
  Create: 'create' as Permission,
  Delete: 'delete' as Permission,
};
