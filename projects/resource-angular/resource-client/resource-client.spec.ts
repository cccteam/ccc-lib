import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, ErrorHandler, Injectable, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiDescriptor, ApiError, ClientBase, createClient } from '@cccteam/resource';
import { AlertType, BASE_URL, LOGIN_REDIRECT_URL } from '@cccteam/resource-angular/types';
import { UiCoreService } from '@cccteam/resource-angular/ui-core-service';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';

import {
  httpClientTransport,
  NO_RESPONSE_MESSAGE,
  provideResourceClient,
  RESOURCE_CLIENT,
  ResourceClientOptions,
  ResourceErrorHandler,
} from './resource-client';

// The Angular adapter renders the client's judgment: a 401 returns the browser to the
// login page with the attempted URL kept, an ApiError nobody caught raises one global
// notice in the server's words, a declared answer and a handled refusal raise none, and
// every request moves the activity counter.

@Component({ template: '' })
class BlankComponent {}

afterEach(() => {
  vi.restoreAllMocks();
});

const descriptor: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
};

function messages(): string[] {
  return TestBed.inject(NotificationService)
    .notifications()
    .map((n) => n.message);
}

describe('provideResourceClient', () => {
  let received: ResourceClientOptions | undefined;
  let http: HttpTestingController;
  let router: Router;
  let client: ClientBase;

  beforeEach(async () => {
    received = undefined;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'deck', component: BlankComponent },
          { path: 'login', component: BlankComponent },
        ]),
        { provide: BASE_URL, useValue: 'https://console.example' },
        provideResourceClient((options) => {
          received = options;
          return createClient(descriptor, { baseUrl: '/api', ...options });
        }),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/deck');
    client = TestBed.inject(RESOURCE_CLIENT);
  });

  it('hands the factory the transport and the error hook, and provides the error handler', () => {
    expect(typeof received?.transport).toBe('function');
    expect(typeof received?.onError).toBe('function');
    expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(ResourceErrorHandler);
  });

  describe('the handler in effect', () => {
    @Injectable()
    class ApplicationErrorHandler extends ResourceErrorHandler {}

    const cases: { name: string; later: Provider[]; wantError: RegExp | undefined }[] = [
      {
        name: "a later provider re-providing Angular's default handler fails at startup naming the way out",
        later: [{ provide: ErrorHandler, useClass: ErrorHandler }],
        wantError: /ErrorHandler[\s\S]*provideAnimationsAsync\(\)[\s\S]*provideResourceClient/,
      },
      {
        name: "an application's own handler extending ResourceErrorHandler is accepted",
        later: [{ provide: ErrorHandler, useClass: ApplicationErrorHandler }],
        wantError: undefined,
      },
    ];

    for (const tt of cases) {
      it(tt.name, () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            provideHttpClient(),
            provideHttpClientTesting(),
            provideRouter([]),
            provideResourceClient((options) => createClient(descriptor, { baseUrl: '/api', ...options })),
            ...tt.later,
          ],
        });
        if (tt.wantError) {
          expect(() => TestBed.inject(RESOURCE_CLIENT)).toThrowError(tt.wantError);
        } else {
          expect(TestBed.inject(RESOURCE_CLIENT)).toBeDefined();
          expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(ApplicationErrorHandler);
        }
      });
    }
  });

  describe('the hook on a refused request', () => {
    const cases: { name: string; status: number; wantRedirect: string; wantNavigations: string[][] }[] = [
      {
        name: 'a 401 keeps the attempted URL under BASE_URL and moves to the login route',
        status: 401,
        wantRedirect: 'https://console.example/deck',
        wantNavigations: [['/login']],
      },
      { name: 'a 403 leaves the router and the redirect alone', status: 403, wantRedirect: '', wantNavigations: [] },
      { name: 'a 500 leaves the router and the redirect alone', status: 500, wantRedirect: '', wantNavigations: [] },
    ];

    for (const tt of cases) {
      it(tt.name, async () => {
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        const pending = client.request('GET', 'missions');
        http.expectOne('/api/missions').flush({ message: 'refused' }, { status: tt.status, statusText: 'refused' });
        await expect(pending).rejects.toThrow(ApiError);
        expect(TestBed.inject(LOGIN_REDIRECT_URL)()).toBe(tt.wantRedirect);
        expect(navigate.mock.calls.map((args) => args[0])).toEqual(tt.wantNavigations);
      });
    }
  });

  it('a 401 on the login page itself moves nothing and keeps no URL', async () => {
    await router.navigateByUrl('/login');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const pending = client.request('GET', 'missions');
    http.expectOne('/api/missions').flush({ message: 'refused' }, { status: 401, statusText: 'Unauthorized' });
    await expect(pending).rejects.toThrow(ApiError);
    expect(TestBed.inject(LOGIN_REDIRECT_URL)()).toBe('');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('a declared answer resolves, moves nothing, and raises no notice', async () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const pending = client.request<{ fee: number }>('POST', 'complete-mission', { body: {}, accept: [409] });
    http.expectOne('/api/complete-mission').flush({ fee: 3 }, { status: 409, statusText: 'Conflict' });
    await expect(pending).resolves.toEqual({ fee: 3 });
    expect(navigate).not.toHaveBeenCalled();
    expect(messages()).toEqual([]);
  });

  it('a refusal the caller catches raises no notice', async () => {
    const pending = client.request('DELETE', 'missions/1').catch((error: unknown) => error);
    http.expectOne('/api/missions/1').flush({ message: 'Ship still docked' }, { status: 409, statusText: 'Conflict' });
    const caught = await pending;
    expect(caught).toBeInstanceOf(ApiError);
    expect(messages()).toEqual([]);
  });
});

describe('ResourceErrorHandler', () => {
  const wrapped = (rejection: unknown): Error => Object.assign(new Error('Uncaught (in promise)'), { rejection });

  const cases: { name: string; error: unknown; wantMessages: string[]; wantConsole: boolean }[] = [
    {
      name: "an uncaught ApiError raises one notice in the server's words",
      error: new ApiError('DELETE', '/api/missions/1', 409, { message: 'Ship still docked' }),
      wantMessages: ['Ship still docked'],
      wantConsole: false,
    },
    {
      name: 'a body with no message falls back to the status',
      error: new ApiError('GET', '/api/missions', 500, undefined),
      wantMessages: ['HTTP 500'],
      wantConsole: false,
    },
    {
      name: "zone.js's wrapped promise rejection is unwrapped to the ApiError",
      error: wrapped(new ApiError('PATCH', '/api/missions/1', 403, { message: 'Not your mission' })),
      wantMessages: ['Not your mission'],
      wantConsole: false,
    },
    {
      name: "Angular's own wrapper is unwrapped the same",
      error: Object.assign(new Error('wrapped'), { ngOriginalError: new ApiError('GET', '/api/x', 404, 'gone') }),
      wantMessages: ['gone'],
      wantConsole: false,
    },
    {
      name: 'a 401 raises none: the hook has already returned the browser to the login page',
      error: new ApiError('GET', '/api/missions', 401, { message: 'Unauthorized' }),
      wantMessages: [],
      wantConsole: false,
    },
    {
      name: 'a request that got no response raises the no-response notice',
      error: new HttpErrorResponse({ status: 0, url: '/api/missions' }),
      wantMessages: [NO_RESPONSE_MESSAGE],
      wantConsole: false,
    },
    {
      name: 'a wrapped no-response failure the same',
      error: wrapped(new HttpErrorResponse({ status: 0, url: '/api/missions' })),
      wantMessages: [NO_RESPONSE_MESSAGE],
      wantConsole: false,
    },
    {
      name: "a response HttpClient judged itself is not the client's and goes to the console",
      error: new HttpErrorResponse({ status: 500, url: '/other' }),
      wantMessages: [],
      wantConsole: true,
    },
    { name: 'any other error goes to the console', error: new Error('boom'), wantMessages: [], wantConsole: true },
    { name: 'a thrown string goes to the console', error: 'boom', wantMessages: [], wantConsole: true },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useClass: ResourceErrorHandler }] });
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      TestBed.inject(ErrorHandler).handleError(tt.error);

      const notifications = TestBed.inject(NotificationService).notifications();
      expect(notifications.map((n) => n.message)).toEqual(tt.wantMessages);
      expect(notifications.every((n) => n.type === AlertType.ERROR)).toBe(true);
      expect(consoleError.mock.calls.length).toBe(tt.wantConsole ? 1 : 0);
    });
  }
});

describe('httpClientTransport', () => {
  const cases: { name: string; respond: (request: TestRequest) => void; rejects: boolean }[] = [
    {
      name: 'a 200 ends the activity it began',
      respond: (request) => request.flush({ ok: true }),
      rejects: false,
    },
    {
      name: 'a refusal resolves for the client to judge and ends the activity',
      respond: (request) => request.flush({ message: 'no' }, { status: 403, statusText: 'Forbidden' }),
      rejects: false,
    },
    {
      name: 'no response rejects and ends the activity',
      respond: (request) => request.error(new ProgressEvent('error')),
      rejects: true,
    },
  ];

  for (const tt of cases) {
    it(tt.name, async () => {
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const ui = TestBed.inject(UiCoreService);
      const transport = httpClientTransport(TestBed.inject(HttpClient), ui);

      const pending = transport({ method: 'GET', url: '/api/missions' });
      expect(ui.isLoading()).toBe(true);
      tt.respond(TestBed.inject(HttpTestingController).expectOne('/api/missions'));
      if (tt.rejects) {
        await expect(pending).rejects.toBeInstanceOf(HttpErrorResponse);
      } else {
        await pending;
      }
      expect(ui.isLoading()).toBe(false);
    });
  }

  it('two requests for one URL hold the activity until both settle', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const ui = TestBed.inject(UiCoreService);
    const transport = httpClientTransport(TestBed.inject(HttpClient), ui);
    const http = TestBed.inject(HttpTestingController);

    const first = transport({ method: 'GET', url: '/api/missions' });
    const second = transport({ method: 'GET', url: '/api/missions' });
    const [firstRequest, secondRequest] = http.match('/api/missions');
    firstRequest.flush([]);
    await first;
    expect(ui.isLoading()).toBe(true);
    secondRequest.flush([]);
    await second;
    expect(ui.isLoading()).toBe(false);
  });

  it('without a counter it counts nothing', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const transport = httpClientTransport(TestBed.inject(HttpClient));
    const pending = transport({ method: 'GET', url: '/api/missions' });
    TestBed.inject(HttpTestingController).expectOne('/api/missions').flush([]);
    await pending;
    expect(TestBed.inject(UiCoreService).isLoading()).toBe(false);
  });
});
