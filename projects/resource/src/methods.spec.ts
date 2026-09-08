import { describe, expect, it } from 'bun:test';
import { Method } from './brands';
import { createClient, MethodAnswer, MethodHandle } from './client';
import { ApiDescriptor } from './descriptor';
import { ApiError, Transport, TransportRequest, dryRunHeader } from './transport';

// The method handle's contract for a method that declares its statuses (@answers):
// a declared code resolves with { status, result }, an undeclared one throws, an
// answerless 204 resolves with nothing, and a dry run treats a declared 4xx as the
// refusal it is.

const descriptor: ApiDescriptor = {
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  resources: {},
  methods: {
    CompleteMission: {
      method: 'CompleteMission' as Method,
      property: 'completeMission',
      route: 'complete-mission',
      scope: 'global',
      answers: true,
      statuses: [200, 409],
    },
    ArchiveMission: {
      method: 'ArchiveMission' as Method,
      property: 'archiveMission',
      route: 'archive-mission',
      scope: 'global',
      statuses: [204],
    },
    HoldMission: {
      method: 'HoldMission' as Method,
      property: 'holdMission',
      route: 'hold-mission',
      scope: 'global',
    },
  },
};

interface Settlement {
  fee: string;
  net: string;
}

interface Api {
  completeMission: MethodHandle<{ missionId: string }, MethodAnswer<200 | 409, Settlement>>;
  archiveMission: MethodHandle<{ missionId: string }>;
  holdMission: MethodHandle<{ missionId: string; reason: string }>;
}

/** A transport that answers every request with one scripted status and body. */
function answering(status: number, body?: unknown): { transport: Transport; requests: TransportRequest[] } {
  const requests: TransportRequest[] = [];
  const transport: Transport = async (request) => {
    requests.push(request);
    return { status, body };
  };
  return { transport, requests };
}

function api(transport: Transport): Api {
  return createClient<Api, Record<string, never>>(descriptor, { baseUrl: '/api', transport }) as unknown as Api;
}

describe('a method that declares its statuses', () => {
  it('resolves a declared 2xx with the status and the typed result', async () => {
    const { transport } = answering(200, { fee: '15000', net: '13500' });
    const answer = await api(transport).completeMission.execute({ missionId: 'm1' });
    expect(answer).toEqual({ status: 200, result: { fee: '15000', net: '13500' } });
  });

  it('resolves a declared 4xx the same way: the method refused, and said why in its own type', async () => {
    const { transport, requests } = answering(409, { fee: '15000', net: '-6500' });
    const answer = await api(transport).completeMission.execute({ missionId: 'm1' });
    expect(answer).toEqual({ status: 409, result: { fee: '15000', net: '-6500' } });
    expect(requests[0].url).toBe('/api/complete-mission');
    expect(requests[0].headers?.[dryRunHeader]).toBeUndefined();
  });

  it('throws ApiError for a status the method did not declare', async () => {
    const { transport } = answering(403, { message: 'user (lead) does not have (Execute) on CompleteMission' });
    await expect(api(transport).completeMission.execute({ missionId: 'm1' })).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError for a 5xx even when 4xx answers are declared', async () => {
    const { transport } = answering(500, { message: 'boom' });
    await expect(api(transport).completeMission.execute({ missionId: 'm1' })).rejects.toBeInstanceOf(ApiError);
  });

  it('a dry run rejects a declared 4xx as the refusal it is, carrying the typed body', async () => {
    const { transport, requests } = answering(409, { fee: '15000', net: '-6500' });
    const call = api(transport).completeMission.dryRun({ missionId: 'm1' });
    await expect(call).rejects.toBeInstanceOf(ApiError);
    await call.catch((e: ApiError) => expect(e.body).toEqual({ fee: '15000', net: '-6500' }));
    expect(requests[0].headers?.[dryRunHeader]).toBe('true');
  });

  it('an answerless method declaring 204 resolves with nothing', async () => {
    const { transport } = answering(204);
    await expect(api(transport).archiveMission.execute({ missionId: 'm1' })).resolves.toBeUndefined();
  });
});

describe('a method without declared statuses', () => {
  it('resolves an empty 200 with nothing', async () => {
    const { transport } = answering(200);
    await expect(api(transport).holdMission.execute({ missionId: 'm1', reason: 'weather' })).resolves.toBeUndefined();
  });

  it('throws ApiError for every 4xx', async () => {
    const { transport } = answering(409, { message: 'already on hold' });
    await expect(api(transport).holdMission.execute({ missionId: 'm1', reason: 'weather' })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
