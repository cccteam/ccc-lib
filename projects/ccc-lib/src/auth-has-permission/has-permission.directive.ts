import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthState } from '@cccteam/ccc-lib/src/auth-state';
import { PermissionScope } from '@cccteam/ccc-lib/src/types';
import { Store } from '@ngxs/store';
import { Subject, catchError, combineLatest, map, of } from 'rxjs';

@Directive({
  selector: '[cccHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private store = inject(Store);

  private scope = new Subject<PermissionScope>();

  @Input()
  set cccHasPermission(scope: PermissionScope) {
    this.scope.next(scope);
  }

  constructor() {
    combineLatest({
      permissionFn: this.store.select(AuthState.hasPermission),
      scope: this.scope.asObservable(),
    })
      .pipe(
        takeUntilDestroyed(),
        map(({ permissionFn, scope }) => (scope !== undefined ? permissionFn(scope) : true)),
        catchError(() => of(false)),
      )
      .subscribe((result) => {
        if (result) {
          if (!this.viewContainer.get(0)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
          }
        } else {
          this.viewContainer.clear();
        }
      });
  }
}
