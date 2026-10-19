/**
 * Session Information for a logged in user. Permissions are not part of the session:
 * the AuthService answers them from the permission digest and user-domains endpoints.
 */
export interface SessionInfo {
  authenticated: boolean;
  username: string;
  /**
   * An operator set this user's password: the server serves nothing but the password
   * change, this read and the logout until the person sets a password of their own,
   * refusing everything else with the code `password_change_required`. The login page
   * renders the change form while it is set.
   */
  passwordChangeRequired?: boolean;
}
