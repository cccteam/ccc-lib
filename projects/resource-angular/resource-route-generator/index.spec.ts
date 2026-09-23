import { Route } from '@angular/router';
import { AuthorizationGuard } from '@cccteam/resource-angular/auth-authorization-guard';
import { resourcePageRoute } from '@cccteam/resource-angular/resource-nav';
import {
  FieldMeta,
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

const field = (fieldName: string, extra: Partial<FieldMeta> = {}): FieldMeta =>
  ({ fieldName, displayType: 'string', required: false, isIndex: false, ...extra }) as FieldMeta;
/** A resource keyed by `id`, as the generated metadata says it. */
const keyed = (route: string, extra: Partial<ResourceMeta> = {}): ResourceMeta =>
  ({ route, fields: [field('id', { primaryKey: { ordinalPosition: 0 } })], ...extra }) as ResourceMeta;

describe('resourceRoutes', () => {
  const clients = 'Clients' as Resource;
  const meta = (): ResourceMeta => keyed('clients');
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
      [boards]: keyed('sectors/{sectorID}/crew-boards', { rowsOf: crew }),
      [crew]: keyed('sectors/{sectorID}/crew'),
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

  // A listed resource with no key field is served whole and has no row: no row route
  // under either form of the page route, and no page registered as where a row opens.
  describe('over a key-less resource', () => {
    const orders = 'StandingOrders' as Resource;
    const ordersMeta = (): ResourceMeta =>
      ({ route: 'standing-orders', readDisabled: true, fields: [field('section'), field('directive')] }) as ResourceMeta;
    const ordersConfig = (routeData?: RootRouteData) =>
      rootConfig({
        ...(routeData ? { routeData } : {}),
        nav: { navItem: { label: 'Standing Orders' } },
        parentConfig: listViewConfig({ primaryResource: orders, listColumns: [], elements: [] }),
      });

    const cases: { name: string; routeData?: RootRouteData; wantPath: string }[] = [
      { name: 'under the meta route', routeData: undefined, wantPath: 'standing-orders' },
      { name: 'under a configured route', routeData: { route: 'hq/standing-orders' }, wantPath: 'hq/standing-orders' },
    ];

    for (const tt of cases) {
      describe(tt.name, () => {
        const route = resourceRoutes(ordersConfig(tt.routeData), ordersMeta);

        it('guards the list route on List', () => {
          expect(route.path).toBe(tt.wantPath);
          expect(route.canActivate).toContain(AuthorizationGuard);
          expect(scopeOf(route)).toEqual({ resource: orders, permission: ListPermission });
          expect(route.children?.map((child) => child.path)).toEqual(['']);
        });

        it('has no row route', () => {
          expect(rowRoute(route)).toBeUndefined();
        });

        it('registers no page as where a row opens', () => {
          expect(resourcePageRoute(orders)).toBeUndefined();
        });
      });
    }
  });
});
