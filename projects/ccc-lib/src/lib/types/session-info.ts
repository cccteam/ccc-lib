import { DomainPermissions } from './permissions';

/**
 * Session Information for a logged in user
 */
export interface SessionInfo {
  authenticated: boolean;
  username: string;
  permissions: DomainPermissions;
}
