import { ApplicationRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiDescriptor, ClientBase, createClient, Domain, FieldMeta, PermissionDigest, Resource, ResourceMeta, TransportRequest, TransportResponse } from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { FieldName, listViewConfig, ListViewConfigOptions, RESOURCE_DOMAIN, RESOURCE_META, rootConfig } from '@cccteam/resource-angular/types';

import { CompoundResourceComponent } from '../compound-resource/compound-resource.component';
import { ResourceListComponent } from './resource-list.component';

// The list page over a key-less resource: the whole list as one page, every row identified
// by its position, and a config asking for a page size, a row expansion, or a row route
// the page cannot honor refused when the page is built, naming the resource. A keyed
// resource's page is untouched by the same checks.

const field = (fieldName: string, extra: Partial<FieldMeta> = {}): FieldMeta =>
  ({ fieldName, displayType: 'string', required: false, isIndex: false, ...extra }) as FieldMeta;

const orders = 'StandingOrders' as Resource;
const ships = 'Ships' as Resource;
const calls = 'DistressCalls' as Resource;

/** The base64 of 32 zero bytes: a SHA-256 digest. */
const digest32 = btoa(String.fromCharCode(...new Array<number>(32).fill(0)));

const metas: Record<string, ResourceMeta> = {
  [orders]: {
    route: 'standing-orders',
    readDisabled: true,
    createDisabled: true,
    updateDisabled: true,
    deleteDisabled: true,
    fields: [field('section', { filterable: 'always' }), field('directive')],
  } as ResourceMeta,
  [ships]: {
    route: 'ships',
    fields: [
      field('id', { primaryKey: { ordinalPosition: 0 } }),
      field('name'),
      field('cargoBays', { displayType: 'number[]' }),
      field('digest', { displayType: 'bytes' }),
      field('lastRefitAt', { displayType: 'date' }),
    ],
  } as ResourceMeta,
  [calls]: {
    route: 'distress-calls',
    fields: [field('id', { primaryKey: { ordinalPosition: 0 } }), field('summary'), field('transcript', { writeOnly: true })],
  } as ResourceMeta,
};

/** The generated descriptor as the console's would read: the key-less list over an empty key tuple, the ships keyed. */
const descriptor: ApiDescriptor = {
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  resources: {
    [orders]: { resource: orders, property: 'standingOrders', route: 'standing-orders', scope: 'global', consolidated: false, keys: [], operations: ['list'], page: { default: 50 } },
    [ships]: { resource: ships, property: 'ships', route: 'ships', scope: 'global', consolidated: false, keys: ['id'], operations: ['list', 'read'], page: { default: 25, max: 200 } },
    [calls]: { resource: calls, property: 'distressCalls', route: 'distress-calls', scope: 'global', consolidated: false, keys: ['id'], operations: ['list', 'read'], page: { default: 10, max: 100 } },
  },
  methods: {},
};

describe('ResourceListComponent', () => {
  let fixture: ComponentFixture<ResourceListComponent>;
  let transport: ScriptedTransport;

  const create = async (options: Omit<ListViewConfigOptions, 'elements'>, rows: Record<string, unknown>[] = []): Promise<void> => {
    const config = listViewConfig({ elements: [], ...options });
    transport = scriptedTransport({ status: 200, body: rows, headers: { 'total-count': String(rows.length) } });
    await TestBed.configureTestingModule({
      imports: [ResourceListComponent],
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
        { provide: RESOURCE_META, useValue: (resource: Resource): ResourceMeta => metas[resource] },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { config: rootConfig({ parentConfig: config }) }, params: {}, queryParams: {} } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ResourceListComponent);
    fixture.componentRef.setInput('compoundResourceComponent', CompoundResourceComponent);
    fixture.componentRef.setInput('resourceConfig', config);
  };

  const columns = [{ id: 'section' as FieldName }, { id: 'directive' as FieldName }];

  describe('refuses a config asking a key-less resource for what its page cannot have', () => {
    const cases: { name: string; options: Omit<ListViewConfigOptions, 'elements'>; want: RegExp }[] = [
      {
        name: 'a page size: the list is served whole',
        options: { primaryResource: orders, listColumns: columns, pageSize: 10 },
        want: /^StandingOrders: pageSize 10 is set, .* served whole, no page size$/,
      },
      {
        name: 'a row expansion: no key to open a row by',
        options: { primaryResource: orders, listColumns: columns, enableRowExpansion: true },
        want: /^StandingOrders: enableRowExpansion is set, .* no key to open a row by$/,
      },
      {
        name: 'a row route naming a field with no target, as on any resource',
        options: { primaryResource: orders, listColumns: columns, rowRoute: 'section' as FieldName },
        want: /^StandingOrders: rowRoute names section, which names no resource in the metadata/,
      },
    ];

    for (const tt of cases) {
      it(tt.name, async () => {
        await create(tt.options);
        expect(() => fixture.detectChanges()).toThrow(tt.want);
      });
    }
  });

  describe('over a key-less resource with a config it can honor', () => {
    beforeEach(async () => {
      await create({ primaryResource: orders, listColumns: columns, enableVirtualScroll: true });
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('identifies rows by position and opens nothing', () => {
      const component = fixture.componentInstance;
      expect(component.keyless()).toBe(true);
      expect(component.rowKey()).toBeUndefined();
      expect(component.expansionKey()).toBeUndefined();
      expect(component.rowTarget()).toBeUndefined();
      expect(component.canView()).toBe(false);
      expect(component.deletesFromList()).toBe(false);
      expect(component.columns().map((col) => col.id)).toEqual(['section', 'directive']);
    });

    it('asks for the whole list once, with no limit and no cursor', () => {
      expect(transport.requests.map((request) => `${request.method} ${request.url}`)).toEqual([
        'GET /api/standing-orders?columns=section%2Cdirective&count=true',
      ]);
    });
  });

  /** Waits for the store's page request, a plain promise the application's stability does not track, to land. */
  const settle = async (): Promise<void> => {
    await TestBed.inject(ApplicationRef).whenStable();
    for (let i = 0; i < 50 && fixture.componentInstance.store.pageStatus() !== 'resolved'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
  };

  describe('writes each cell by its field\'s display type', () => {
    it('a number array as its elements, a bytes value as its size, a date as a calendar date, and nothing configured otherwise', async () => {
      const kestrel = { id: 's-1', name: 'Kestrel', cargoBays: [60, 60, 30], digest: digest32, lastRefitAt: '2026-09-21T12:00:00Z' };
      await create(
        {
          primaryResource: ships,
          listColumns: [
            { id: 'name' as FieldName },
            { id: 'cargoBays' as FieldName },
            { id: 'digest' as FieldName },
            { id: 'lastRefitAt' as FieldName },
          ],
        },
        [kestrel],
      );
      fixture.detectChanges();
      await settle();
      const row = fixture.componentInstance.processedRowData()[0];
      expect(row['name']).toBe('Kestrel');
      expect(row['cargoBays']).toBe('60, 60, 30');
      expect(row['digest']).toBe('32 B');
      expect(row['lastRefitAt']).toBe('9/21/2026');
      const cells = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tr.ccc-row td.data-col')).map((td) =>
        td.textContent?.trim(),
      );
      expect(cells).toEqual(['Kestrel', '60, 60, 30', '32 B', '9/21/2026']);
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(digest32);
    });
  });

  describe('refuses a column over a write-only field', () => {
    it('naming the resource and the field, before anything is requested', async () => {
      await create({ primaryResource: calls, listColumns: [{ id: 'summary' as FieldName }, { id: 'transcript' as FieldName }] });
      expect(() => fixture.detectChanges()).toThrow(/^DistressCalls: listColumns names transcript, which is write-only: a list never returns it$/);
      expect(transport.requests).toEqual([]);
    });
  });

  describe('over a keyed resource', () => {
    it('lets a page size and a row expansion through, and identifies rows by their key', async () => {
      await create({ primaryResource: ships, listColumns: [{ id: 'name' as FieldName }], pageSize: 10, enableRowExpansion: true });
      expect(() => fixture.detectChanges()).not.toThrow();
      const component = fixture.componentInstance;
      expect(component.keyless()).toBe(false);
      expect(component.expansionKey()).toBe('id');
      const key = component.rowKey();
      expect(key).toBeDefined();
      expect(key?.({ id: 's-1', name: 'Kestrel' }, 0)).toBe(JSON.stringify(['s-1']));
      expect(key?.({ id: 's-2', name: 'Kestrel' }, 1)).not.toBe(key?.({ id: 's-1', name: 'Kestrel' }, 0));
    });
  });

  describe('asks for its first page once per request', () => {
    // The page's request is its route, filter, columns, sorts, page size, and, for a
    // domain-scoped resource alone, the tenant. Signals that re-evaluate to the same
    // request (a digest landing that grants the same fields, the tenant changing under a
    // global resource) ask for nothing again; one that changes the columns asks again.
    const shipsUrl = '/api/ships?columns=name%2CcargoBays%2Cid&count=true';
    const narrowedUrl = '/api/ships?columns=name%2Cid&count=true';
    let digest: PermissionDigest;
    let domain: ReturnType<typeof signal<Domain | undefined>>;

    /** The digest granting List on the ships and the named fields, the id a key. */
    const granting = (...fields: string[]): PermissionDigest => ({
      [ships]: { List: 'granted' },
      ...Object.fromEntries(fields.map((f) => [`${ships}.${f}`, { List: 'granted' }])),
    });

    const server = (request: TransportRequest): TransportResponse => {
      const url = new URL(request.url, 'http://ships.test');
      if (url.pathname === '/api/permission-digest') {
        return { status: 200, body: digest };
      }
      if (url.pathname === '/api/ships') {
        return { status: 200, body: [{ id: 's-1', name: 'Kestrel', cargoBays: [60] }], headers: { 'total-count': '1' } };
      }
      return { status: 404, body: { message: `unscripted ${request.url}` } };
    };

    const shipsRequests = (): string[] => transport.requests.map((r) => r.url).filter((url) => url.startsWith('/api/ships'));

    /** A few rounds of change detection and settled promises, so a request nothing should cause has every chance to show. */
    const rounds = async (n = 5): Promise<void> => {
      for (let i = 0; i < n; i++) {
        TestBed.tick();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    };

    beforeEach(async () => {
      digest = granting('name', 'cargoBays');
      domain = signal<Domain | undefined>('anvil' as Domain);
      const config = listViewConfig({ elements: [], primaryResource: ships, listColumns: [{ id: 'name' as FieldName }, { id: 'cargoBays' as FieldName }] });
      transport = scriptedTransport(server);
      await TestBed.configureTestingModule({
        imports: [ResourceListComponent],
        providers: [
          provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
          { provide: RESOURCE_META, useValue: (resource: Resource): ResourceMeta => metas[resource] },
          { provide: RESOURCE_DOMAIN, useValue: domain },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { config: rootConfig({ parentConfig: config }) }, params: {}, queryParams: {} } },
          },
        ],
      }).compileComponents();
      // The global digest is on hand before the page renders, as after sign-in.
      await TestBed.inject<ClientBase>(RESOURCE_CLIENT).permissions.loadDigest();
      fixture = TestBed.createComponent(ResourceListComponent);
      fixture.componentRef.setInput('compoundResourceComponent', CompoundResourceComponent);
      fixture.componentRef.setInput('resourceConfig', config);
      fixture.detectChanges();
      await settle();
    });

    it('once across a digest granting the same fields again and a change of the tenant', async () => {
      expect(shipsRequests()).toEqual([shipsUrl]);

      await TestBed.inject<ClientBase>(RESOURCE_CLIENT).permissions.loadDigest();
      await rounds();
      expect(shipsRequests()).toEqual([shipsUrl]);

      domain.set('bastion' as Domain);
      await rounds();
      expect(shipsRequests()).toEqual([shipsUrl]);
      expect(fixture.componentInstance.columns().map((col) => col.id)).toEqual(['name', 'cargoBays']);
    });

    it('again, with the narrowed columns, when a digest grants fewer', async () => {
      digest = granting('name');
      await TestBed.inject<ClientBase>(RESOURCE_CLIENT).permissions.loadDigest();
      await rounds();
      expect(shipsRequests()).toEqual([shipsUrl, narrowedUrl]);
      expect(fixture.componentInstance.columns().map((col) => col.id)).toEqual(['name']);
    });
  });
});
