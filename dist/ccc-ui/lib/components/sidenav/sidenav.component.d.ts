import { OnInit } from "@angular/core";
import { Observable } from "rxjs";
import * as i0 from "@angular/core";
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
export declare class SidenavComponent implements OnInit {
    private store;
    private destroyRef;
    navGroups?: NavGroups;
    currentNav: NavItem[];
    hasPermissionFn: Observable<(permissions: string[]) => boolean>;
    ngOnInit(): void;
    /**
     * Updates the currentNav based on the identifier
     * @param identifier
     * @returns NavItem[]
     * @memberof SidenavComponent
     */
    updateNavItems(identifier: string): NavItem[];
    static ɵfac: i0.ɵɵFactoryDeclaration<SidenavComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<SidenavComponent, "app-sidenav", never, { "navGroups": { "alias": "navGroups"; "required": false; }; }, {}, never, never, true, never>;
}
