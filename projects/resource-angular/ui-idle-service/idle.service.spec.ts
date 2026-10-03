import { TestBed } from '@angular/core/testing';
import { ApiDescriptor, createClient } from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { AuthService } from '@cccteam/resource-angular/auth-service';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { firstValueFrom } from 'rxjs';

import { IdleService } from './idle.service';

// The keep-alive belongs to the started service: no session check runs before start(),
// one runs every IDLE_KEEPALIVE_DURATION seconds while it runs, and none after stop(),
// so a logged-out application has no timer due and can settle.

const descriptor: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
};

/** The session and what the first authenticated answer loads beside it, each answering. */
function authenticatedServer(): ScriptedTransport {
  return scriptedTransport((request) => {
    switch (request.url) {
      case '/api/user/session':
        return { status: 200, body: { authenticated: true } };
      case '/api/permission-digest':
        return { status: 200, body: {} };
      case '/api/user-domains':
        return { status: 200, body: [] };
      case '/api/features':
        return { status: 200, body: { enabled: [] } };
      default:
        return { status: 404, body: { message: `unscripted ${request.url}` } };
    }
  });
}

describe('IdleService keep-alive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks the session only between start() and stop()', async () => {
    const transport = authenticatedServer();
    TestBed.configureTestingModule({
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
      ],
    });
    await firstValueFrom(TestBed.inject(AuthService).checkUserSession());
    const idle = TestBed.inject(IdleService);
    const sessionChecks = (): number => transport.requests.filter((r) => r.url === '/api/user/session').length;
    const before = sessionChecks();

    await vi.advanceTimersByTimeAsync(90_000);
    expect(sessionChecks()).toBe(before);

    idle.start();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(sessionChecks()).toBe(before + 1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(sessionChecks()).toBe(before + 2);

    idle.stop();
    await vi.advanceTimersByTimeAsync(90_000);
    expect(sessionChecks()).toBe(before + 2);
  });

  it('a second start() does not double the keep-alive', async () => {
    const transport = authenticatedServer();
    TestBed.configureTestingModule({
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
      ],
    });
    await firstValueFrom(TestBed.inject(AuthService).checkUserSession());
    const idle = TestBed.inject(IdleService);
    const before = transport.requests.filter((r) => r.url === '/api/user/session').length;

    idle.start();
    idle.start();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(transport.requests.filter((r) => r.url === '/api/user/session').length).toBe(before + 1);
    idle.stop();
  });
});
