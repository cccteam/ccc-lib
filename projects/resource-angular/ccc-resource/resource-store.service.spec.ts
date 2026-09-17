import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { FieldName, RESOURCE_DOMAIN } from '@cccteam/resource-angular/types';
import { ApiDescriptor, ApiError, createClient, Domain, Resource, Transport, TransportRequest } from '@cccteam/resource';
import { ResourceStore } from './resource-store.service';

// The store's whole-set funnel and the paged reader, on the read mode the descriptor's
// maximum page size decides: a source with no maximum is read whole in one limit=all
// request; a source with a maximum is read one server page at a time, looked up by
// key in `in` batches no larger than its maximum, and never read whole. The requests
// are pinned by URL against a scripted client.

const descriptor: ApiDescriptor = {
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  domainRoute: { segment: 'sectors', param: 'sectorID' },
  resources: {
    // No maximum: read whole.
    ShipClasses: {
      resource: 'ShipClasses' as Resource,
      property: 'shipClasses',
      route: 'ship-classes',
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 25 },
    },
    // A maximum and a declared order: paged, the server orders.
    Hangars: {
      resource: 'Hangars' as Resource,
      property: 'hangars',
      route: 'hangars',
      scope: 'domain',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 25, max: 2 },
      order: [{ field: 'name', direction: 'asc' }],
    },
    // A maximum and no order: paged, and a request without a sort is the server's refusal.
    Berths: {
      resource: 'Berths' as Resource,
      property: 'berths',
      route: 'berths',
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 10, max: 50 },
    },
  },
  methods: {},
};

interface Scripted {
  transport: Transport;
  requests: TransportRequest[];
}

/** A transport scripted by URL: each entry answers one request with rows and headers, an unscripted URL is a 404. */
function scripted(pages: Record<string, { status?: number; rows: unknown; headers?: Record<string, string> }>): Scripted {
  const requests: TransportRequest[] = [];
  const transport: Transport = async (request) => {
    requests.push(request);
    const page = pages[request.url];
    if (!page) {
      return { status: 404, body: { message: `unscripted ${request.url}` } };
    }
    return { status: page.status ?? 200, body: page.rows, headers: page.headers ?? {} };
  };
  return { transport, requests };
}

/** Runs change detection and lets pending microtasks land until `done` answers true. */
async function settle(done: () => boolean): Promise<void> {
  for (let i = 0; i < 50 && !done(); i++) {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  TestBed.tick();
}

function storeOver(script: Scripted): ResourceStore {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      ResourceStore,
      { provide: RESOURCE_CLIENT, useValue: createClient(descriptor, { baseUrl: '/api', transport: script.transport }) },
      { provide: RESOURCE_DOMAIN, useValue: signal('anvil' as Domain) },
    ],
  });
  return TestBed.inject(ResourceStore);
}

describe('ResourceStore whole-set funnel', () => {
  const cases: {
    name: string;
    route: string;
    columns: string[];
    sorts: { field: FieldName; direction: 'asc' | 'desc' }[];
    script: Record<string, { status?: number; rows: unknown }>;
    wantUrls: string[];
    wantRows?: unknown[];
    wantRefusal?: string;
  }[] = [
    {
      name: 'a source with no maximum is read whole: one limit=all request',
      route: 'ship-classes',
      columns: ['id', 'designation'],
      sorts: [],
      script: { '/api/ship-classes?columns=id%2Cdesignation&limit=all': { rows: [{ id: 'c1', designation: 'Cutter' }] } },
      wantUrls: ['/api/ship-classes?columns=id%2Cdesignation&limit=all'],
      wantRows: [{ id: 'c1', designation: 'Cutter' }],
    },
    {
      name: 'a source with a maximum is never read whole: one server page at the default size, the declared order applying',
      route: 'sectors/{sectorID}/hangars',
      columns: ['id', 'name'],
      sorts: [],
      script: { '/api/sectors/anvil/hangars?columns=id%2Cname': { rows: [{ id: 'h1', name: 'Anvil Dock One' }, { id: 'h2', name: 'Quarantine Bay' }] } },
      wantUrls: ['/api/sectors/anvil/hangars?columns=id%2Cname'],
      wantRows: [{ id: 'h1', name: 'Anvil Dock One' }, { id: 'h2', name: 'Quarantine Bay' }],
    },
    {
      name: 'a bounded source with no order and no sort is the server\'s refusal, in its words',
      route: 'berths',
      columns: ['id', 'name'],
      sorts: [],
      script: {
        '/api/berths?columns=id%2Cname': { status: 400, rows: { message: 'Berths serves at most 50 rows per page and declares no order; add a sort' } },
      },
      wantUrls: ['/api/berths?columns=id%2Cname'],
      wantRefusal: 'Berths serves at most 50 rows per page and declares no order; add a sort',
    },
    {
      name: 'a configured sort pages a bounded source with no order',
      route: 'berths',
      columns: ['id', 'name'],
      sorts: [{ field: 'name' as FieldName, direction: 'asc' }],
      script: { '/api/berths?sort=name%3Aasc&columns=id%2Cname': { rows: [{ id: 'b1', name: 'Berth 1' }] } },
      wantUrls: ['/api/berths?sort=name%3Aasc&columns=id%2Cname'],
      wantRows: [{ id: 'b1', name: 'Berth 1' }],
    },
  ];

  for (const tt of cases) {
    it(tt.name, async () => {
      const script = scripted(tt.script);
      const store = storeOver(script);
      const ref = store.resourceList(signal(tt.route), signal(''), signal(tt.columns), signal(false), signal(tt.sorts));
      await settle(() => ref.status() === 'resolved' || ref.status() === 'error');
      expect(script.requests.map((r) => r.url)).toEqual(tt.wantUrls);
      if (tt.wantRefusal) {
        expect(ref.status()).toBe('error');
        const error = ref.error();
        expect(error instanceof ApiError && error.message).toBe(tt.wantRefusal);
      } else {
        expect(ref.value()).toEqual(tt.wantRows as never);
      }
    });
  }
});

describe('ResourceStore key lookup', () => {
  it('reads a source with no maximum whole once and ignores the keys', async () => {
    const script = scripted({ '/api/ship-classes?columns=id%2Cdesignation&limit=all': { rows: [{ id: 'c1', designation: 'Cutter' }, { id: 'c2', designation: 'Tug' }] } });
    const store = storeOver(script);
    const keys = signal(['c1']);
    const ref = store.resourceListByKeys(signal('ship-classes'), signal('id'), keys, signal(['id', 'designation']));
    await settle(() => ref.status() === 'resolved');
    expect(ref.value()).toEqual([{ id: 'c1', designation: 'Cutter' }, { id: 'c2', designation: 'Tug' }] as never);

    // Another page's keys ask nothing more: the whole list is already held.
    keys.set(['c2']);
    await settle(() => ref.status() === 'resolved');
    expect(script.requests.map((r) => r.url)).toEqual(['/api/ship-classes?columns=id%2Cdesignation&limit=all']);
  });

  it('asks a source with a maximum for one in page per batch no larger than the maximum, never a whole read', async () => {
    const first = '/api/sectors/anvil/hangars?filter=id%3Ain%3A%28h1%2Ch2%29&columns=id%2Cname&limit=2';
    const second = '/api/sectors/anvil/hangars?filter=id%3Ain%3A%28h3%29&columns=id%2Cname&limit=1';
    const script = scripted({
      [first]: { rows: [{ id: 'h1', name: 'Anvil Dock One' }, { id: 'h2', name: 'Quarantine Bay' }] },
      [second]: { rows: [{ id: 'h3', name: 'Bastion Slip' }] },
    });
    const store = storeOver(script);
    const ref = store.resourceListByKeys(signal('sectors/{sectorID}/hangars'), signal('id'), signal(['h1', 'h2', 'h3']), signal(['id', 'name']), 200);
    await settle(() => ref.status() === 'resolved');
    expect(script.requests.map((r) => r.url).sort()).toEqual([first, second].sort());
    expect((ref.value() as { id: string }[]).map((row) => row.id).sort()).toEqual(['h1', 'h2', 'h3']);
  });

  it('sorts a bounded source with no order by the key field, which its index serves', async () => {
    const url = '/api/berths?filter=id%3Ain%3A%28b1%29&sort=id%3Aasc&columns=id%2Cname&limit=1';
    const script = scripted({ [url]: { rows: [{ id: 'b1', name: 'Berth 1' }] } });
    const store = storeOver(script);
    const ref = store.resourceListByKeys(signal('berths'), signal('id'), signal(['b1']), signal(['id', 'name']));
    await settle(() => ref.status() === 'resolved');
    expect(script.requests.map((r) => r.url)).toEqual([url]);
  });
});

describe('ResourceStore paged reader', () => {
  it('asks for the first page with its count and turns it by the server\'s relations', async () => {
    const first = '/api/sectors/anvil/hangars?columns=id%2Cname&count=true';
    const second = '/api/sectors/anvil/hangars?columns=id%2Cname&cursor=v4.local.two';
    const script = scripted({
      [first]: { rows: [{ id: 'h1', name: 'Anvil Dock One' }, { id: 'h2', name: 'Quarantine Bay' }], headers: { 'total-count': '3', link: `<${second}>; rel="next"` } },
      [second]: { rows: [{ id: 'h3', name: 'Bastion Slip' }], headers: { link: `<${first}>; rel="prev"` } },
    });
    const store = storeOver(script);
    const pager = store.resourcePage(signal({ route: 'sectors/{sectorID}/hangars', columns: ['id', 'name'] }));
    await settle(() => pager.status() === 'resolved');
    expect(pager.rows()).toEqual([{ id: 'h1', name: 'Anvil Dock One' }, { id: 'h2', name: 'Quarantine Bay' }] as never);
    expect(pager.page()).toEqual({ offset: 0, hasPrev: false, hasNext: true, total: 3 });

    pager.turn('next');
    await settle(() => pager.status() === 'resolved' && pager.page().offset === 2);
    expect(pager.rows()).toEqual([{ id: 'h3', name: 'Bastion Slip' }] as never);
    expect(pager.page()).toEqual({ offset: 2, hasPrev: true, hasNext: false, total: 3 });

    pager.turn('prev');
    await settle(() => pager.status() === 'resolved' && pager.page().offset === 0);
    expect(pager.page()).toEqual({ offset: 0, hasPrev: false, hasNext: true, total: 3 });
    expect(script.requests.map((r) => r.url)).toEqual([first, second, first]);
    pager.destroy();
  });

  it('holds the server\'s refusal of a bounded source with no order and no sort', async () => {
    const url = '/api/berths?columns=id%2Cname&count=true';
    const script = scripted({ [url]: { status: 400, rows: { message: 'Berths serves at most 50 rows per page and declares no order; add a sort' } } });
    const store = storeOver(script);
    const pager = store.resourcePage(signal({ route: 'berths', columns: ['id', 'name'] }));
    await settle(() => pager.status() === 'error');
    const error = pager.error();
    expect(error instanceof ApiError && error.message).toBe('Berths serves at most 50 rows per page and declares no order; add a sort');
    expect(pager.rows()).toEqual([]);
    pager.destroy();
  });
});
