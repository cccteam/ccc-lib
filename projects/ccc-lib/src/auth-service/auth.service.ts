import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, signal } from '@angular/core';
import {
  API_URL,
  Permission,
  PERMISSION_REQUIRED,
  PermissionScope,
  Resource,
  SessionInfo,
} from '@cccteam/ccc-lib/src/types';
import { errorOptions } from '@cccteam/ccc-lib/src/util-request-options';
import { map, Observable, tap } from 'rxjs';

const routes = {
  login: (rootUrl: string): string => `${rootUrl}/user/login`,
  session: (rootUrl: string): string => `${rootUrl}/user/session`,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  private authenticatedSignal = signal(false);
  private sessionInfoSignal = signal({} as SessionInfo);

  redirectUrl = signal('');
  authenticated = this.authenticatedSignal.asReadonly();
  sessionInfo = this.sessionInfoSignal.asReadonly();

  constructor(@Inject(API_URL) private apiUrl: string) {
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
   * Logs a user out.
   *
   * @returns Observable with a boolean indicating whether they were logged out.
   */
  logout(): Observable<boolean> {
    return this.http
      .delete(routes.session(this.apiUrl), errorOptions(false))
      .pipe(map(() => true))
      .pipe(
        tap(() => {
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
    return this.http.get<SessionInfo>(routes.session(this.apiUrl), errorOptions(false)).pipe(
      tap((sessionInfo) => {
        this.authenticatedSignal.set(!!sessionInfo?.authenticated);
        this.sessionInfoSignal.set(sessionInfo);
      }),
    );
  }

  loginRoute(): string {
    return routes.login(this.apiUrl);
  }
}
