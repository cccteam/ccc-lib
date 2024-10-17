import { StateContext } from "@ngxs/store";
import { Observable } from "rxjs";
import { ErrorMessage } from "../models/error-message";
import { SessionInfo } from "../models/session-info";
import { AppAction } from "./core.actions";
import * as i0 from "@angular/core";
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
export declare const initState: CoreStateModel;
export declare class CoreState {
    private authService;
    private errors;
    static sidenavOpened(state: CoreStateModel): boolean;
    static permissions(state: CoreStateModel): string[] | undefined;
    static hasPermission(state: CoreStateModel): (permissions: string[]) => boolean;
    static isAuthenticated(state: CoreStateModel): boolean;
    static redirectUrl(state: CoreStateModel): string;
    static isLoading(state: CoreStateModel): boolean;
    static currentSidenavIdentifier(state: CoreStateModel): string;
    setNavIdentifier(ctx: StateContext<CoreStateModel>, action: AppAction.SetNavIdentifier): void;
    publishError(ctx: StateContext<CoreStateModel>, action: {
        message: ErrorMessage;
    }): void;
    checkUserSession(ctx: StateContext<CoreStateModel>): Observable<SessionInfo | null>;
    logout(ctx: StateContext<CoreStateModel>): Observable<boolean>;
    setRedirectUrl(ctx: StateContext<CoreStateModel>, action: {
        redirectUrl: string;
    }): CoreStateModel;
    beginActivity(ctx: StateContext<CoreStateModel>, action: {
        process: string;
    }): CoreStateModel;
    endActivity(ctx: StateContext<CoreStateModel>, action: {
        process: string;
    }): CoreStateModel | null;
    toggleSidenav(ctx: StateContext<CoreStateModel>): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CoreState, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<CoreState>;
}
