import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { Subject, catchError, combineLatest, map, of } from 'rxjs';
import { CoreState } from '../state/core.state';

@Directive({
  selector: '[libHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private store = inject(Store);

  private permissions = new Subject<string[]>();

  @Input()
  set appHasPermission(val: string[]) {
    this.permissions.next(val);
  }

  constructor() {
    combineLatest({
      permissionFn: this.store.select(CoreState.hasPermission),
      permissions: this.permissions.asObservable(),
    })
      .pipe(
        takeUntilDestroyed(),
        map(({ permissionFn, permissions }) => permissionFn(permissions)),
        catchError(() => {
          return of(false);
        }),
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
