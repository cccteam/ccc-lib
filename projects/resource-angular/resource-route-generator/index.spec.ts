import { Route } from '@angular/router';
import { AuthorizationGuard } from '@cccteam/resource-angular/auth-authorization-guard';
import { resourcePageRoute } from '@cccteam/resource-angular/resource-nav';
import {
  ListPermission,
  listViewConfig,
  ReadPermission,
  Resource,
  ResourceMeta,
  rootConfig,
  RootRouteData,
  RouteResourceData,
} from '@cccteam/resource-angular/types';

import { resourceRoutes } from './index';

describe('resourceRoutes', () => {
  const clients = 'Clients' as Resource;
  const meta = (): ResourceMeta => ({ route: 'clients' }) as ResourceMeta;
  // routeData is spread over the helper's defaults, so an absent key (not an undefined
  // value) is what leaves the default in place.
  const config = (routeData?: RootRouteData) =>
    rootConfig({
      ...(routeData ? { routeData } : {}),
      nav: { navItem: { label: 'Clients' } },
      parentConfig: listViewConfig({ primaryResource: clients, listColumns: [], elements: [] }),
    });
  const scopeOf = (route: Route | undefined) => (route?.data as RouteResourceData | undefined)?.scope;
  const rowRoute = (route: Route) => route.children?.find((child) => child.path === ':uuid');

  const cases: { name: string; routeData?: RootRouteData; wantPath: string; wantRowRoute: boolean }[] = [
    { name: 'under the meta route', routeData: undefined, wantPath: 'clients', wantRowRoute: true },
    {
      name: 'under a configured route',
      routeData: { route: 'crew/clients' },
      wantPath: 'crew/clients',
      wantRowRoute: true,
    },
    {
      name: 'with the row route switched off',
      routeData: { route: 'crew/clients', hasViewRoute: false },
      wantPath: 'crew/clients',
      wantRowRoute: false,
    },
  ];

  for (const tt of cases) {
    describe(tt.name, () => {
      const route = resourceRoutes(config(tt.routeData), meta);

      it('guards the list route on List', () => {
        expect(route.path).toBe(tt.wantPath);
        expect(route.canActivate).toContain(AuthorizationGuard);
        expect(scopeOf(route)).toEqual({ resource: clients, permission: ListPermission });
      });

      if (tt.wantRowRoute) {
        it('guards the row route on Read', () => {
          const row = rowRoute(route);
          expect(row).toBeDefined();
          expect(row?.canActivate).toContain(AuthorizationGuard);
          expect(scopeOf(row)).toEqual({ resource: clients, permission: ReadPermission });
        });
      } else {
        it('has no row route', () => {
          expect(rowRoute(route)).toBeUndefined();
        });
      }
    });
  }

  describe('over a view declaring its table', () => {
    const boards = 'CrewBoards' as Resource;
    const crew = 'Crew' as Resource;
    const metas: Record<string, ResourceMeta> = {
      [boards]: { route: 'sectors/{sectorID}/crew-boards', rowsOf: crew } as ResourceMeta,
      [crew]: { route: 'sectors/{sectorID}/crew' } as ResourceMeta,
    };
    const route = resourceRoutes(
      rootConfig({
        routeData: { route: 'sector/crew' },
        nav: { navItem: { label: 'Crew' } },
        parentConfig: listViewConfig({ primaryResource: boards, listColumns: [], elements: [] }),
      }),
      (resource) => metas[resource],
    );

    it('guards the list route on List of the view', () => {
      expect(scopeOf(route)).toEqual({ resource: boards, permission: ListPermission });
    });

    it('guards the row route on Read of the table, which the row page opens', () => {
      expect(scopeOf(rowRoute(route))).toEqual({ resource: crew, permission: ReadPermission });
    });

    it('registers the page as where both the view and the table open', () => {
      expect(resourcePageRoute(boards)).toBe('sector/crew');
      expect(resourcePageRoute(crew)).toBe('sector/crew');
    });
  });
});
