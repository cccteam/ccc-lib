import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/src/auth-service';
import { BASE_URL } from '@cccteam/ccc-lib/src/types';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const AuthenticationGuard = (
  route: ActivatedRouteSnapshot,
  routerState: RouterStateSnapshot,
): Observable<boolean> => {
  const authService = inject(AuthService);
  const baseUrl = inject(BASE_URL);

  const authenticate = (): void => {
    const url = routerState.url;
    const absoluteUrl = baseUrl + (!url.toString().startsWith('/') ? '/' + url : url);
    const encodedUrl = encodeURIComponent(absoluteUrl);
    window.location.href = `${authService.loginRoute()}?returnUrl=${encodedUrl}`;
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
