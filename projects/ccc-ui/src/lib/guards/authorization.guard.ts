import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { map, Observable } from 'rxjs';
import { CoreState } from '../state/core.state';

export const AuthorizationGuard = (route: ActivatedRouteSnapshot): Observable<boolean> => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(CoreState.hasPermission).pipe(
    map((permissionFn) => permissionFn(route.data['permissions'])),
    map((hasPermission) => {
      if (hasPermission) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
  );
};
