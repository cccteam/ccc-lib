import { __decorate } from "tslib";
import { Injectable, inject } from '@angular/core';
import { Action, Selector, State } from '@ngxs/store';
import { ApiInterceptorAction, AppAction, AuthenticationGuardAction, LoginAction, HeaderAction, } from './core.actions';
import { tap } from 'rxjs';
import { patch } from '@ngxs/store/operators';
import { Domain } from '../models/permission-domain';
import { AuthService } from '../service/auth.service';
import { ErrorService } from '../service/error.service';
import { cloneDeep } from 'lodash-es';
import * as i0 from "@angular/core";
export const initState = {
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
export { CoreState };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: CoreState, decorators: [{
            type: Injectable
        }], propDecorators: { publishError: [], checkUserSession: [], logout: [], setRedirectUrl: [], beginActivity: [], endActivity: [], toggleSidenav: [] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5zdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NjYy1saWIvc3JjL2xpYi9zdGF0ZS9jb3JlLnN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQWdCLE1BQU0sYUFBYSxDQUFDO0FBQ3BFLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsU0FBUyxFQUNULHlCQUF5QixFQUN6QixXQUFXLEVBQ1gsWUFBWSxHQUNiLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEIsT0FBTyxFQUFjLEdBQUcsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUN2QyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFOUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBRXJELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDeEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQzs7QUFZdEMsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFtQjtJQUN2QyxPQUFPLEVBQUUsRUFBRTtJQUNYLGFBQWEsRUFBRSxJQUFJO0lBQ25CLElBQUksRUFBRTtRQUNKLGFBQWEsRUFBRSxLQUFLO1FBQ3BCLFdBQVcsRUFBRSxFQUFFO1FBQ2YsV0FBVyxFQUFFLElBQUk7S0FDbEI7Q0FDRixDQUFDO0FBT0ssSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFTO0lBQ1osV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRy9CLEFBQVAsTUFBTSxD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QU1yRTtBQU1EO0lBSkMsTUFBTSxDQUFDO1FBQ04sU0FBUyxDQUFDLGdCQUFnQjtRQUMxQix5QkFBeUIsQ0FBQyxnQkFBZ0I7S0FDM0MsQ0FBQztpREFnQkQ7QUFHRDtJQURDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQzt1Q0FTNUI7QUFRRDtJQU5DLE1BQU0sQ0FBQztRQUNOLFNBQVMsQ0FBQyxjQUFjO1FBQ3hCLFdBQVcsQ0FBQyxjQUFjO1FBQzFCLHlCQUF5QixDQUFDLGNBQWM7UUFDeEMsb0JBQW9CLENBQUMsY0FBYztLQUNwQyxDQUFDOytDQWFEO0FBR0Q7SUFEQyxNQUFNLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQzs4Q0FVNUM7QUFHRDtJQURDLE1BQU0sQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDOzRDQW1CMUM7QUFHRDtJQURDLE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQzs4Q0FPcEM7QUEzSU07SUFETixRQUFRLEVBQUU7b0NBR1Y7QUFHTTtJQUROLFFBQVEsRUFBRTtrQ0FHVjtBQUdNO0lBRE4sUUFBUSxFQUFFO29DQWFWO0FBR007SUFETixRQUFRLEVBQUU7c0NBR1Y7QUFHTTtJQUROLFFBQVEsRUFBRTtrQ0FHVjtBQUdNO0lBRE4sUUFBUSxFQUFFO2dDQUdWO0FBMUNVLFNBQVM7SUFMckIsS0FBSyxDQUFpQjtRQUNyQixJQUFJLEVBQUUsV0FBVztRQUNqQixRQUFRLEVBQUUsU0FBUztLQUNwQixDQUFDO0dBRVcsU0FBUyxDQWlKckI7OzJGQWpKWSxTQUFTO2tCQURyQixVQUFVOzhCQThDVCxZQUFZLE1BV1osZ0JBQWdCLE1Ba0JoQixNQUFNLE1BZ0JOLGNBQWMsTUFlZCxhQUFhLE1BWWIsV0FBVyxNQXFCWCxhQUFhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgaW5qZWN0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBBY3Rpb24sIFNlbGVjdG9yLCBTdGF0ZSwgU3RhdGVDb250ZXh0IH0gZnJvbSAnQG5neHMvc3RvcmUnO1xuaW1wb3J0IHtcbiAgQXBpSW50ZXJjZXB0b3JBY3Rpb24sXG4gIEFwcEFjdGlvbixcbiAgQXV0aGVudGljYXRpb25HdWFyZEFjdGlvbixcbiAgTG9naW5BY3Rpb24sXG4gIEhlYWRlckFjdGlvbixcbn0gZnJvbSAnLi9jb3JlLmFjdGlvbnMnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgdGFwIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBwYXRjaCB9IGZyb20gJ0BuZ3hzL3N0b3JlL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTZXNzaW9uSW5mbyB9IGZyb20gJy4uL21vZGVscy9zZXNzaW9uLWluZm8nO1xuaW1wb3J0IHsgRG9tYWluIH0gZnJvbSAnLi4vbW9kZWxzL3Blcm1pc3Npb24tZG9tYWluJztcbmltcG9ydCB7IEVycm9yTWVzc2FnZSB9IGZyb20gJy4uL21vZGVscy9lcnJvci1tZXNzYWdlJztcbmltcG9ydCB7IEF1dGhTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZS9hdXRoLnNlcnZpY2UnO1xuaW1wb3J0IHsgRXJyb3JTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZS9lcnJvci5zZXJ2aWNlJztcbmltcG9ydCB7IGNsb25lRGVlcCB9IGZyb20gJ2xvZGFzaC1lcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29yZVN0YXRlTW9kZWwge1xuICBsb2FkaW5nOiBzdHJpbmdbXTtcbiAgc2lkZW5hdk9wZW5lZDogYm9vbGVhbjtcbiAgYXV0aDoge1xuICAgIGF1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47XG4gICAgcmVkaXJlY3RVcmw6IHN0cmluZztcbiAgICBzZXNzaW9uSW5mbzogU2Vzc2lvbkluZm8gfCBudWxsO1xuICB9O1xufVxuXG5leHBvcnQgY29uc3QgaW5pdFN0YXRlOiBDb3JlU3RhdGVNb2RlbCA9IHtcbiAgbG9hZGluZzogW10sXG4gIHNpZGVuYXZPcGVuZWQ6IHRydWUsXG4gIGF1dGg6IHtcbiAgICBhdXRoZW50aWNhdGVkOiBmYWxzZSxcbiAgICByZWRpcmVjdFVybDogJycsXG4gICAgc2Vzc2lvbkluZm86IG51bGwsXG4gIH0sXG59O1xuXG5AU3RhdGU8Q29yZVN0YXRlTW9kZWw+KHtcbiAgbmFtZTogJ2NvcmVTdGF0ZScsXG4gIGRlZmF1bHRzOiBpbml0U3RhdGUsXG59KVxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIENvcmVTdGF0ZSB7XG4gIHByaXZhdGUgYXV0aFNlcnZpY2UgPSBpbmplY3QoQXV0aFNlcnZpY2UpO1xuICBwcml2YXRlIGVycm9ycyA9IGluamVjdChFcnJvclNlcnZpY2UpO1xuXG4gIEBTZWxlY3RvcigpXG4gIHN0YXRpYyBzaWRlbmF2T3BlbmVkKHN0YXRlOiBDb3JlU3RhdGVNb2RlbCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdGF0ZT8uc2lkZW5hdk9wZW5lZDtcbiAgfVxuXG4gIEBTZWxlY3RvcigpXG4gIHN0YXRpYyBwZXJtaXNzaW9ucyhzdGF0ZTogQ29yZVN0YXRlTW9kZWwpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHN0YXRlPy5hdXRoLnNlc3Npb25JbmZvPy5wZXJtaXNzaW9uc1tEb21haW4uR2xvYmFsXTtcbiAgfVxuXG4gIEBTZWxlY3RvcigpXG4gIHN0YXRpYyBoYXNQZXJtaXNzaW9uKFxuICAgIHN0YXRlOiBDb3JlU3RhdGVNb2RlbFxuICApOiAocGVybWlzc2lvbnM6IHN0cmluZ1tdKSA9PiBib29sZWFuIHtcbiAgICByZXR1cm4gKHBlcm1pc3Npb25zOiBzdHJpbmdbXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgaWYgKHN0YXRlPy5hdXRoLnNlc3Npb25JbmZvPy5wZXJtaXNzaW9uc1tEb21haW4uR2xvYmFsXSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuYXV0aC5zZXNzaW9uSW5mby5wZXJtaXNzaW9uc1tEb21haW4uR2xvYmFsXS5zb21lKFxuICAgICAgICAgIChwOiBzdHJpbmcpID0+IHBlcm1pc3Npb25zLmluY2x1ZGVzKHApXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICB9XG5cbiAgQFNlbGVjdG9yKClcbiAgc3RhdGljIGlzQXV0aGVudGljYXRlZChzdGF0ZTogQ29yZVN0YXRlTW9kZWwpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc3RhdGU/LmF1dGguYXV0aGVudGljYXRlZDtcbiAgfVxuXG4gIEBTZWxlY3RvcigpXG4gIHN0YXRpYyByZWRpcmVjdFVybChzdGF0ZTogQ29yZVN0YXRlTW9kZWwpOiBzdHJpbmcge1xuICAgIHJldHVybiBzdGF0ZT8uYXV0aC5yZWRpcmVjdFVybDtcbiAgfVxuXG4gIEBTZWxlY3RvcigpXG4gIHN0YXRpYyBpc0xvYWRpbmcoc3RhdGU6IENvcmVTdGF0ZU1vZGVsKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN0YXRlLmxvYWRpbmcubGVuZ3RoID4gMDtcbiAgfVxuXG4gIEBBY3Rpb24oW0FwaUludGVyY2VwdG9yQWN0aW9uLlB1Ymxpc2hFcnJvciwgTG9naW5BY3Rpb24uUHVibGlzaEVycm9yXSlcbiAgcHVibGlzaEVycm9yKFxuICAgIGN0eDogU3RhdGVDb250ZXh0PENvcmVTdGF0ZU1vZGVsPixcbiAgICBhY3Rpb246IHsgbWVzc2FnZTogRXJyb3JNZXNzYWdlIH1cbiAgKTogdm9pZCB7XG4gICAgdGhpcy5lcnJvcnMuYWRkR2xvYmFsRXJyb3IoYWN0aW9uLm1lc3NhZ2UpO1xuICB9XG5cbiAgQEFjdGlvbihbXG4gICAgQXBwQWN0aW9uLkNoZWNrVXNlclNlc3Npb24sXG4gICAgQXV0aGVudGljYXRpb25HdWFyZEFjdGlvbi5DaGVja1VzZXJTZXNzaW9uLFxuICBdKVxuICBjaGVja1VzZXJTZXNzaW9uKFxuICAgIGN0eDogU3RhdGVDb250ZXh0PENvcmVTdGF0ZU1vZGVsPlxuICApOiBPYnNlcnZhYmxlPFNlc3Npb25JbmZvIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLmF1dGhTZXJ2aWNlLmNoZWNrVXNlclNlc3Npb24oKS5waXBlKFxuICAgICAgdGFwKChyZXN1bHQpID0+XG4gICAgICAgIGN0eC5zZXRTdGF0ZShcbiAgICAgICAgICBwYXRjaCh7XG4gICAgICAgICAgICBhdXRoOiBwYXRjaCh7XG4gICAgICAgICAgICAgIGF1dGhlbnRpY2F0ZWQ6ICEhcmVzdWx0Py5hdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgICBzZXNzaW9uSW5mbzogcmVzdWx0LFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICBAQWN0aW9uKFtMb2dpbkFjdGlvbi5Mb2dvdXRdKVxuICBsb2dvdXQoY3R4OiBTdGF0ZUNvbnRleHQ8Q29yZVN0YXRlTW9kZWw+KTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgY29uc3QgbG9jYWxTdGF0ZUNvcHkgPSBjbG9uZURlZXAoaW5pdFN0YXRlKTtcbiAgICBsb2NhbFN0YXRlQ29weS5hdXRoLnJlZGlyZWN0VXJsID0gY3R4LmdldFN0YXRlKCkuYXV0aC5yZWRpcmVjdFVybDtcbiAgICByZXR1cm4gdGhpcy5hdXRoU2VydmljZS5sb2dvdXQoKS5waXBlKFxuICAgICAgdGFwKCgpID0+IHtcbiAgICAgICAgY3R4LnNldFN0YXRlKGxvY2FsU3RhdGVDb3B5KTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIEBBY3Rpb24oW1xuICAgIEFwcEFjdGlvbi5TZXRSZWRpcmVjdFVybCxcbiAgICBMb2dpbkFjdGlvbi5TZXRSZWRpcmVjdFVybCxcbiAgICBBdXRoZW50aWNhdGlvbkd1YXJkQWN0aW9uLlNldFJlZGlyZWN0VXJsLFxuICAgIEFwaUludGVyY2VwdG9yQWN0aW9uLlNldFJlZGlyZWN0VXJsLFxuICBdKVxuICBzZXRSZWRpcmVjdFVybChcbiAgICBjdHg6IFN0YXRlQ29udGV4dDxDb3JlU3RhdGVNb2RlbD4sXG4gICAgYWN0aW9uOiB7IHJlZGlyZWN0VXJsOiBzdHJpbmcgfVxuICApOiBDb3JlU3RhdGVNb2RlbCB7XG4gICAgY3R4LnNldFN0YXRlKFxuICAgICAgcGF0Y2goe1xuICAgICAgICBhdXRoOiBwYXRjaCh7XG4gICAgICAgICAgcmVkaXJlY3RVcmw6IGFjdGlvbi5yZWRpcmVjdFVybCxcbiAgICAgICAgfSksXG4gICAgICB9KVxuICAgICk7XG4gICAgcmV0dXJuIGN0eC5nZXRTdGF0ZSgpO1xuICB9XG5cbiAgQEFjdGlvbihbQXBpSW50ZXJjZXB0b3JBY3Rpb24uQmVnaW5BY3Rpdml0eV0pXG4gIGJlZ2luQWN0aXZpdHkoXG4gICAgY3R4OiBTdGF0ZUNvbnRleHQ8Q29yZVN0YXRlTW9kZWw+LFxuICAgIGFjdGlvbjogeyBwcm9jZXNzOiBzdHJpbmcgfVxuICApOiBDb3JlU3RhdGVNb2RlbCB7XG4gICAgY29uc3Qgc3RhdGUgPSBjdHguZ2V0U3RhdGUoKTtcbiAgICBjdHgucGF0Y2hTdGF0ZSh7XG4gICAgICBsb2FkaW5nOiBbYWN0aW9uLnByb2Nlc3MsIC4uLnN0YXRlLmxvYWRpbmddLFxuICAgIH0pO1xuICAgIHJldHVybiBjdHguZ2V0U3RhdGUoKTtcbiAgfVxuXG4gIEBBY3Rpb24oW0FwaUludGVyY2VwdG9yQWN0aW9uLkVuZEFjdGl2aXR5XSlcbiAgZW5kQWN0aXZpdHkoXG4gICAgY3R4OiBTdGF0ZUNvbnRleHQ8Q29yZVN0YXRlTW9kZWw+LFxuICAgIGFjdGlvbjogeyBwcm9jZXNzOiBzdHJpbmcgfVxuICApOiBDb3JlU3RhdGVNb2RlbCB8IG51bGwge1xuICAgIGNvbnN0IGxvYWRpbmcgPSBjdHguZ2V0U3RhdGUoKS5sb2FkaW5nO1xuICAgIC8vIFRoZXJlIGNhbiBiZSBtdWx0aXBsZSBhY3Rpdml0aWVzIHJ1bm5pbmcgd2l0aCB0aGUgc2FtZSBwcm9jZXNzIHNpZ25hdHVyZVxuICAgIGNvbnN0IGluZGV4ID0gbG9hZGluZy5maW5kSW5kZXgoKGFjdGl2aXR5KSA9PiBhY3Rpdml0eSA9PT0gYWN0aW9uLnByb2Nlc3MpO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IG5ld0xvYWRpbmcgPSBbXG4gICAgICAgIC4uLmxvYWRpbmcuc2xpY2UoMCwgaW5kZXgpLFxuICAgICAgICAuLi5sb2FkaW5nLnNsaWNlKGluZGV4ICsgMSksXG4gICAgICBdO1xuICAgICAgY3R4LnBhdGNoU3RhdGUoe1xuICAgICAgICBsb2FkaW5nOiBuZXdMb2FkaW5nLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY3R4LmdldFN0YXRlKCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgQEFjdGlvbihbSGVhZGVyQWN0aW9uLlRvZ2dsZVNpZGVuYXZdKVxuICB0b2dnbGVTaWRlbmF2KGN0eDogU3RhdGVDb250ZXh0PENvcmVTdGF0ZU1vZGVsPik6IHZvaWQge1xuICAgIGN0eC5zZXRTdGF0ZShcbiAgICAgIHBhdGNoKHtcbiAgICAgICAgc2lkZW5hdk9wZW5lZDogIWN0eC5nZXRTdGF0ZSgpLnNpZGVuYXZPcGVuZWQsXG4gICAgICB9KVxuICAgICk7XG4gIH1cbn1cbiJdfQ==