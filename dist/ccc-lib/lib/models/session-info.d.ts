/**
 * Session Information for a logged in user
 */
export interface SessionInfo {
    authenticated: boolean;
    username: string;
    permissions: Record<string, string[]>;
}
