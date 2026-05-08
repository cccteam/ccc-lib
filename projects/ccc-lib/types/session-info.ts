import { DomainPermissions, Method, Permission, Resource } from './permissions';

/**
 * Session Information for a logged in user
 */
export interface SessionInfo<TAdditional = unknown> {
  authenticated: boolean;
  username: string;
  permissions: DomainPermissions;
  additionalData?: TAdditional | AdditionalSessionData;
}

export type FlatPermissions = Partial<Record<Permission, (Resource | Method)[]>>;

export interface AdditionalSessionData {
  permissions?: FlatPermissions;
}
