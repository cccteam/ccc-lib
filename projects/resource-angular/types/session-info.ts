/**
 * Session Information for a logged in user. Permissions are not part of the session:
 * the AuthService answers them from the permission digest and user-domains endpoints.
 */
export interface SessionInfo {
  authenticated: boolean;
  username: string;
}
