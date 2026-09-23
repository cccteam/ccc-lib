import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ADDITIONAL_SESSION_DATA_PATH,
  AdditionalSessionData,
  API_URL,
  FRONTEND_LOGIN_PATH,
  LOGOUT_ACTION,
  Permission,
  PERMISSION_REQUIRED,
  PermissionScope,
  Resource,
  RolePermissionCollection,
  SESSION_PATH,
  SessionInfo,
  UserPermissionCollection,
} from '@cccteam/ccc-lib/types';
import { errorOptions } from '@cccteam/ccc-lib/util-request-options';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService<TAdditional extends AdditionalSessionData = AdditionalSessionData> {
  private apiUrl = inject(API_URL);
  private loginUrl = inject(FRONTEND_LOGIN_PATH);
  private sessionUrl = inject(SESSION_PATH);
  private additionalSessionDataUrl = inject(ADDITIONAL_SESSION_DATA_PATH, { optional: true });
  private logoutAction = inject(LOGOUT_ACTION);

  private router = inject(Router);
  http = inject(HttpClient);
  private authenticatedSignal = signal(false);
  private sessionInfoSignal = signal({} as SessionInfo<TAdditional>);

  redirectUrl = signal('');
  authenticated = this.authenticatedSignal.asReadonly();
  sessionInfo = this.sessionInfoSignal.asReadonly();

  constructor() {
    this.initializePermissionFn();
  }

  private static permissionFn: (resource: Resource, permission: Permission) => boolean;

  private hasUserPermission(permissions: UserPermissionCollection, scope: PermissionScope): boolean {
    const resourcePermissions = permissions?.[scope.domain]?.[scope.resource];
    return scope.permission in (resourcePermissions ?? {});
  }

  private hasRolePermission(permissions: RolePermissionCollection, scope: PermissionScope): boolean {
    const allowedResources = permissions?.[scope.permission];
    return allowedResources?.includes(scope.resource) ?? false;
  }

  hasPermission(scope?: PermissionScope): boolean {
    if (!scope) return true;
    if (this.hasUserPermission(this.sessionInfo().permissions, scope)) {
      return true;
    }

    const additionalPermissions = this.sessionInfo().additionalData?.permissions;
    if (!additionalPermissions) return false;

    return scope.domain in additionalPermissions
      ? this.hasUserPermission(additionalPermissions as UserPermissionCollection, scope)
      : this.hasRolePermission(additionalPermissions as RolePermissionCollection, scope);
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
          this.sessionInfoSignal.set({} as SessionInfo<TAdditional>);
        }),
      );
  }

  /**
   * Checks a user's session with the server, and fetches additional session data in parallel.
   *
   * @returns Observable with the user session info
   */
  checkUserSession(): Observable<SessionInfo<TAdditional>> {
    const session$ = this.http.get<SessionInfo<TAdditional>>(`${this.apiUrl}/${this.sessionUrl}`, errorOptions(false));
    const shouldFetchAdditional = this.additionalSessionDataUrl && !this.router.url.includes(this.loginUrl);

    if (!shouldFetchAdditional) {
      return session$.pipe(
        tap((sessionInfo) => {
          this.authenticatedSignal.set(!!sessionInfo?.authenticated);
          this.sessionInfoSignal.set(sessionInfo);
        }),
      );
    }

    const additionalData$ = this.http
      .get<TAdditional>(`${this.apiUrl}/${this.additionalSessionDataUrl}`, errorOptions(false))
      .pipe(catchError(() => of({} as TAdditional)));

    return forkJoin({
      sessionInfo: session$,
      additionalData: additionalData$,
    }).pipe(
      map(({ sessionInfo, additionalData }) => ({
        ...sessionInfo,
        additionalData,
      })),
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
