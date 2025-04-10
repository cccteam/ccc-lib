import { Injectable, inject } from '@angular/core';
import {
  ApiInterceptorAction,
  AppAction,
  CreateNotificationMessage,
  HeaderAction,
  LoginAction,
} from '@cccteam/ccc-lib/src/types';
import { NotificationService } from '@cccteam/ccc-lib/src/ui-notification-service';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';

interface CoreStateModel {
  loading: string[];
  sidenavOpened: boolean;
  currentSidenavIdentifier: string;
}

const initState: CoreStateModel = {
  loading: [],
  sidenavOpened: true,
  currentSidenavIdentifier: '',
};

@State<CoreStateModel>({
  name: 'coreState',
  defaults: initState,
})
@Injectable()
export class CoreState {
  private notifications = inject(NotificationService);

  @Selector()
  static sidenavOpened(state: CoreStateModel): boolean {
    return state?.sidenavOpened;
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
  publishError(ctx: StateContext<CoreStateModel>, action: { message: CreateNotificationMessage }): void {
    this.notifications.addGlobalNotification(action.message);
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
