import { describe, expect, it } from 'bun:test';
import { Resource } from './brands';
import { createClient, resolveAbsolute, AnyResourceHandle } from './client';
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

describe('all', () => {
  it('asks for every row at once where the resource declares no maximum', async () => {
    const { transport, requests } = scripted({
      '/api/sectors?limit=all': { rows: [{ id: 'a' }, { id: 'b' }] },
    });
    const api = createClient<{ sectors: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    expect(await api.sectors.all()).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(requests).toHaveLength(1);
  });

  it('walks the pages in primary-key order where a maximum is declared', async () => {
    const first = '/api/missions?sort=id%3Aasc';
    const second = '/api/missions?sort=id%3Aasc&cursor=v4.local.two';
    const { transport, requests } = scripted({
      [first]: { rows: [{ id: 'a' }, { id: 'b' }], headers: { link: `<${second}>; rel="next"` } },
      [second]: { rows: [{ id: 'c' }], headers: { link: `<${first}>; rel="prev"` } },
    });
    const api = createClient<{ missions: AnyResourceHandle<Row> }, unknown>(descriptor, { baseUrl: '/api', transport });
    expect(await api.missions.all()).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
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
