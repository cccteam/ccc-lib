import { Route } from '@angular/router';
import { AuthorizationGuard } from '@cccteam/resource-angular/auth-authorization-guard';
import { canDeactivateGuard } from '@cccteam/resource-angular/guards';
import { addNavItem } from '@cccteam/resource-angular/resource-nav';
import {
  ListPermission,
  PermissionScope,
  ReadPermission,
  Resource,
  ResourceMeta,
  RootConfig,
  RouteResourceData,
} from '@cccteam/resource-angular/types';

/**
 * Builds the routes for a config-driven resource and registers its navigation item.
 *
 * The routes are guarded by the resource's List permission (global scope — config-driven
 * resources are global), answered from the permission digest by the AuthorizationGuard,
 * and the navigation item carries the same scope so a `cccHasPermission`-gated menu hides
 * what the user cannot open. The row route (`:uuid`) is guarded on Read as well, since a
 * role may list a resource without reading its rows. A config may set
 * `nav.navItem.permission` to gate on something else.
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

  const data = { config, scope } satisfies RouteResourceData;
  const viewData = { config, scope: { resource, permission: ReadPermission } } satisfies RouteResourceData;

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
