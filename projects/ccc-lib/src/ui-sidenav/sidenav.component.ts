import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';

import { HasPermissionDirective } from '@cccteam/ccc-lib/src/auth-has-permission';
import { PermissionScope } from '@cccteam/ccc-lib/src/types';
import { CoreState } from '@cccteam/ccc-lib/src/ui-core-state';
import { Observable, tap } from 'rxjs';

export interface NavItem {
  type: 'link' | 'header' | 'expandable';
  routerLink?: string[];
  label: string;
  icon?: string;
  permission?: PermissionScope;
  children?: NavItem[];
  isExpanded?: boolean;
  attentionCount?: Observable<number>;
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
export class SidenavComponent implements OnInit {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  @Input() navGroups?: NavGroups;
  currentNav: NavItem[] = [];

  ngOnInit(): void {
    this.store
      .select(CoreState.currentSidenavIdentifier)
      .pipe(
        tap((identifier) => {
          this.currentNav = this.updateNavItems(identifier);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

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
