import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  API_URL,
  FRONTEND_LOGIN_PATH,
  LOGOUT_ACTION,
  Permission,
  PERMISSION_REQUIRED,
  PermissionScope,
  Resource,
  SESSION_PATH,
  SessionInfo,
} from '@cccteam/ccc-lib/types';
import { errorOptions } from '@cccteam/ccc-lib/util-request-options';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = inject(API_URL);
  private loginUrl = inject(FRONTEND_LOGIN_PATH);
  private sessionUrl = inject(SESSION_PATH);
  private logoutAction = inject(LOGOUT_ACTION);

  http = inject(HttpClient);
  private authenticatedSignal = signal(false);
  private sessionInfoSignal = signal({} as SessionInfo);

  redirectUrl = signal('');
  authenticated = this.authenticatedSignal.asReadonly();
  sessionInfo = this.sessionInfoSignal.asReadonly();

  constructor() {
    this.initializePermissionFn();
  }

  private static permissionFn: (resource: Resource, permission: Permission) => boolean;

  hasPermission(scope?: PermissionScope): boolean {
    if (!scope) return true;
    const resourcePermissions = this.sessionInfo().permissions?.[scope.domain]?.[scope.resource];
    return Array.isArray(resourcePermissions) && resourcePermissions.includes(scope.permission);
  }

  static requiresPermission(resource: Resource, permission: Permission): boolean {
    if (!AuthService.permissionFn) {
      throw new Error(
        `AuthState has not been initialized. Ensure AuthState is provided in your module or instantiated at least once.`,
      );
    }
    return AuthService.permissionFn(resource, permission);
  }

  private initializePermissionFn(): void {
    if (!AuthService.permissionFn) {
      AuthService.permissionFn = inject(PERMISSION_REQUIRED);
    }
  }

  /**
   * Logs a user out and calls the configured logout action.
   *
   * @returns Observable with a boolean indicating whether they were logged out.
   */
  logout(): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${this.sessionUrl}`, errorOptions(false))
      .pipe(map(() => true))
      .pipe(
        tap(() => {
          try {
            this.logoutAction();
          } catch (error) {
            console.error('Error during logout action (LOGOUT_ACTION token):', error);
          }
          this.authenticatedSignal.set(false);
          this.sessionInfoSignal.set({} as SessionInfo);
        }),
      );
  }

  /**
   * Checks a user's session with the server.
   *
   * @returns Observable with the user session info
   */
  checkUserSession(): Observable<SessionInfo> {
    return this.http.get<SessionInfo>(`${this.apiUrl}/${this.sessionUrl}`, errorOptions(false)).pipe(
      tap((sessionInfo) => {
        this.authenticatedSignal.set(!!sessionInfo?.authenticated);
        this.sessionInfoSignal.set(sessionInfo);
      }),
    );
  }

  loginRoute(): string {
    return this.loginUrl;
  }
}
