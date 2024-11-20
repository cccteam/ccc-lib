import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { map, Observable } from 'rxjs';
import { AuthState } from '../state/auth.state';

export const AuthorizationGuard = (route: ActivatedRouteSnapshot): Observable<boolean> => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(AuthState.hasPermission).pipe(
    map((permissionFn) => permissionFn(route.data['scopes'])),
    map((hasPermission) => {
      if (hasPermission) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
  );
};
