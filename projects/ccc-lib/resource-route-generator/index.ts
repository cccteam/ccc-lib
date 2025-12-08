import { Route } from '@angular/router';
import { canDeactivateGuard } from '@cccteam/ccc-lib/guards';
import { addNavItem } from '@cccteam/ccc-lib/resource-nav';
import { Resource, ResourceMeta, RootConfig, RouteResourceData } from '@cccteam/ccc-lib/types';

export const resourceRoutes = (config: RootConfig, resourceMeta: (resource: Resource) => ResourceMeta): Route => {
  const meta = resourceMeta(config.parentConfig.primaryResource as Resource);
  if (!meta) {
    return {} as Route;
  }

  if (config.nav.group) {
    if (config.routeData.route) {
      addNavItem(config.nav, config.routeData.route);
    } else {
      addNavItem(config.nav, meta.route);
    }
  }

  if (config.routeData.route) {
    const baseRoute: Route = {
      path: config.routeData.route,
      data: { config: config } satisfies RouteResourceData,
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
    data: { config: config } as RouteResourceData,
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
