import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';

export const AuthorizationGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const hasPermission = auth.hasPermission(route.data['scope']);
  if (hasPermission) {
    return true;
  }

  return router.createUrlTree(['/']);
};
