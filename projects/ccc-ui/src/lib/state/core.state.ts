import { Injectable, inject } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';
import { cloneDeep } from 'lodash-es';
import { Observable, tap } from 'rxjs';
import { ErrorMessage } from '../models/error-message';
import { Domain } from '../models/permission-domain';
import { SessionInfo } from '../models/session-info';
import { AuthService } from '../service/auth.service';
import { ErrorService } from '../service/error.service';
import { ApiInterceptorAction, AppAction, AuthenticationGuardAction, HeaderAction, LoginAction } from './core.actions';

export interface CoreStateModel {
  loading: string[];
  sidenavOpened: boolean;
  currentSidenavIdentifier: string;
  auth: {
    authenticated: boolean;
    redirectUrl: string;
    sessionInfo: SessionInfo | null;
  };
}

export const initState: CoreStateModel = {
  loading: [],
  sidenavOpened: true,
  currentSidenavIdentifier: '',
  auth: {
    authenticated: false,
    redirectUrl: '',
    sessionInfo: null,
  },
};

@State<CoreStateModel>({
  name: 'coreState',
  defaults: initState,
})
@Injectable()
export class CoreState {
  private authService = inject(AuthService);
  private errors = inject(ErrorService);

  @Selector()
  static sidenavOpened(state: CoreStateModel): boolean {
    return state?.sidenavOpened;
  }

  @Selector()
  static permissions(state: CoreStateModel): string[] | undefined {
    return state?.auth.sessionInfo?.permissions[Domain.Global];
  }

  @Selector()
  static hasPermission(state: CoreStateModel): (permissions: string[]) => boolean {
    return (permissions: string[]): boolean => {
      if (state?.auth.sessionInfo?.permissions[Domain.Global]) {
        return state.auth.sessionInfo.permissions[Domain.Global].some((p: string) => permissions.includes(p));
      }

      return false;
    };
  }

  @Selector()
  static isAuthenticated(state: CoreStateModel): boolean {
    return state?.auth.authenticated;
  }

  @Selector()
  static redirectUrl(state: CoreStateModel): string {
    return state?.auth.redirectUrl;
  }

  @Selector()
  static isLoading(state: CoreStateModel): boolean {
    return state.loading.length > 0;
  }

  @Selector()
  static currentSidenavIdentifier(state: CoreStateModel): string {
    return state.currentSidenavIdentifier;
  }

  @Action([AppAction.SetNavIdentifier])
  setNavIdentifier(ctx: StateContext<CoreStateModel>, action: AppAction.SetNavIdentifier): void {
    ctx.setState(
      patch({
        currentSidenavIdentifier: action.identifier,
      }),
    );
  }

  @Action([ApiInterceptorAction.PublishError, LoginAction.PublishError])
  publishError(ctx: StateContext<CoreStateModel>, action: { message: ErrorMessage }): void {
    this.errors.addGlobalError(action.message);
  }

  @Action([AppAction.CheckUserSession, AuthenticationGuardAction.CheckUserSession])
  checkUserSession(ctx: StateContext<CoreStateModel>): Observable<SessionInfo | null> {
    return this.authService.checkUserSession().pipe(
      tap((result) =>
        ctx.setState(
          patch({
            auth: patch({
              authenticated: !!result?.authenticated,
              sessionInfo: result,
            }),
          }),
        ),
      ),
    );
  }

  @Action([LoginAction.Logout])
  logout(ctx: StateContext<CoreStateModel>): Observable<boolean> {
    const localStateCopy = cloneDeep(initState);
    localStateCopy.auth.redirectUrl = ctx.getState().auth.redirectUrl;
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
  setRedirectUrl(ctx: StateContext<CoreStateModel>, action: { redirectUrl: string }): CoreStateModel {
    ctx.setState(
      patch({
        auth: patch({
          redirectUrl: action.redirectUrl,
        }),
      }),
    );
    return ctx.getState();
  }

  @Action([ApiInterceptorAction.BeginActivity])
  beginActivity(ctx: StateContext<CoreStateModel>, action: { process: string }): CoreStateModel {
    const state = ctx.getState();
    ctx.patchState({
      loading: [action.process, ...state.loading],
    });
    return ctx.getState();
  }

  @Action([ApiInterceptorAction.EndActivity])
  endActivity(ctx: StateContext<CoreStateModel>, action: { process: string }): CoreStateModel | null {
    const loading = ctx.getState().loading;
    // There can be multiple activities running with the same process signature
    const index = loading.findIndex((activity) => activity === action.process);
    if (index !== -1) {
      const newLoading = [...loading.slice(0, index), ...loading.slice(index + 1)];
      ctx.patchState({
        loading: newLoading,
      });
      return ctx.getState();
    }
    return null;
  }

  @Action([HeaderAction.ToggleSidenav])
  toggleSidenav(ctx: StateContext<CoreStateModel>): void {
    ctx.setState(
      patch({
        sidenavOpened: !ctx.getState().sidenavOpened,
      }),
    );
  }
}
