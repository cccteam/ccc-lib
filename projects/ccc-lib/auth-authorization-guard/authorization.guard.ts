import { computed, inject, Signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';

export const AuthorizationGuard = (route: ActivatedRouteSnapshot): Signal<boolean> => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return computed(() => {
    const hasPermission = auth.hasPermission(route.data['scope']);
    if (hasPermission) {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  });
};
