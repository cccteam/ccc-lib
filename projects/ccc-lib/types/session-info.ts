import { RolePermissionCollection, UserPermissionCollection } from './permissions';

/**
 * Session Information for a logged in user
 */
export interface SessionInfo<TAdditional extends AdditionalSessionData = AdditionalSessionData> {
  authenticated: boolean;
  username: string;
  permissions: UserPermissionCollection;
  additionalData?: TAdditional;
}

export interface AdditionalSessionData {
  permissions: RolePermissionCollection | UserPermissionCollection;
}
