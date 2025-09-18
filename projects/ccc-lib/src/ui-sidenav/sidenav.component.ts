import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';

import { HasPermissionDirective } from '../auth-has-permission';
import { PermissionScope } from '../types';
import { UiCoreService } from '../ui-core-service';

export interface NavItem {
  type: 'link' | 'header' | 'expandable';
  routerLink?: string[];
  label: string;
  icon?: string;
  permission?: PermissionScope;
  children?: NavItem[];
  isExpanded?: boolean;
  attentionCount?: Signal<number>;
}

export type NavGroups = Record<string, NavItem[]>;

@Component({
  selector: 'ccc-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [
    MatIconModule,
    RouterModule,
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatSidenavModule,
    HasPermissionDirective,
  ],
})
export class SidenavComponent {
  ui = inject(UiCoreService);

  @Input() navGroups?: NavGroups;
  currentNav = computed(() => {
    return this.updateNavItems(this.ui.currentSidenavIdentifier());
  });

  /**
   * Updates the currentNav based on the identifier
   * @param identifier
   * @returns NavItem[]
   * @memberof SidenavComponent
   */
  updateNavItems(identifier: string): NavItem[] {
    if (!this.navGroups) {
      return [];
    }
    if (!this.navGroups[identifier]) {
      // pick the first one if the identifier is not found so we don't break the UI
      identifier = Object.keys(this.navGroups)[0];
    }
    return this.navGroups[identifier];
  }
}
