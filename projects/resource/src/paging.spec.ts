import { describe, expect, it } from 'bun:test';
import { Resource } from './brands';
import { createClient, resolveAbsolute, walkSort, AnyResourceHandle } from './client';
import { ApiDescriptor } from './descriptor';
import { listSearchParams, parseLinkHeader } from './query';
import { Transport, TransportRequest } from './transport';

const descriptor: ApiDescriptor = {
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  resources: {
    Missions: {
      resource: 'Missions' as Resource,
      property: 'missions',
      route: 'missions',
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 25, max: 200 },
    },
    Sectors: {
      resource: 'Sectors' as Resource,
      property: 'sectors',
      route: 'sectors',
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 50 },
    },
    // A declared @order: the server pages a sort-less list by it.
    Consignments: {
      resource: 'Consignments' as Resource,
      property: 'consignments',
      route: 'consignments',
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 20, max: 100 },
      order: [{ field: 'expiresOn', direction: 'asc' }],
    },
  },
  methods: {},
};

interface Row {
  id: string;
}

/** A transport scripted by URL: each entry answers one request with rows and headers. */
function scripted(pages: Record<string, { rows: Row[]; headers?: Record<string, string> }>): {
  transport: Transport;
  requests: TransportRequest[];
} {
  const requests: TransportRequest[] = [];
  const transport: Transport = async (request) => {
    requests.push(request);
    const page = pages[request.url];
    if (!page) {
      return { status: 404, body: { message: `unscripted ${request.url}` } };
    }
    return { status: 200, body: page.rows, headers: page.headers ?? {} };
  };
  return { transport, requests };
}

describe('parseLinkHeader', () => {
  it('reads each relation and its URL exactly as written', () => {
    const header = '</api/missions?sort=deadline&limit=4&cursor=v4.local.aaa>; rel="next", </api/missions?sort=deadline&limit=4&cursor=v4.local.bbb>; rel="prev"';
    expect(parseLinkHeader(header)).toEqual({
      next: '/api/missions?sort=deadline&limit=4&cursor=v4.local.aaa',
      prev: '/api/missions?sort=deadline&limit=4&cursor=v4.local.bbb',
    });
  });

  it('answers nothing for an absent header', () => {
    expect(parseLinkHeader(undefined)).toEqual({});
  });
});

describe('listSearchParams paging', () => {
  it('sends limit, all, cursor, and count, and never offset', () => {
    expect(listSearchParams<Row>({ limit: 'all' }).toString()).toBe('limit=all');
    expect(listSearchParams<Row>({ limit: 10, cursor: 'v4.local.x', count: true }).toString()).toBe(
      'limit=10&cursor=v4.local.x&count=true',
    );
    expect(listSearchParams<Row>({ count: false }).toString()).toBe('');
  });
});

describe('resolveAbsolute', () => {
  it('joins a path-absolute reference to the base origin', () => {
    expect(resolveAbsolute('https://host.example/api', '/api/missions?cursor=x')).toBe(
      'https://host.example/api/missions?cursor=x',
    );
  });

  it('passes a same-origin reference and a complete URL through', () => {
    expect(resolveAbsolute('/api', '/api/missions?cursor=x')).toBe('/api/missions?cursor=x');
    expect(resolveAbsolute('/api', 'https://other.example/api/missions')).toBe('https://other.example/api/missions');
  });
});

describe('page', () => {
  it('reads the rows, the total, and follows next and prev as the server named them', async () => {
    const first = '/api/missions?sort=deadline&limit=2&count=true';
    const second = '/api/missions?sort=deadline&limit=2&cursor=v4.local.two';
    const backToFirst = '/api/missions?sort=deadline&limit=2&cursor=v4.local.one';
    const { transport, requests } = scripted({
      [first]: {
        rows: [{ id: 'a' }, { id: 'b' }],
        headers: { 'total-count': '3', link: `<${second}>; rel="next"` },
      },
      [second]: {
        rows: [{ id: 'c' }],
        headers: { link: `<${backToFirst}>; rel="prev"` },
      },
      [backToFirst]: {
        rows: [{ id: 'a' }, { id: 'b' }],
        headers: { link: `<${second}>; rel="next"` },
      },
    });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });

    const page = await api.missions.page({ sort: { field: 'deadline' as never }, limit: 2, count: true });
    expect(page.rows).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(page.total).toBe(3);
    expect(page.more).toBe(false);
    expect(page.prev).toBeUndefined();
    expect(page.next).toBeDefined();

    const next = await page.next!();
    expect(next.rows).toEqual([{ id: 'c' }]);
    expect(next.total).toBeUndefined();
    expect(next.next).toBeUndefined();

    const back = await next.prev!();
    expect(back.rows).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(requests.map((r) => r.url)).toEqual([first, second, backToFirst]);
    expect(requests.every((r) => r.method === 'GET')).toBe(true);
  });

  it('marks a primary-key-ordered page that did not fit, with no relations', async () => {
    const { transport } = scripted({
      '/api/sectors': { rows: [{ id: 'a' }], headers: { 'page-more': 'true' } },
    });
    const api = createClient<{ sectors: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    const page = await api.sectors.page();
    expect(page.more).toBe(true);
    expect(page.next).toBeUndefined();
  });
});

describe('page reload', () => {
  it('repeats the request that produced the page: the first page by its parameters, a later one by its cursor', async () => {
    const first = '/api/missions?sort=deadline&count=true';
    const second = '/api/missions?sort=deadline&cursor=v4.local.two';
    const { transport, requests } = scripted({
      [first]: { rows: [{ id: 'a' }], headers: { link: `<${second}>; rel="next"`, 'total-count': '2' } },
      [second]: { rows: [{ id: 'b' }], headers: { link: `<${first}>; rel="prev"` } },
    });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    const page = await api.missions.page({ sort: { field: 'deadline' as never }, count: true });
    const again = await page.reload();
    expect(again.rows).toEqual([{ id: 'a' }]);
    expect(again.total).toBe(2);
    const turned = await again.next!();
    const turnedAgain = await turned.reload();
    expect(turnedAgain.rows).toEqual([{ id: 'b' }]);
    expect(requests.map((r) => r.url)).toEqual([first, first, second, second]);
  });
});

describe('walkSort', () => {
  const cases: { name: string; resource: string; sort: { field: string; direction?: 'asc' | 'desc' }[] | undefined; want: unknown }[] = [
    { name: 'the caller\'s sort wins', resource: 'Consignments', sort: [{ field: 'mass', direction: 'desc' }], want: [{ field: 'mass', direction: 'desc' }] },
    { name: 'a declared order sends nothing', resource: 'Consignments', sort: undefined, want: undefined },
    { name: 'an empty sort counts as none', resource: 'Consignments', sort: [], want: undefined },
    { name: 'no declared order sends nothing: the list is not sorted, never by a key nobody asked for', resource: 'Missions', sort: undefined, want: undefined },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(walkSort(descriptor.resources[tt.resource], tt.sort as never)).toEqual(tt.want as never);
    });
  }
});

describe('sensitive filter', () => {
  it('posts the filter in the body and follows the walk with the same body', async () => {
    const first = '/api/missions?sort=deadline&limit=1';
    const second = '/api/missions?sort=deadline&limit=1&cursor=v4.local.two';
    const { transport, requests } = scripted({
      [first]: { rows: [{ id: 'a' }], headers: { link: `<${second}>; rel="next"` } },
      [second]: { rows: [{ id: 'b' }] },
    });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });

    const page = await api.missions.page({
      filter: 'contactEmail:eq:cleo@halvard.example',
      sensitiveFilter: true,
      sort: { field: 'deadline' as never },
      limit: 1,
    });
    const next = await page.next!();
    expect(next.rows).toEqual([{ id: 'b' }]);
    expect(requests.map((r) => [r.method, r.url, r.body])).toEqual([
      ['POST', first, { filter: 'contactEmail:eq:cleo@halvard.example' }],
      ['POST', second, { filter: 'contactEmail:eq:cleo@halvard.example' }],
    ]);
  });

  it('stays a GET when the query carries no filter', async () => {
    const { transport, requests } = scripted({ '/api/sectors': { rows: [] } });
    const api = createClient<{ sectors: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    await api.sectors.list({ sensitiveFilter: true });
    expect(requests[0].method).toBe('GET');
  });
});

describe('all', () => {
  it('asks for every row at once where the resource declares no maximum', async () => {
    const { transport, requests } = scripted({
      '/api/sectors?limit=all': { rows: [{ id: 'a' }, { id: 'b' }] },
    });
    const api = createClient<{ sectors: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    expect(await api.sectors.all()).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(requests).toHaveLength(1);
  });

  it('sends no sort where a maximum is declared and no order is, and refuses to pass off the unsorted first page as every row', async () => {
    const first = '/api/missions';
    const { transport, requests } = scripted({
      [first]: { rows: [{ id: 'a' }, { id: 'b' }], headers: { 'page-more': 'true' } },
    });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    await expect(api.missions.all()).rejects.toThrow('Missions: all() cannot walk every row');
    expect(requests.map((r) => r.url)).toEqual([first]);
  });

  it('answers the unsorted page where a maximum is declared, no order is, and every row fit', async () => {
    const first = '/api/missions';
    const { transport, requests } = scripted({ [first]: { rows: [{ id: 'a' }, { id: 'b' }] } });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    expect(await api.missions.all()).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(requests.map((r) => r.url)).toEqual([first]);
  });

  it('sends no sort where the resource declares an order, which the server pages by', async () => {
    const first = '/api/consignments';
    const second = '/api/consignments?cursor=v4.local.two';
    const { transport, requests } = scripted({
      [first]: { rows: [{ id: 'a' }], headers: { link: `<${second}>; rel="next"` } },
      [second]: { rows: [{ id: 'b' }], headers: { link: `<${first}>; rel="prev"` } },
    });
    const api = createClient<{ consignments: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    expect(await api.consignments.all()).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(requests.map((r) => r.url)).toEqual([first, second]);
  });

  it('keeps the caller\'s sort for the walk', async () => {
    const first = '/api/missions?sort=deadline%3Adesc&limit=200';
    const { transport, requests } = scripted({ [first]: { rows: [{ id: 'a' }] } });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    expect(await api.missions.all({ sort: { field: 'deadline' as never, direction: 'desc' }, limit: 200 })).toEqual([{ id: 'a' }]);
    expect(requests.map((r) => r.url)).toEqual([first]);
  });
});
