import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthState } from '@cccteam/ccc-lib/src/auth-state';
import { Store } from '@ngxs/store';
import { map, Observable } from 'rxjs';

export const AuthorizationGuard = (route: ActivatedRouteSnapshot): Observable<boolean> => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(AuthState.hasPermission).pipe(
    map((permissionFn) => permissionFn(route.data['scope'])),
    map((hasPermission) => {
      if (hasPermission) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
  );
};
