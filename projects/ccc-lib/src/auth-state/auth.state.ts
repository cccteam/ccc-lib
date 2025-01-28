import { inject, Injectable } from '@angular/core';
import { AuthService } from '@cccteam/ccc-lib/src/auth-service';
import {
  ApiInterceptorAction,
  AppAction,
  AuthenticationGuardAction,
  LoginAction,
  Permission,
  PERMISSION_REQUIRED,
  PermissionScope,
  Resource,
  SessionInfo,
} from '@cccteam/ccc-lib/src/types';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { cloneDeep } from 'lodash-es';
import { Observable, tap } from 'rxjs';

export interface AuthStateModel {
  authenticated: boolean;
  redirectUrl: string;
  sessionInfo: SessionInfo | null;
}

export const initState: AuthStateModel = {
  authenticated: false,
  redirectUrl: '',
  sessionInfo: null,
};

@State<AuthStateModel>({
  name: 'authState',
  defaults: initState,
})
@Injectable()
export class AuthState {
  private authService = inject(AuthService);
  private static permissionFn: (resource: Resource, permission: Permission) => boolean;

  constructor() {
    AuthState.initializePermissionFn();
  }

  private static initializePermissionFn(): void {
    if (!AuthState.permissionFn) {
      AuthState.permissionFn = inject(PERMISSION_REQUIRED);
    }
  }

  @Selector()
  static hasPermission(state: AuthStateModel): (scope?: PermissionScope) => boolean {
    return (scope?: PermissionScope) => {
      if (!scope) return true;
      const resourcePermissions = state?.sessionInfo?.permissions?.[scope.domain]?.[scope.resource];
      return Array.isArray(resourcePermissions) && resourcePermissions.includes(scope.permission);
    };
  }

  static requiresPermission(resource: Resource, permission: Permission): boolean {
    if (!AuthState.permissionFn) {
      throw new Error(
        `AuthState has not been initialized. Ensure AuthState is provided in your module or instantiated at least once.`,
      );
    }
    return AuthState.permissionFn(resource, permission);
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel): boolean {
    return state?.authenticated;
  }

  @Selector()
  static redirectUrl(state: AuthStateModel): string {
    return state?.redirectUrl;
  }

  @Action([AppAction.CheckUserSession, AuthenticationGuardAction.CheckUserSession])
  checkUserSession(ctx: StateContext<AuthStateModel>): Observable<SessionInfo | null> {
    return this.authService.checkUserSession().pipe(
      tap((result) =>
        ctx.setState(
          patch({
            authenticated: !!result?.authenticated,
            sessionInfo: result,
          }),
        ),
      ),
    );
  }

  @Action([LoginAction.Logout])
  logout(ctx: StateContext<AuthStateModel>): Observable<boolean> {
    const localStateCopy = cloneDeep(initState);
    localStateCopy.redirectUrl = ctx.getState().redirectUrl;
    return this.authService.logout().pipe(
      tap(() => {
        ctx.setState(localStateCopy);
      }),
    );
  }

  @Action([
    AppAction.SetRedirectUrl,
    LoginAction.SetRedirectUrl,
    AuthenticationGuardAction.SetRedirectUrl,
    ApiInterceptorAction.SetRedirectUrl,
  ])
  setRedirectUrl(ctx: StateContext<AuthStateModel>, action: { redirectUrl: string }): AuthStateModel {
    ctx.setState(
      patch({
        redirectUrl: action.redirectUrl,
      }),
    );
    return ctx.getState();
  }
}
