import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivateFn, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { FormStateService } from './form-state.service';
import { LeavePageConfirmationModalComponent } from './leave-page-confirmation-modal/leave-page-confirmation-modal.component';

export type CanDeactivateType = Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;

export interface CanComponentDeactivate {
  canDeactivate: () => CanDeactivateType;
}

export const dirtyFormDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = async (_, __, ___, nextState) => {
  const dialog = inject(MatDialog);
  const formStateService = inject(FormStateService);

  if (nextState?.url === '/login') {
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
