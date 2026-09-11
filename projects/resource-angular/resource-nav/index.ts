import { MenuItem, Resource } from '@cccteam/resource-angular/types';

/**
 * Where each resource's config-driven page lives, registered by resourceRoutes: a
 * list's row route opens its target on that page. The first registration for a
 * resource stands, and a resource with no page opens on its metadata route.
 */
const resourcePages = new Map<Resource, string>();

/** Records the page a resource's rows open on. */
export function registerResourcePage(resource: Resource, route: string): void {
  if (!resourcePages.has(resource)) {
    resourcePages.set(resource, route);
  }
}

/** The page a resource's rows open on, undefined when none is registered. */
export function resourcePageRoute(resource: Resource): string | undefined {
  return resourcePages.get(resource);
}

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
