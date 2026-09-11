import { Route } from '@angular/router';
import { AuthorizationGuard } from '@cccteam/resource-angular/auth-authorization-guard';
import { canDeactivateGuard } from '@cccteam/resource-angular/guards';
import { addNavItem, registerResourcePage } from '@cccteam/resource-angular/resource-nav';
import {
  ListPermission,
  PermissionScope,
  ReadPermission,
  Resource,
  ResourceMeta,
  RootConfig,
  RouteResourceData,
  writeResource,
} from '@cccteam/resource-angular/types';

/**
 * Builds the routes for a config-driven resource and registers its navigation item.
 *
 * The routes are guarded by the resource's List permission, answered from the permission
 * digest by the AuthorizationGuard, and the navigation item carries the same scope so a
 * `cccHasPermission`-gated menu hides what the user cannot open. The scope names no
 * domain: a global resource is asked in the global digest, and a domain-scoped one in
 * the selected tenant's (RESOURCE_DOMAIN), which AuthService settles. The row route
 * (`:uuid`) is guarded on Read as well, since a role may list a resource without reading
 * its rows — Read on the resource whose row the page opens: the listed resource, or its
 * table when the list is a view declaring one (the metadata's `rowsOf`), since a view
 * lists and never reads. A config may set `nav.navItem.permission` to gate on something
 * else. A domain-scoped resource's metadata route carries the tenant parameter in
 * braces, so such a page sets `routeData.route` to the path it should live at. The page
 * is registered as where the resource's rows open (resourcePageRoute), for the listed
 * resource and for its table, so another list's row route lands here.
 */
export const resourceRoutes = (config: RootConfig, resourceMeta: (resource: Resource) => ResourceMeta): Route => {
  const resource = config.parentConfig.primaryResource as Resource;
  const meta = resourceMeta(resource);
  if (!meta) {
    return {} as Route;
  }

  const scope: PermissionScope = { resource, permission: ListPermission };
  config.nav.navItem.permission ??= scope;

  if (config.nav.group) {
    if (config.routeData.route) {
      addNavItem(config.nav, config.routeData.route);
    } else {
      addNavItem(config.nav, meta.route);
    }
  }

  const pageRoute = config.routeData.route || meta.route;
  const rowResource = writeResource(resource, meta);
  registerResourcePage(resource, pageRoute);
  registerResourcePage(rowResource, pageRoute);

  const data = { config, scope } satisfies RouteResourceData;
  const viewData = { config, scope: { resource: rowResource, permission: ReadPermission } } satisfies RouteResourceData;

  if (config.routeData.route) {
    const baseRoute: Route = {
      path: config.routeData.route,
      data,
      canActivate: [AuthorizationGuard],
      children: [
        {
          path: '',
          loadComponent: () => import('@cccteam/resource-angular/ccc-resource').then((mod) => mod.ResourceListCreateComponent),
          canDeactivate: [canDeactivateGuard],
        },
      ],
    };
    if (config.routeData.hasViewRoute !== false) {
      baseRoute.children?.push({
        path: ':uuid',
        data: viewData,
        canActivate: [AuthorizationGuard],
        loadComponent: () => import('@cccteam/resource-angular/ccc-resource').then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [canDeactivateGuard],
      });
    }
    // A configured route stands with or without its row route; falling through would
    // discard it for the meta route and add the row route the config switched off.
    return baseRoute;
  }

  return {
    path: meta.route,
    data,
    canActivate: [AuthorizationGuard],
    children: [
      {
        path: ':uuid',
        data: viewData,
        canActivate: [AuthorizationGuard],
        loadComponent: () => import('@cccteam/resource-angular/ccc-resource').then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: '',
        loadComponent: () => import('@cccteam/resource-angular/ccc-resource').then((mod) => mod.ResourceListCreateComponent),
        canDeactivate: [canDeactivateGuard],
      },
    ],
  } satisfies Route;
};
