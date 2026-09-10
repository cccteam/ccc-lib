import { describe, expect, it } from 'bun:test';
import { Resource } from './brands';
import { createClient, ResourceHandle } from './client';
import { ApiDescriptor } from './descriptor';
import { Operation, OperationRoute, operationRoute } from './operations';
import { Transport, TransportRequest } from './transport';

// client.batch delivers operations to the endpoint that can commit them: the
// consolidated route for consolidated resources, a standalone resource's own PATCH
// route for its operations (the generator's consolidated handler does not know that
// resource, so its path is the key alone and would read as a resource name there), and
// a refusal when one batch mixes the two.

const descriptor: ApiDescriptor = {
  domainRoute: { segment: 'sectors', param: 'sectorID' },
  consolidatedRoute: 'resources',
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  resources: {
    Missions: {
      resource: 'Missions' as Resource,
      property: 'missions',
      route: 'missions',
      scope: 'domain',
      consolidated: true,
      keys: ['id'],
      operations: ['list', 'read', 'create', 'patch', 'remove'],
      patchable: ['notes'],
    },
    Clients: {
      resource: 'Clients' as Resource,
      property: 'clients',
      route: 'clients',
      scope: 'global',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read', 'create', 'patch', 'remove'],
      patchable: ['name', 'trusted'],
    },
    Hangars: {
      resource: 'Hangars' as Resource,
      property: 'hangars',
      route: 'hangars',
      scope: 'domain',
      consolidated: false,
      keys: ['id'],
      operations: ['list', 'read', 'create', 'patch', 'remove'],
      patchable: ['name'],
    },
  },
  methods: {},
};

interface Client {
  id: string;
  name: string;
  trusted: boolean;
}
interface Mission {
  id: string;
  notes: string;
}
interface Hangar {
  id: string;
  name: string;
}

interface Global {
  clients: ResourceHandle<Client, [string], Pick<Client, 'name' | 'trusted'>>;
}
interface Sector {
  missions: ResourceHandle<Mission, [string], Pick<Mission, 'notes'>>;
  hangars: ResourceHandle<Hangar, [string], Pick<Hangar, 'name'>>;
}

function recording(): { transport: Transport; requests: TransportRequest[] } {
  const requests: TransportRequest[] = [];
  const transport: Transport = async (request) => {
    requests.push(request);
    return { status: 200, body: {} };
  };
  return { transport, requests };
}

function api(transport: Transport) {
  return createClient<Global, Sector>(descriptor, { baseUrl: '/api', transport });
}

describe('client.batch', () => {
  it('sends a consolidated resource to the consolidated endpoint with the full path', async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    await client.batch([client.domain('anvil').missions.ops.patch(['m1'], { notes: 'called twice' })]);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/api/resources');
    expect(requests[0].body).toEqual([
      { op: 'patch', path: '/sectors/anvil/missions/m1', value: { notes: 'called twice' } },
    ]);
  });

  it('sends a standalone resource to its own route with the key as the path', async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    await client.batch([client.clients.ops.patch(['c1'], { trusted: true })]);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/api/clients');
    expect(requests[0].body).toEqual([{ op: 'patch', path: '/c1', value: { trusted: true } }]);
  });

  it('sends a domain-scoped standalone resource to its scoped route', async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    await client.batch([client.domain('anvil').hangars.ops.add({ name: 'Bay 3' })]);
    expect(requests[0].url).toBe('/api/sectors/anvil/hangars');
    expect(requests[0].body).toEqual([{ op: 'add', path: '/', value: { name: 'Bay 3' } }]);
  });

  it('keeps several operations of one standalone resource in one request', async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    await client.batch([client.clients.ops.patch(['c1'], { trusted: true }), client.clients.ops.remove(['c2'])]);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/api/clients');
  });

  it('refuses operations for two endpoints before sending anything', async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    const sector = client.domain('anvil');
    await expect(
      client.batch([
        sector.missions.ops.patch(['m1'], { notes: 'x' }),
        client.clients.ops.patch(['c1'], { trusted: true }),
      ]),
    ).rejects.toThrow(/resources, clients/);
    expect(requests).toHaveLength(0);
  });

  it('binds the route so that it survives a spread and stays off the wire', async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    const copy: Operation = { ...client.clients.ops.patch(['c1'], { trusted: true }) };
    expect(operationRoute(copy)).toBe('clients');
    expect(copy[OperationRoute]).toBe('clients');
    expect(JSON.parse(JSON.stringify(copy))).toEqual({ op: 'patch', path: '/c1', value: { trusted: true } });
    await client.batch([copy]);
    expect(requests[0].url).toBe('/api/clients');
  });

  it('leaves a consolidated operation unbound', () => {
    const client = api(recording().transport);
    expect(operationRoute(client.domain('anvil').missions.ops.remove(['m1']))).toBeUndefined();
  });

  it("routes the handle's own patch the same way", async () => {
    const { transport, requests } = recording();
    const client = api(transport);
    await client.clients.patch(['c1'], { name: 'Halvard Freight' });
    expect(requests[0].url).toBe('/api/clients');
    expect(requests[0].body).toEqual([{ op: 'patch', path: '/c1', value: { name: 'Halvard Freight' } }]);
  });
});
