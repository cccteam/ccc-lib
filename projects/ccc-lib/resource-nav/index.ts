import { MenuItem } from '@cccteam/ccc-lib/types';

export const generatedNavItems: MenuItem[] = [];
export const generatedNavGroups: string[] = [];

/**
 * Adds a navigation item to the generated nav items array.
 */
export function addNavItem(
  nav: {
    navItem: MenuItem;
    group?: string;
  },
  route: string,
): void {
  nav.navItem.route = [route];

  if (!nav.group) {
    generatedNavItems.push(nav.navItem);
    return;
  }

  if (!generatedNavGroups.includes(nav.group)) {
    generatedNavGroups.push(nav.group);
  }

  let groupItem = generatedNavItems.find((item) => item.label === nav.group);

  if (!groupItem) {
    groupItem = { label: nav.group, children: [] };
    generatedNavItems.push(groupItem);
  }

  groupItem.children = groupItem.children || [];
  groupItem.children.push(nav.navItem);

  generatedNavItems.sort((a, b) => (a.label > b.label ? -1 : 1));
}
