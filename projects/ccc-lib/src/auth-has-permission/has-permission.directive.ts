import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { AuthService } from '@cccteam/ccc-lib/src/auth-service';
import { PermissionScope } from '@cccteam/ccc-lib/src/types';

@Directive({
  selector: '[cccHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private auth = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private scope = signal<PermissionScope | undefined>(undefined);

  @Input()
  set cccHasPermission(scope: PermissionScope) {
    this.scope.set(scope);
  }

  constructor() {
    effect(() => {
      const scope = this.scope();

      if (this.auth.hasPermission(scope) && this.auth.authenticated()) {
        if (!this.viewContainer.get(0)) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
