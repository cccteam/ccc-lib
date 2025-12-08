import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivateFn, UrlTree } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';
import { LeavePageConfirmationModalComponent } from '@cccteam/ccc-lib/ccc-resource-modals';
import { FormStateService } from '@cccteam/ccc-lib/ccc-resource-services';
import { firstValueFrom, Observable, tap } from 'rxjs';

export type CanDeactivateType = Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;

export interface CanComponentDeactivate {
  canDeactivate: () => CanDeactivateType;
}

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = async (_, __, ___, nextState) => {
  const auth = inject(AuthService);
  const dialog = inject(MatDialog);
  const formStateService = inject(FormStateService);

  if (nextState?.url.includes(auth.loginRoute())) {
    return true;
  }

  if (!formStateService.isDirty()) {
    return true;
  }

  const existingDialog = dialog.openDialogs.find(
    (d) => d.componentInstance instanceof LeavePageConfirmationModalComponent,
  );

  const dialogRef = existingDialog ?? dialog.open(LeavePageConfirmationModalComponent, { delayFocusTrap: false });

  const result = dialogRef.afterClosed().pipe(
    tap((value) => {
      if (value === true) {
        formStateService.resetDirtyForms();
      }
    }),
  );

  return firstValueFrom(result);
};
