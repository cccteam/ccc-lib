import { Component, computed, inject, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@cccteam/ccc-lib/auth-service';
import { Domain, ReadPermission, Resource, UpdatePermission } from '@cccteam/ccc-lib/types';

export enum InputMode {
  Read = 'read',
  Edit = 'edit',
}

@Component({
  selector: 'ccc-input-field',
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field [class]="className()">
      <mat-label>{{ name() }}</mat-label>
      <input matInput [disabled]="mode() === inputMode.Edit && !canEdit()" [value]="value()" />
    </mat-form-field>
  `,
  styleUrl: './ccc-field.component.scss',
})
export class CccInputFieldComponent {
  auth = inject(AuthService);
  className = input();
  mode = input.required<InputMode>();
  resource = input.required<Resource>();
  domain = input<Domain>();
  value = input.required();
  name = input.required<string>();

  inputMode = InputMode;

  // canRead and canEdit answer from the permission digest and re-evaluate when it
  // loads; a resource that requires no permission for the action is always allowed.
  canRead = computed(() => this.allowed(ReadPermission));
  canEdit = computed(() => this.allowed(UpdatePermission));

  private allowed(permission: typeof ReadPermission): boolean {
    const resource = this.resource();
    if (!resource) {
      return false;
    }
    if (!AuthService.requiresPermission(resource, permission)) {
      return true;
    }
    return this.auth.hasPermission({ resource, permission, domain: this.domain() });
  }
}
