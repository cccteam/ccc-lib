import { Component, computed, inject, input, OnInit, signal, Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthState } from '@cccteam/ccc-lib/src/auth-state';
import { Domain, ReadPermission, Resource, UpdatePermission } from '@cccteam/ccc-lib/src/types';
import { Store } from '@ngxs/store';

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
      <input matInput [disabled]="mode() === inputMode.Edit && canEdit()" [value]="value()" />
    </mat-form-field>
  `,
  styleUrl: './ccc-field.component.scss',
})
export class CccInputFieldComponent implements OnInit {
  store = inject(Store);
  className = input();
  mode = input.required<InputMode>();
  resource = input.required<Resource>();
  domain = input.required<Domain>();
  value = input.required();
  name = input.required<string>();

  inputMode = InputMode;

  canEdit: Signal<boolean> = signal(false);
  canEditSelector = false;

  canRead: Signal<boolean> = signal(false);
  canReadSelector = false;

  ngOnInit(): void {
    this.canEditSelector = this.store.selectSnapshot(AuthState.hasPermission)({
      resource: this.resource(),
      permission: ReadPermission,
      domain: this.domain(),
    });
    this.canReadSelector = this.store.selectSnapshot(AuthState.hasPermission)({
      resource: this.resource(),
      permission: UpdatePermission,
      domain: this.domain(),
    });

    this.canRead = computed(() => {
      const res = this.resource();
      if (!res) {
        return false;
      }
      if (AuthState.requiresPermission(this.resource(), ReadPermission)) {
        return this.canReadSelector;
      }
      return false;
    });

    this.canEdit = computed(() => {
      const res = this.resource();
      if (!res) {
        return false;
      }
      if (AuthState.requiresPermission(this.resource(), UpdatePermission)) {
        return this.canEditSelector;
      }
      return false;
    });
  }
}
