import { Route } from '@angular/router';
import { AuthorizationGuard } from '@cccteam/ccc-lib/auth-authorization-guard';
import { canDeactivateGuard } from '@cccteam/ccc-lib/guards';
import { addNavItem } from '@cccteam/ccc-lib/resource-nav';
import {
  ListPermission,
  PermissionScope,
  Resource,
  ResourceMeta,
  RootConfig,
  RouteResourceData,
} from '@cccteam/ccc-lib/types';

/**
 * Builds the routes for a config-driven resource and registers its navigation item.
 *
 * The routes are guarded by the resource's List permission (global scope — config-driven
 * resources are global), answered from the permission digest by the AuthorizationGuard,
 * and the navigation item carries the same scope so a `cccHasPermission`-gated menu hides
 * what the user cannot open. A config may set `nav.navItem.permission` to gate on
 * something else.
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

  if (config.routeData.route) {
    const baseRoute: Route = {
      path: config.routeData.route,
      data,
      canActivate: [AuthorizationGuard],
      children: [
        {
          path: '',
          loadComponent: () => import('@cccteam/ccc-lib/ccc-resource').then((mod) => mod.ResourceListCreateComponent),
          canDeactivate: [canDeactivateGuard],
        },
      ],
    };
    if (config.routeData.hasViewRoute !== false) {
      baseRoute.children?.push({
        path: ':uuid',
        loadComponent: () => import('@cccteam/ccc-lib/ccc-resource').then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [canDeactivateGuard],
      });
      return baseRoute;
    }
  }

  return {
    path: meta.route,
    data,
    canActivate: [AuthorizationGuard],
    children: [
      {
        path: ':uuid',
        loadComponent: () => import('@cccteam/ccc-lib/ccc-resource').then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: '',
        loadComponent: () => import('@cccteam/ccc-lib/ccc-resource').then((mod) => mod.ResourceListCreateComponent),
        canDeactivate: [canDeactivateGuard],
      },
    ],
  } satisfies Route;
};
