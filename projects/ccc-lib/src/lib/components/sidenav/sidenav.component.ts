import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { RouterModule } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, tap } from "rxjs";
import { HasPermissionDirective } from "../../directives/has-permission.directive";
import { CoreState } from "../../state/core.state";

export interface NavItem {
  type: "link" | "header" | "expandable";
  routerLink?: string[];
  label: string;
  icon?: string;
  permissions: Permissions[];
  children?: NavItem[];
  isExpanded?: boolean;
  attentionCount?: Observable<number>;
}

export type NavGroups = Record<string, NavItem[]>;

@Component({
  selector: "app-sidenav",
  templateUrl: "./sidenav.component.html",
  styleUrls: ["./sidenav.component.scss"],
  standalone: true,
  imports: [
    MatIconModule,
    RouterModule,
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    HasPermissionDirective,
    MatSidenavModule,
  ],
})
export class SidenavComponent implements OnInit {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  @Input() navGroups?: NavGroups;
  currentNav: NavItem[] = [];

  hasPermissionFn = this.store.select(CoreState.hasPermission);

  ngOnInit(): void {
    this.store
      .select(CoreState.currentSidenavIdentifier)
      .pipe(
        tap((identifier) => {
          this.currentNav = this.updateNavItems(identifier);
        }),
        takeUntilDestroyed(this.destroyRef)
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
