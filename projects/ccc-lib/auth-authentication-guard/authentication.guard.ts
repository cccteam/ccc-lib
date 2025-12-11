import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';
import { API_URL, BASE_URL } from '@cccteam/ccc-lib/types';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const OIDCAuthenticationGuard = (
  route: ActivatedRouteSnapshot,
  routerState: RouterStateSnapshot,
): Observable<boolean> => {
  const authService = inject(AuthService);
  const baseUrl = inject(BASE_URL);
  const apiUrl = inject(API_URL);

  const authenticate = (): void => {
    const url = routerState.url;
    const absoluteUrl = baseUrl + (!url.toString().startsWith('/') ? '/' + url : url);
    const encodedUrl = encodeURIComponent(absoluteUrl);
    window.location.href = `${apiUrl}/user/login?returnUrl=${encodedUrl}`;
  };

  if (authService.authenticated()) {
    return of(true);
  }

  return authService.checkUserSession().pipe(
    map((sessionInfo) => {
      if (sessionInfo?.authenticated) {
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

export const LoginAuthenticationGuard = (
  _: ActivatedRouteSnapshot,
  routerState: RouterStateSnapshot,
): Observable<boolean> => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const baseUrl = inject(BASE_URL);

  const authenticate = (): void => {
    authService.redirectUrl.set(routerState.url);
    router.navigateByUrl(baseUrl + authService.loginRoute());
  };

  if (authService.authenticated()) {
    return of(true);
  }

  return authService.checkUserSession().pipe(
    map((sessionInfo) => {
      if (sessionInfo?.authenticated) {
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
