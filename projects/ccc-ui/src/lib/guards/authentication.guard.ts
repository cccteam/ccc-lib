import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BASE_URL } from '../base/tokens';
import { AuthService } from '../service/auth.service';
import { AuthenticationGuardAction } from '../state/core.actions';
import { CoreState } from '../state/core.state';

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

  return store.select(CoreState.isAuthenticated).pipe(
    switchMap((authenticated) => {
      if (authenticated) {
        return of(authenticated);
      }
      // Handle uninitialized state (ie Browser reload)
      return store.dispatch(AuthenticationGuardAction.CheckUserSession).pipe(
        switchMap(() => {
          return store.select(CoreState.isAuthenticated);
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
