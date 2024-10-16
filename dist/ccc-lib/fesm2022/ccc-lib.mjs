import * as i0 from '@angular/core';
import { InjectionToken, inject, Injectable, NgZone, EventEmitter, Component, Input, Output } from '@angular/core';
import * as i4 from '@angular/router';
import { Router, RouterModule } from '@angular/router';
import { Action, Selector, State, Store } from '@ngxs/store';
import { map, BehaviorSubject, tap, of, catchError as catchError$1, throwError, finalize } from 'rxjs';
import { __decorate } from 'tslib';
import { patch } from '@ngxs/store/operators';
import * as i1 from '@angular/common/http';
import { HttpContextToken, HttpContext } from '@angular/common/http';
import { cloneDeep } from 'lodash-es';
import { switchMap, map as map$1, catchError } from 'rxjs/operators';
import * as i3 from '@angular/common';
import { CommonModule } from '@angular/common';
import * as i2 from '@angular/material/button';
import { MatButtonModule } from '@angular/material/button';
import * as i1$1 from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';

/* eslint-disable @typescript-eslint/no-namespace */
// no-namespace rule is disabled because action hygiene prevents import pollution
var AuthenticationGuardAction;
(function (AuthenticationGuardAction) {
    class SetRedirectUrl {
        redirectUrl;
        static type = '[AuthenticationGuard] Set Redirect Url And Navigate To Login Page';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    AuthenticationGuardAction.SetRedirectUrl = SetRedirectUrl;
    class CheckUserSession {
        static type = '[AuthenticationGuard] Check User Session';
    }
    AuthenticationGuardAction.CheckUserSession = CheckUserSession;
})(AuthenticationGuardAction || (AuthenticationGuardAction = {}));
var ApiInterceptorAction;
(function (ApiInterceptorAction) {
    class BeginActivity {
        process;
        static type = '[ApiInterceptor] Add Loading Activity';
        constructor(process) {
            this.process = process;
        }
    }
    ApiInterceptorAction.BeginActivity = BeginActivity;
    class EndActivity {
        process;
        static type = '[ApiInterceptor] Remove Loading Activity';
        constructor(process) {
            this.process = process;
        }
    }
    ApiInterceptorAction.EndActivity = EndActivity;
    class SetRedirectUrl {
        redirectUrl;
        static type = '[ApiInterceptor] Set Redirect Url';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    ApiInterceptorAction.SetRedirectUrl = SetRedirectUrl;
    class PublishError {
        message;
        static type = '[ApiInterceptor] Publish Error';
        constructor(message) {
            this.message = message;
        }
    }
    ApiInterceptorAction.PublishError = PublishError;
})(ApiInterceptorAction || (ApiInterceptorAction = {}));
var LoginAction;
(function (LoginAction) {
    class Logout {
        static type = '[Login] Auto Logout';
    }
    LoginAction.Logout = Logout;
    class SetRedirectUrl {
        redirectUrl;
        static type = '[Login] Set Redirect Url';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    LoginAction.SetRedirectUrl = SetRedirectUrl;
    class PublishError {
        message;
        static type = '[Login] Publish Error';
        constructor(message) {
            this.message = message;
        }
    }
    LoginAction.PublishError = PublishError;
})(LoginAction || (LoginAction = {}));
var AppAction;
(function (AppAction) {
    class CheckUserSession {
        static type = '[App] Check User Session';
    }
    AppAction.CheckUserSession = CheckUserSession;
    class SetRedirectUrl {
        redirectUrl;
        static type = '[App] Set Redirect Url';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    AppAction.SetRedirectUrl = SetRedirectUrl;
})(AppAction || (AppAction = {}));
var HeaderAction;
(function (HeaderAction) {
    class ToggleSidenav {
        static type = '[Header] Toggle Sidenav';
    }
    HeaderAction.ToggleSidenav = ToggleSidenav;
    class Logout {
        static type = '[Header] User Logout';
    }
    HeaderAction.Logout = Logout;
})(HeaderAction || (HeaderAction = {}));

var Domain;
(function (Domain) {
    Domain[Domain["Global"] = 0] = "Global";
})(Domain || (Domain = {}));

const CUSTOM_HTTP_REQUEST_OPTIONS = new HttpContextToken(() => ({
    suppressGlobalError: false,
}));
function errorOptions(suppressGlobalError) {
    return {
        context: new HttpContext().set(CUSTOM_HTTP_REQUEST_OPTIONS, {
            suppressGlobalError: suppressGlobalError ?? false,
        }),
    };
}

const routes = {
    login: (rootUrl) => `${rootUrl}/user/login`,
    session: (rootUrl) => `${rootUrl}/user/session`,
};
class AuthService {
    http;
    API_URL = new InjectionToken('apiUrl');
    apiUrl = inject(this.API_URL);
    constructor(http) {
        this.http = http;
    }
    /**
     * Logs a user out.
     *
     * @returns Observable with a boolean indicating whether they were logged out.
     */
    logout() {
        return this.http
            .delete(routes.session(this.apiUrl), errorOptions(false))
            .pipe(map(() => true));
    }
    /**
     * Checks a user's session with the server.
     *
     * @returns Observable with the user session info
     */
    checkUserSession() {
        return this.http.get(routes.session(this.apiUrl), errorOptions(false));
    }
    loginRoute() {
        return routes.login(this.apiUrl);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, deps: [{ token: i1.HttpClient }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }] });

class ErrorService {
    errorMessages = new BehaviorSubject([]);
    errorId = 0;
    addGlobalError(error) {
        error.id = this.errorId++;
        this.errorMessages.next([...this.errorMessages.value, error]);
        return error.id;
    }
    dismissGlobalErrorById(errorId) {
        this.errorMessages.next(this.errorMessages.value.filter((a) => !(a.id === errorId)));
    }
    dismissGlobalError(error) {
        if (error.id !== undefined) {
            this.dismissGlobalErrorById(error.id);
        }
    }
    updateError(error) {
        this.errorMessages.next(this.errorMessages.value.map((a) => {
            if (a.id === error.id) {
                return error;
            }
            return a;
        }));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ErrorService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ErrorService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ErrorService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }] });

const initState = {
    loading: [],
    sidenavOpened: true,
    auth: {
        authenticated: false,
        redirectUrl: '',
        sessionInfo: null,
    },
};
let CoreState = class CoreState {
    authService = inject(AuthService);
    errors = inject(ErrorService);
    static sidenavOpened(state) {
        return state?.sidenavOpened;
    }
    static permissions(state) {
        return state?.auth.sessionInfo?.permissions[Domain.Global];
    }
    static hasPermission(state) {
        return (permissions) => {
            if (state?.auth.sessionInfo?.permissions[Domain.Global]) {
                return state.auth.sessionInfo.permissions[Domain.Global].some((p) => permissions.includes(p));
            }
            return false;
        };
    }
    static isAuthenticated(state) {
        return state?.auth.authenticated;
    }
    static redirectUrl(state) {
        return state?.auth.redirectUrl;
    }
    static isLoading(state) {
        return state.loading.length > 0;
    }
    publishError(ctx, action) {
        this.errors.addGlobalError(action.message);
    }
    checkUserSession(ctx) {
        return this.authService.checkUserSession().pipe(tap((result) => ctx.setState(patch({
            auth: patch({
                authenticated: !!result?.authenticated,
                sessionInfo: result,
            }),
        }))));
    }
    logout(ctx) {
        const localStateCopy = cloneDeep(initState);
        localStateCopy.auth.redirectUrl = ctx.getState().auth.redirectUrl;
        return this.authService.logout().pipe(tap(() => {
            ctx.setState(localStateCopy);
        }));
    }
    setRedirectUrl(ctx, action) {
        ctx.setState(patch({
            auth: patch({
                redirectUrl: action.redirectUrl,
            }),
        }));
        return ctx.getState();
    }
    beginActivity(ctx, action) {
        const state = ctx.getState();
        ctx.patchState({
            loading: [action.process, ...state.loading],
        });
        return ctx.getState();
    }
    endActivity(ctx, action) {
        const loading = ctx.getState().loading;
        // There can be multiple activities running with the same process signature
        const index = loading.findIndex((activity) => activity === action.process);
        if (index !== -1) {
            const newLoading = [
                ...loading.slice(0, index),
                ...loading.slice(index + 1),
            ];
            ctx.patchState({
                loading: newLoading,
            });
            return ctx.getState();
        }
        return null;
    }
    toggleSidenav(ctx) {
        ctx.setState(patch({
            sidenavOpened: !ctx.getState().sidenavOpened,
        }));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: CoreState, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: CoreState });
};
__decorate([
    Action([ApiInterceptorAction.PublishError, LoginAction.PublishError])
], CoreState.prototype, "publishError", null);
__decorate([
    Action([
        AppAction.CheckUserSession,
        AuthenticationGuardAction.CheckUserSession,
    ])
], CoreState.prototype, "checkUserSession", null);
__decorate([
    Action([LoginAction.Logout])
], CoreState.prototype, "logout", null);
__decorate([
    Action([
        AppAction.SetRedirectUrl,
        LoginAction.SetRedirectUrl,
        AuthenticationGuardAction.SetRedirectUrl,
        ApiInterceptorAction.SetRedirectUrl,
    ])
], CoreState.prototype, "setRedirectUrl", null);
__decorate([
    Action([ApiInterceptorAction.BeginActivity])
], CoreState.prototype, "beginActivity", null);
__decorate([
    Action([ApiInterceptorAction.EndActivity])
], CoreState.prototype, "endActivity", null);
__decorate([
    Action([HeaderAction.ToggleSidenav])
], CoreState.prototype, "toggleSidenav", null);
__decorate([
    Selector()
], CoreState, "sidenavOpened", null);
__decorate([
    Selector()
], CoreState, "permissions", null);
__decorate([
    Selector()
], CoreState, "hasPermission", null);
__decorate([
    Selector()
], CoreState, "isAuthenticated", null);
__decorate([
    Selector()
], CoreState, "redirectUrl", null);
__decorate([
    Selector()
], CoreState, "isLoading", null);
CoreState = __decorate([
    State({
        name: 'coreState',
        defaults: initState,
    })
], CoreState);
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: CoreState, decorators: [{
            type: Injectable
        }], propDecorators: { publishError: [], checkUserSession: [], logout: [], setRedirectUrl: [], beginActivity: [], endActivity: [], toggleSidenav: [] } });

const AuthorizationGuard = (route) => {
    const store = inject(Store);
    const router = inject(Router);
    return store.select(CoreState.hasPermission).pipe(map((permissionFn) => permissionFn(route.data['permissions'])), map((hasPermission) => {
        if (hasPermission) {
            return true;
        }
        router.navigate(['/']);
        return false;
    }));
};

const AuthenticationGuard = (route, routerState) => {
    const store = inject(Store);
    const authService = inject(AuthService);
    const API_URL = new InjectionToken('apiUrl');
    const apiUrl = inject(API_URL);
    const authenticate = () => {
        const url = routerState.url;
        const absoluteUrl = apiUrl + (!url.toString().startsWith('/') ? '/' + url : url);
        const encodedUrl = encodeURIComponent(absoluteUrl);
        window.location.href = `${authService.loginRoute()}?returnUrl=${encodedUrl}`;
    };
    return store.select(CoreState.isAuthenticated).pipe(switchMap((authenticated) => {
        if (authenticated) {
            return of(authenticated);
        }
        // Handle uninitialized state (ie Browser reload)
        return store.dispatch(AuthenticationGuardAction.CheckUserSession).pipe(switchMap(() => {
            return store.select(CoreState.isAuthenticated);
        }));
    }), map$1((authenticated) => {
        if (authenticated) {
            return true;
        }
        authenticate();
        return false;
    }), catchError(() => {
        authenticate();
        return of(false);
    }));
};

var AlertLevel;
(function (AlertLevel) {
    AlertLevel["ERROR"] = "warn";
    AlertLevel["INFO"] = "accent";
})(AlertLevel || (AlertLevel = {}));

class ApiInterceptor {
    store = inject(Store);
    router = inject(Router);
    ngZone = inject(NgZone);
    intercept(request, next) {
        this.store.dispatch(new ApiInterceptorAction.BeginActivity(request.method + ' ' + request.url));
        return next.handle(request).pipe(catchError$1((error) => {
            if (error.status === 401) {
                this.ngZone.run(() => {
                    this.store.dispatch(new ApiInterceptorAction.SetRedirectUrl(this.router.url));
                    this.router.navigate(['/login']);
                });
            }
            if (!request.context.get(CUSTOM_HTTP_REQUEST_OPTIONS).suppressGlobalError) {
                const message = error.error?.message ?? error.message ?? error.error;
                this.store.dispatch(new ApiInterceptorAction.PublishError({
                    message: message,
                    level: AlertLevel.ERROR,
                    link: '',
                }));
            }
            return throwError(() => error);
        }), finalize(() => {
            this.store.dispatch(new ApiInterceptorAction.EndActivity(request.method + ' ' + request.url));
        }));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ApiInterceptor, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ApiInterceptor });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: ApiInterceptor, decorators: [{
            type: Injectable
        }] });

class AlertComponent {
    error;
    dismiss = new EventEmitter();
    errors = inject(ErrorService);
    ngOnInit() {
        if (this.error.duration === undefined) {
            this.error.duration = 30000;
        }
        setTimeout(() => {
            this.dismissAlert();
        }, this.error.duration);
    }
    dismissAlert() {
        if (this.error.id !== undefined) {
            this.errors.dismissGlobalError(this.error);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AlertComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "18.2.7", type: AlertComponent, isStandalone: true, selector: "app-alert", inputs: { error: "error" }, outputs: { dismiss: "dismiss" }, ngImport: i0, template: "<div class=\"alert\" [ngClass]=\"error.level\">\n  <div class=\"message\">\n    <span>{{ error.message }}</span>\n  </div>\n  <div class=\"alert-end\">\n    @if (error.link) {\n    <span [routerLink]=\"error.link\" class=\"link\">View</span>\n    }\n    <button (click)=\"dismissAlert()\" mat-icon-button aria-label=\"Close Alert\">\n      <mat-icon>close</mat-icon>\n    </button>\n  </div>\n</div>\n", styles: [".alert{margin:auto;border:1px solid;max-width:450px;border-radius:5px;background-color:#d3d3d3;display:flex;flex-direction:row;align-items:center;justify-content:space-between}.message{padding-left:15px;max-width:400px;display:flex;justify-content:space-between}.alert-end{display:flex;flex-direction:row;align-items:center;gap:5px}.link{cursor:pointer}.link:hover{text-decoration:underline}.warn{border-color:red;background-color:#fff5f4}.accent{border-color:#dfb51d;background-color:#fff8e0}\n"], dependencies: [{ kind: "ngmodule", type: MatIconModule }, { kind: "component", type: i1$1.MatIcon, selector: "mat-icon", inputs: ["color", "inline", "svgIcon", "fontSet", "fontIcon"], exportAs: ["matIcon"] }, { kind: "ngmodule", type: MatButtonModule }, { kind: "component", type: i2.MatIconButton, selector: "button[mat-icon-button]", exportAs: ["matButton"] }, { kind: "ngmodule", type: CommonModule }, { kind: "directive", type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "ngmodule", type: RouterModule }, { kind: "directive", type: i4.RouterLink, selector: "[routerLink]", inputs: ["target", "queryParams", "fragment", "queryParamsHandling", "state", "info", "relativeTo", "preserveFragment", "skipLocationChange", "replaceUrl", "routerLink"] }] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AlertComponent, decorators: [{
            type: Component,
            args: [{ selector: 'app-alert', standalone: true, imports: [MatIconModule, MatButtonModule, CommonModule, RouterModule], template: "<div class=\"alert\" [ngClass]=\"error.level\">\n  <div class=\"message\">\n    <span>{{ error.message }}</span>\n  </div>\n  <div class=\"alert-end\">\n    @if (error.link) {\n    <span [routerLink]=\"error.link\" class=\"link\">View</span>\n    }\n    <button (click)=\"dismissAlert()\" mat-icon-button aria-label=\"Close Alert\">\n      <mat-icon>close</mat-icon>\n    </button>\n  </div>\n</div>\n", styles: [".alert{margin:auto;border:1px solid;max-width:450px;border-radius:5px;background-color:#d3d3d3;display:flex;flex-direction:row;align-items:center;justify-content:space-between}.message{padding-left:15px;max-width:400px;display:flex;justify-content:space-between}.alert-end{display:flex;flex-direction:row;align-items:center;gap:5px}.link{cursor:pointer}.link:hover{text-decoration:underline}.warn{border-color:red;background-color:#fff5f4}.accent{border-color:#dfb51d;background-color:#fff8e0}\n"] }]
        }], propDecorators: { error: [{
                type: Input,
                args: [{ required: true }]
            }], dismiss: [{
                type: Output
            }] } });

/*
 * Public API Surface of ccc-lib
 */
// Guards

/**
 * Generated bundle index. Do not edit.
 */

export { AlertComponent, AlertLevel, ApiInterceptor, ApiInterceptorAction, AppAction, AuthService, AuthenticationGuard, AuthenticationGuardAction, AuthorizationGuard, CUSTOM_HTTP_REQUEST_OPTIONS, CoreState, Domain, ErrorService, HeaderAction, LoginAction, errorOptions, initState };
//# sourceMappingURL=ccc-lib.mjs.map
