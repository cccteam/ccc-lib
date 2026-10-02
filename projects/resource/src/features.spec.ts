import { describe, expect, it } from 'bun:test';
import { Domain, Method, Resource } from './brands';
import { createClient } from './client';
import { ApiDescriptor } from './descriptor';
import { FeatureFlag, FeatureFlip, featureFlagsResource, setFeatureMethod } from './features';
import { ApiError, TransportRequest, TransportResponse } from './transport';
import { ScriptedTransport, scriptedTransport } from '@cccteam/resource/testing';

// The enabled set of feature flags: loaded from the features route and asked
// synchronously, empty and off before it loads or when the load fails, flipped through
// the generated method with the set and the digest refreshed after the write, and the
// declared flags listed through the client's own handle on the flags resource.

const descriptor: ApiDescriptor = {
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
  domainRoute: { segment: 'sectors', param: 'sectorID' },
  resources: {
    [featureFlagsResource]: {
      resource: featureFlagsResource,
      property: 'featureFlags',
      route: 'feature-flags',
      scope: 'global',
      consolidated: false,
      keys: ['name'],
      operations: ['list', 'read'],
      page: { default: 25 },
    },
    Debriefs: {
      resource: 'Debriefs' as Resource,
      property: 'debriefs',
      route: 'debriefs',
      scope: 'domain',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read'],
      page: { default: 25 },
      feature: 'debriefs',
    },
  },
  methods: {
    [setFeatureMethod]: {
      method: setFeatureMethod,
      property: 'setFeature',
      route: 'set-feature',
      scope: 'global',
      answers: true,
    },
    FileDebrief: {
      method: 'FileDebrief' as Method,
      property: 'fileDebrief',
      route: 'file-debrief',
      scope: 'domain',
      feature: 'debriefs',
    },
  },
};

const flags: FeatureFlag[] = [
  {
    name: 'debriefs',
    description: 'Crews file a debrief after a sortie.',
    enabled: true,
    updatedAt: '2026-09-29T08:00:00Z',
    updatedBy: 'hollis',
  },
  {
    name: 'manifests',
    description: 'Cargo manifests on the consignment page.',
    enabled: false,
    updatedAt: '2026-09-01T08:00:00Z',
    updatedBy: 'migrate',
  },
];

/** The features route, the digest and domains, the flip method and the flags resource, each answering. */
function serverWith(enabled: () => string[]): ScriptedTransport {
  return scriptedTransport((request: TransportRequest): TransportResponse => {
    const path = request.url.replace(/\?.*$/, '');
    switch (path) {
      case '/api/features':
        return { status: 200, body: { enabled: enabled() } };
      case '/api/permission-digest':
        return { status: 200, body: { [setFeatureMethod]: { Execute: 'granted' } } };
      case '/api/user-domains':
        return { status: 200, body: ['anvil'] };
      case '/api/set-feature': {
        const body = request.body as { name: string; enabled: boolean };
        if (!flags.some((flag) => flag.name === body.name)) {
          return { status: 404, body: { message: `no feature named ${body.name}` } };
        }
        return { status: 200, body: { ...body, updatedAt: '2026-10-02T09:30:00Z' } satisfies FeatureFlip };
      }
      case '/api/feature-flags':
        return { status: 200, body: flags };
      default:
        return { status: 404, body: { message: `unscripted ${request.url}` } };
    }
  });
}

describe('FeatureState', () => {
  it('is empty and off before the set has loaded, and asks nothing on its own', () => {
    const transport = serverWith(() => ['debriefs']);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    expect(api.features.loaded).toBe(false);
    expect(api.features.enabled('debriefs')).toBe(false);
    expect(api.features.names()).toEqual([]);
    expect(transport.requests).toHaveLength(0);
  });

  it('loads the enabled set from the features route and answers from it', async () => {
    const transport = serverWith(() => ['manifests', 'debriefs']);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    expect(await api.features.refresh()).toEqual(['manifests', 'debriefs']);
    expect(transport.requests.map((r) => [r.method, r.url])).toEqual([['GET', '/api/features']]);
    expect(api.features.loaded).toBe(true);
    expect(api.features.enabled('debriefs')).toBe(true);
    expect(api.features.enabled('manifests')).toBe(true);
    expect(api.features.enabled('telemetry')).toBe(false);
    expect(api.features.names()).toEqual(['debriefs', 'manifests']);
  });

  const empties: { name: string; body: unknown }[] = [
    { name: 'an empty list', body: { enabled: [] } },
    { name: 'a null list', body: { enabled: null } },
    { name: 'no body', body: undefined },
  ];

  for (const tt of empties) {
    it(`${tt.name} loads as nothing enabled`, async () => {
      const api = createClient(descriptor, {
        baseUrl: '/api',
        transport: scriptedTransport({ status: 200, body: tt.body }),
      });
      expect(await api.features.refresh()).toEqual([]);
      expect(api.features.loaded).toBe(true);
      expect(api.features.enabled('debriefs')).toBe(false);
    });
  }

  it('concurrent loads share one request', async () => {
    const transport = serverWith(() => ['debriefs']);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    await Promise.all([api.features.refresh(), api.features.refresh()]);
    expect(transport.requests).toHaveLength(1);
  });

  it('a failed load empties the set, leaves it unloaded, and rethrows', async () => {
    let fail = false;
    const transport = scriptedTransport((request) =>
      fail ? { status: 503, body: { message: 'unavailable' } } : serverWith(() => ['debriefs'])(request),
    );
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    await api.features.refresh();
    expect(api.features.enabled('debriefs')).toBe(true);

    fail = true;
    await expect(api.features.refresh()).rejects.toBeInstanceOf(ApiError);
    expect(api.features.loaded).toBe(false);
    expect(api.features.enabled('debriefs')).toBe(false);
  });

  it('notifies subscribers on every change of the set', async () => {
    const api = createClient(descriptor, { baseUrl: '/api', transport: serverWith(() => ['debriefs']) });
    const seen: boolean[] = [];
    const release = api.features.subscribe((snapshot) => seen.push(snapshot.enabled.has('debriefs')));
    await api.features.refresh();
    api.features.clear();
    release();
    await api.features.refresh();
    expect(seen).toEqual([true, false]);
  });

  it('ensure loads the set once when it has not loaded, then answers from it', async () => {
    const transport = serverWith(() => ['debriefs']);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    expect(await api.features.ensure('debriefs')).toBe(true);
    expect(await api.features.ensure('manifests')).toBe(false);
    expect(transport.requests.filter((r) => r.url === '/api/features')).toHaveLength(1);
  });

  it('ensure answers false when the load fails, and asks again next time', async () => {
    const transport = scriptedTransport({ status: 401, body: { message: 'sign in first' } });
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    expect(await api.features.ensure('debriefs')).toBe(false);
    expect(await api.features.ensure('debriefs')).toBe(false);
    expect(transport.requests).toHaveLength(2);
  });

  it('clear forgets the set', async () => {
    const api = createClient(descriptor, { baseUrl: '/api', transport: serverWith(() => ['debriefs']) });
    await api.features.refresh();
    api.features.clear();
    expect(api.features.loaded).toBe(false);
    expect(api.features.enabled('debriefs')).toBe(false);
  });
});

describe('FeatureState.setFeature', () => {
  it('posts the flip to the generated method and then reloads the set, the domains, and every cached digest', async () => {
    const enabled = ['debriefs'];
    const transport = serverWith(() => enabled);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    await api.features.refresh();
    await api.permissions.loadDigest();
    await api.permissions.loadDigest('anvil' as Domain);
    transport.requests.length = 0;

    enabled.push('manifests');
    const flip = await api.features.setFeature('manifests', true);

    expect(flip).toEqual({ name: 'manifests', enabled: true, updatedAt: '2026-10-02T09:30:00Z' });
    const [first] = transport.requests;
    expect([first.method, first.url, first.body]).toEqual([
      'POST',
      '/api/set-feature',
      { name: 'manifests', enabled: true },
    ]);
    expect(
      transport.requests
        .slice(1)
        .map((r) => r.url)
        .sort(),
    ).toEqual(['/api/features', '/api/permission-digest', '/api/permission-digest?domain=anvil', '/api/user-domains']);
    expect(api.features.enabled('manifests')).toBe(true);
  });

  it("a refused flip rejects with the server's error and refreshes nothing", async () => {
    const transport = serverWith(() => ['debriefs']);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    await api.features.refresh();
    transport.requests.length = 0;

    await expect(api.features.setFeature('telemetry', true)).rejects.toBeInstanceOf(ApiError);
    expect(transport.requests.map((r) => r.url)).toEqual(['/api/set-feature']);
    expect(api.features.enabled('debriefs')).toBe(true);
  });

  it('an API that declares no flip method refuses before any request', async () => {
    const transport = serverWith(() => []);
    const api = createClient({ ...descriptor, methods: {} }, { baseUrl: '/api', transport });
    await expect(api.features.setFeature('debriefs', true)).rejects.toThrow(/declares no SetFeature method/);
    expect(transport.requests).toHaveLength(0);
  });

  it("canSet is the digest's Execute entry for the flip method", async () => {
    const api = createClient(descriptor, { baseUrl: '/api', transport: serverWith(() => []) });
    expect(api.features.canSet()).toBe(false);
    await api.permissions.loadDigest();
    expect(api.features.canSet()).toBe(true);
    api.permissions.clear();
    expect(api.features.canSet()).toBe(false);
  });
});

describe('FeatureState.flags', () => {
  it('reads every declared flag through the flags resource, whole and by name', async () => {
    const transport = serverWith(() => []);
    const api = createClient(descriptor, { baseUrl: '/api', transport });
    expect(await api.features.flags()).toEqual(flags);
    expect(transport.requests.map((r) => [r.method, r.url])).toEqual([
      ['GET', '/api/feature-flags?sort=name&limit=all'],
    ]);
  });

  it('pages a flags resource that declares a maximum, following the relations to the end', async () => {
    const paged: ApiDescriptor = {
      ...descriptor,
      resources: {
        ...descriptor.resources,
        [featureFlagsResource]: { ...descriptor.resources[featureFlagsResource], page: { default: 25, max: 1 } },
      },
    };
    const transport = scriptedTransport((request): TransportResponse => {
      if (request.url === '/api/feature-flags?sort=name&limit=1') {
        return {
          status: 200,
          body: [flags[0]],
          headers: { link: '</api/feature-flags?cursor=c2&sort=name&limit=1>; rel="next"' },
        };
      }
      if (request.url === '/api/feature-flags?cursor=c2&sort=name&limit=1') {
        return { status: 200, body: [flags[1]], headers: {} };
      }
      return { status: 404, body: { message: `unscripted ${request.url}` } };
    });
    const api = createClient(paged, { baseUrl: '/api', transport });
    expect(await api.features.flags()).toEqual(flags);
    expect(transport.requests).toHaveLength(2);
  });

  it('an API that declares no flags resource refuses before any request', async () => {
    const transport = serverWith(() => []);
    const api = createClient({ ...descriptor, resources: {} }, { baseUrl: '/api', transport });
    await expect(api.features.flags()).rejects.toThrow(/declares no FeatureFlags resource/);
    expect(transport.requests).toHaveLength(0);
  });
});
