import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { cloneDeep } from 'lodash-es';
import { Observable, tap } from 'rxjs';
import { Domain } from '../models/permission-domain';
import { SessionInfo } from '../models/session-info';
import { AuthService } from '../services/auth.service';
import { ApiInterceptorAction, AppAction, AuthenticationGuardAction, LoginAction } from './auth.actions';

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

  @Selector()
  static permissions(state: AuthStateModel): string[] | undefined {
    return state?.sessionInfo?.permissions[Domain.Global];
  }

  @Selector()
  static hasPermission(state: AuthStateModel): (permissions: string[]) => boolean {
    return (permissions: string[]): boolean => {
      if (state?.sessionInfo?.permissions[Domain.Global]) {
        return state.sessionInfo.permissions[Domain.Global].some((p: string) => permissions.includes(p));
      }

      return false;
    };
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
