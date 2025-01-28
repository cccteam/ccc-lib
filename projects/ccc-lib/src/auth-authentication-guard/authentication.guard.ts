import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/src/auth-service';
import { AuthState } from '@cccteam/ccc-lib/src/auth-state';
import { AuthenticationGuardAction, BASE_URL } from '@cccteam/ccc-lib/src/types';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export const AuthenticationGuard = (
  route: ActivatedRouteSnapshot,
  routerState: RouterStateSnapshot,
): Observable<boolean> => {
  const store = inject(Store);
  const authService = inject(AuthService);

  const baseUrl = inject(BASE_URL);

  const authenticate = (): void => {
    const url = routerState.url;
    const absoluteUrl = baseUrl + (!url.toString().startsWith('/') ? '/' + url : url);
    const encodedUrl = encodeURIComponent(absoluteUrl);
    window.location.href = `${authService.loginRoute()}?returnUrl=${encodedUrl}`;
  };

  return store.select(AuthState.isAuthenticated).pipe(
    switchMap((authenticated) => {
      if (authenticated) {
        return of(authenticated);
      }
      // Handle uninitialized state (ie Browser reload)
      return store.dispatch(AuthenticationGuardAction.CheckUserSession).pipe(
        switchMap(() => {
          return store.select(AuthState.isAuthenticated);
        }),
      );
    }),
    map((authenticated) => {
      if (authenticated) {
        return true;
      }

      authenticate();

      return false;
    }),
    catchError(() => {
      authenticate();

      return of(false);
    }),
  );
};
