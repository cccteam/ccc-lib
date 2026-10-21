import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  ApiDescriptor,
  createClient,
  LoginMethod,
  LoginMethods,
  TransportRequest,
  TransportResponse,
} from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { AuthService } from '@cccteam/resource-angular/auth-service';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { DEFAULT_LOGIN_MESSAGES } from '@cccteam/resource-angular/types';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';
import { of } from 'rxjs';

import { LoginMethodsComponent, PASSWORDS_DIFFER } from './login-methods.component';

// The component renders the login page's methods from the server's list, in every shape
// the list takes, drives the password form and the redirect buttons from it, renders a
// refusal from the URL's code or a step's answer, and renders the pending step entered with
// ?pending= or answered to a password sign-in: the confirmation form posting to the route
// the list names, with a cancel back to the list. A session that must change its password
// gets the change form in the list's place, posting to the change path the list names, and
// the page recorded at the sign-in is emitted once the change is accepted. Every POST is
// preceded by a read of the list, so it carries a live XSRF token.

const descriptor: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
};

const password: LoginMethod = {
  name: 'password',
  method: 'password',
  kind: 'password',
  label: 'Password',
  path: '/console/api/user/password/login',
};
const google: LoginMethod = {
  name: 'google',
  method: 'google',
  kind: 'redirect',
  label: 'Google',
  path: '/console/api/user/google/login',
};
const entra: LoginMethod = {
  name: 'lakeside-entra',
  method: 'azure',
  kind: 'redirect',
  label: 'Lakeside staff',
  path: '/console/api/user/lakeside-entra/login',
};
const pendingRoutes = {
  status: '/console/api/user/pending',
  confirm: '/console/api/user/pending/confirm',
  cancel: '/console/api/user/pending/cancel',
};
const changePath = '/console/api/user/password/change';
const consoleList: LoginMethods = { methods: [password, google], pending: pendingRoutes, changePassword: changePath };
const waiting = {
  reason: 'confirmation',
  email: 'nova@fleet.example',
  expiresAt: '2026-10-17T12:10:00Z',
  returnUrl: '/console/missions',
};

/** What the server answers each route with; a spec changes an entry to script a step. */
interface Server {
  methods: LoginMethods;
  login: TransportResponse;
  status: TransportResponse;
  confirm: TransportResponse;
  /** What the change route answers; a server that accepts the change also clears the mark. */
  change: TransportResponse;
  authenticated: boolean;
  /** The session's operator-set password must change before anything else is served. */
  passwordChangeRequired: boolean;
}

function server(overrides: Partial<Server> = {}): Server {
  return {
    methods: consoleList,
    login: { status: 200, body: { mfaIsRequired: false } },
    status: { status: 404, body: { message: 'no pending sign-in' } },
    confirm: { status: 200, body: { mfaIsRequired: false } },
    change: { status: 200, body: undefined },
    authenticated: true,
    passwordChangeRequired: false,
    ...overrides,
  };
}

function transportOf(state: Server): ScriptedTransport {
  return scriptedTransport((request: TransportRequest) => {
    const path = request.url.replace(/\?.*$/, '');
    switch (`${request.method} ${path}`) {
      case 'GET /console/api/user/methods':
        return { status: 200, body: state.methods };
      case 'POST /console/api/user/password/login':
        return state.login;
      case 'GET /console/api/user/pending':
        return state.status;
      case 'POST /console/api/user/pending/confirm':
        return state.confirm;
      case 'POST /console/api/user/pending/cancel':
        return { status: 200, body: undefined };
      case `POST ${changePath}`:
        if (state.change.status < 400) {
          state.passwordChangeRequired = false;
        }
        return state.change;
      case 'GET /console/api/user/session':
        return {
          status: 200,
          body: {
            authenticated: state.authenticated,
            username: 'overseer',
            passwordChangeRequired: state.passwordChangeRequired,
          },
        };
      case 'DELETE /console/api/user/session':
        state.authenticated = false;
        return { status: 204, body: undefined };
      case 'GET /console/api/permission-digest':
        return { status: 200, body: {} };
      case 'GET /console/api/user-domains':
        return { status: 200, body: [] };
      case 'GET /console/api/features':
        return { status: 200, body: { enabled: [] } };
      default:
        return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
    }
  });
}

interface Page {
  fixture: ComponentFixture<LoginMethodsComponent>;
  component: LoginMethodsComponent;
  transport: ScriptedTransport;
  /** Where the component sent the browser, in order. */
  left: string[];
  signedIn: string[];
  cancelled: number;
  settle(): Promise<void>;
  element: HTMLElement;
}

/** The component over the server, arrived with the query, settled. */
async function pageOver(
  state: Server,
  query: Record<string, string> = {},
  inputs: Record<string, unknown> = {},
): Promise<Page> {
  const transport = transportOf(state);
  const params = convertToParamMap(query);
  await TestBed.configureTestingModule({
    imports: [LoginMethodsComponent],
    providers: [
      provideResourceTesting({
        transport,
        client: (t) => createClient(descriptor, { baseUrl: '/console/api', transport: t }),
      }),
      { provide: ActivatedRoute, useValue: { queryParamMap: of(params), snapshot: { queryParamMap: params } } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(LoginMethodsComponent);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  const component = fixture.componentInstance;
  const left: string[] = [];
  vi.spyOn(component as unknown as { leaveFor(url: string): void }, 'leaveFor').mockImplementation((url: string) => {
    left.push(url);
  });
  const signedIn: string[] = [];
  component.signedIn.subscribe((page) => signedIn.push(page));
  const page: Page = {
    fixture,
    component,
    transport,
    left,
    signedIn,
    cancelled: 0,
    element: fixture.nativeElement as HTMLElement,
    settle: async () => {
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();
      fixture.detectChanges();
    },
  };
  component.cancelled.subscribe(() => page.cancelled++);
  await page.settle();
  return page;
}

const sent = (transport: ScriptedTransport): string[] => transport.requests.map((r) => `${r.method} ${r.url}`);

/** Mounts the application under a path for one spec, the way a base href does, and unmounts it afterwards. */
function mountedAt(href: string): () => void {
  const base = document.createElement('base');
  base.href = href;
  document.head.prepend(base);
  return () => base.remove();
}
const buttonsOf = (page: Page): string[] =>
  Array.from(page.element.querySelectorAll<HTMLButtonElement>('button.ccc-login-redirect')).map(
    (b) => b.textContent?.trim() ?? '',
  );
const messageOf = (page: Page): string | null =>
  page.element.querySelector('.ccc-login-message')?.textContent?.trim() ?? null;

describe('LoginMethodsComponent renders the list', () => {
  const shapes: { name: string; methods: LoginMethod[]; wantForm: boolean; wantButtons: string[] }[] = [
    {
      name: 'the password and a redirect method',
      methods: [password, google],
      wantForm: true,
      wantButtons: ['Sign in with Google'],
    },
    { name: 'the password alone', methods: [password], wantForm: true, wantButtons: [] },
    { name: 'a redirect method alone', methods: [google], wantForm: false, wantButtons: ['Sign in with Google'] },
    {
      name: 'two redirect methods, in the server order',
      methods: [entra, google],
      wantForm: false,
      wantButtons: ['Sign in with Lakeside staff', 'Sign in with Google'],
    },
    { name: 'no method', methods: [], wantForm: false, wantButtons: [] },
  ];
  for (const tt of shapes) {
    it(tt.name, async () => {
      const page = await pageOver(server({ methods: { methods: tt.methods, pending: pendingRoutes } }));
      expect(sent(page.transport)).toEqual(['GET /console/api/user/methods']);
      expect(page.element.querySelector('input[name="username"]') !== null).toBe(tt.wantForm);
      expect(page.element.querySelector('input[name="password"]') !== null).toBe(tt.wantForm);
      expect(buttonsOf(page)).toEqual(tt.wantButtons);
      expect(messageOf(page)).toBeNull();
      expect(page.element.querySelector('.ccc-login-pending')).toBeNull();
    });
  }

  it('shows nothing before the list answers', async () => {
    const transport = scriptedTransport(() => new Promise<TransportResponse>(() => undefined));
    await TestBed.configureTestingModule({
      imports: [LoginMethodsComponent],
      providers: [
        provideResourceTesting({
          transport,
          client: (t) => createClient(descriptor, { baseUrl: '/console/api', transport: t }),
        }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginMethodsComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelectorAll('button')).toHaveLength(0);
  });

  it("takes the application's label for a method by its registration name, the server's otherwise", async () => {
    const page = await pageOver(server(), {}, { labels: { google: 'the fleet directory', password: 'Crew password' } });
    expect(buttonsOf(page)).toEqual(['Sign in with the fleet directory']);
    const labels = Array.from(page.element.querySelectorAll('mat-label')).map((label) => label.textContent?.trim());
    expect(labels).toEqual(['Username', 'Crew password']);
    expect(page.element.textContent).not.toContain('with Google');
  });

  it('renders the sentence held for a refusal code in the URL, and nothing for a code it does not know', async () => {
    const refused = await pageOver(server(), { code: 'no_roles' });
    expect(messageOf(refused)).toBe(DEFAULT_LOGIN_MESSAGES['no_roles']);
    TestBed.resetTestingModule();
    const directory = await pageOver(server(), { code: 'connection_not_in_tenant' });
    expect(messageOf(directory)).toBe(DEFAULT_LOGIN_MESSAGES['connection_not_in_tenant']);
    TestBed.resetTestingModule();
    const unknown = await pageOver(server(), { code: 'call 555-0100 for a password reset' });
    expect(messageOf(unknown)).toBeNull();
  });
});

describe('LoginMethodsComponent signs in with the password', () => {
  async function signIn(page: Page, username = 'overseer', secret = 'lodestar'): Promise<void> {
    page.component.username = username;
    page.component.password = secret;
    await page.component.login();
    await page.settle();
  }

  it('reads the list again, posts the credentials to the path the list names, checks the session and emits the page the guard recorded', async () => {
    const page = await pageOver(server());
    TestBed.inject(AuthService).redirectUrl.set('/missions/m-7');
    await signIn(page);
    const requests = sent(page.transport);
    expect(requests.slice(0, 3)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/methods',
      'POST /console/api/user/password/login',
    ]);
    expect(page.transport.requests[2].body).toEqual({ username: 'overseer', password: 'lodestar' });
    expect(requests.slice(3)).toContain('GET /console/api/user/session');
    expect(page.signedIn).toEqual(['/missions/m-7']);
    expect(TestBed.inject(AuthService).authenticated()).toBe(true);
    expect(TestBed.inject(AuthService).redirectUrl()).toBe('');
    expect(page.component.busy()).toBe(false);
    expect(page.component.password).toBe('');
  });

  it('emits home when the guard recorded no page, or recorded the login page itself', async () => {
    const page = await pageOver(server(), {}, { home: '/dashboard' });
    await signIn(page);
    TestBed.inject(AuthService).redirectUrl.set('/login?code=no_roles');
    await signIn(page);
    expect(page.signedIn).toEqual(['/dashboard', '/dashboard']);
  });

  const refusals: { name: string; answer: TransportResponse; want: string }[] = [
    {
      name: 'a refusal with a code the application holds a sentence for shows that sentence',
      answer: { status: 401, body: { message: 'User disabled', code: 'user_disabled' } },
      want: DEFAULT_LOGIN_MESSAGES['user_disabled'],
    },
    {
      name: "a wrong password shows the server's words",
      answer: { status: 401, body: { message: 'Invalid Credentials' } },
      want: 'Invalid Credentials',
    },
    {
      name: "a refusal with a code the application holds no sentence for shows the server's words",
      answer: { status: 403, body: { message: 'Ask the flight desk', code: 'not_provisioned' } },
      want: 'Ask the flight desk',
    },
    {
      name: 'a password refused because every organization of the person is directory only shows the sentence for directory_only',
      answer: { status: 403, body: { message: 'Sign-in denied', code: 'directory_only' } },
      want: DEFAULT_LOGIN_MESSAGES['directory_only'],
    },
    {
      name: 'a locked name shows the sentence held for the code the 429 body carries, with the wait in minutes',
      answer: {
        status: 429,
        body: { message: 'Too many sign-in attempts', code: 'too_many_attempts', retryAfter: 840 },
        headers: { 'retry-after': '840' },
      },
      want: `${DEFAULT_LOGIN_MESSAGES['too_many_attempts']} Try again in 14 minutes.`,
    },
    {
      name: 'a locked name with under a minute to wait shows the wait in seconds',
      answer: {
        status: 429,
        body: { message: 'Too many sign-in attempts', code: 'too_many_attempts', retryAfter: 45 },
        headers: { 'retry-after': '45' },
      },
      want: `${DEFAULT_LOGIN_MESSAGES['too_many_attempts']} Try again in 45 seconds.`,
    },
    {
      name: 'a locked name whose answer names no wait shows the sentence alone',
      answer: { status: 429, body: { message: 'Too many sign-in attempts', code: 'too_many_attempts' } },
      want: DEFAULT_LOGIN_MESSAGES['too_many_attempts'],
    },
  ];
  for (const tt of refusals) {
    it(tt.name, async () => {
      const page = await pageOver(server({ login: tt.answer }));
      await signIn(page, 'overseer', 'wrong');
      expect(messageOf(page)).toBe(tt.want);
      expect(page.signedIn).toEqual([]);
      expect(sent(page.transport)).not.toContain('GET /console/api/user/session');
      expect(page.element.querySelector('input[name="password"]')).not.toBeNull();
      expect(page.component.busy()).toBe(false);
      // The refusal is rendered in place and raises no notice.
      expect(TestBed.inject(NotificationService).notifications()).toEqual([]);
    });
  }

  it("a refusal's sentence replaces the one the URL carried, and a later sign-in clears it", async () => {
    const page = await pageOver(server({ login: { status: 401, body: { message: 'Invalid Credentials' } } }), {
      code: 'no_roles',
    });
    expect(messageOf(page)).toBe(DEFAULT_LOGIN_MESSAGES['no_roles']);
    await signIn(page, 'overseer', 'wrong');
    expect(messageOf(page)).toBe('Invalid Credentials');
  });

  it("a server fault shows the server's words in place and leaves the form", async () => {
    const page = await pageOver(server({ login: { status: 500, body: { message: 'store unavailable' } } }));
    await signIn(page);
    expect(messageOf(page)).toBe('store unavailable');
    expect(page.component.busy()).toBe(false);
  });

  it('a sign-in the server holds moves to the confirmation step without a navigation', async () => {
    const page = await pageOver(
      server({ login: { status: 200, body: { mfaIsRequired: true } }, status: { status: 200, body: waiting } }),
    );
    await signIn(page);
    expect(sent(page.transport)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/methods',
      'POST /console/api/user/password/login',
      'GET /console/api/user/pending',
    ]);
    expect(page.left).toEqual([]);
    expect(page.signedIn).toEqual([]);
    expect(page.component.pending()).toEqual(waiting);
    expect(page.element.querySelector('input[name="confirmation"]')).not.toBeNull();
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    expect(page.element.textContent).toContain('nova@fleet.example');
  });

  it('a sign-in the server holds and names a page for sends the browser there', async () => {
    const page = await pageOver(
      server({ login: { status: 200, body: { mfaIsRequired: true, redirectUrl: '/console/mfa' } } }),
    );
    await signIn(page);
    expect(page.left).toEqual(['/console/mfa']);
    expect(sent(page.transport)).not.toContain('GET /console/api/user/pending');
  });

  it("a session check that finds no session shows the library's sentence", async () => {
    const page = await pageOver(server({ authenticated: false }));
    await signIn(page);
    expect(messageOf(page)).toBe(DEFAULT_LOGIN_MESSAGES['internal_error']);
    expect(page.signedIn).toEqual([]);
  });

  it('does nothing while a step is in flight, or when the list offers no password method', async () => {
    const page = await pageOver(server({ methods: { methods: [google], pending: pendingRoutes } }));
    await page.component.login();
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods']);
  });
});

describe('LoginMethodsComponent sends the browser to a redirect method', () => {
  it('names the page the guard recorded as the one to return to, as a browser path under the application mount', async () => {
    const unmount = mountedAt('/console/');
    try {
      const page = await pageOver(server());
      TestBed.inject(AuthService).redirectUrl.set('/missions?sector=anvil');
      page.component.signInThrough(google);
      expect(page.left).toEqual([
        `/console/api/user/google/login?returnUrl=${encodeURIComponent('/console/missions?sector=anvil')}`,
      ]);
    } finally {
      unmount();
    }
  });

  it('names home when the guard recorded no page', async () => {
    const page = await pageOver(server(), {}, { home: '/dashboard' });
    page.component.signInThrough(google);
    expect(page.left).toEqual([`/console/api/user/google/login?returnUrl=${encodeURIComponent('/dashboard')}`]);
  });

  it('does nothing while a step is in flight', async () => {
    const page = await pageOver(server());
    page.component.busy.set(true);
    page.component.signInThrough(google);
    expect(page.left).toEqual([]);
  });
});

describe('LoginMethodsComponent renders the pending step', () => {
  it('entered with ?pending=, reads the status after the list and shows the confirmation form', async () => {
    const page = await pageOver(server({ status: { status: 200, body: waiting } }), { pending: 'confirmation' });
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/pending']);
    expect(page.component.pending()).toEqual(waiting);
    expect(page.element.querySelector('.ccc-login-pending')).not.toBeNull();
    expect(page.element.querySelector('input[name="confirmation"]')).not.toBeNull();
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    expect(buttonsOf(page)).toEqual([]);
  });

  it('without ?pending= the status is not read', async () => {
    const page = await pageOver(server({ status: { status: 200, body: waiting } }));
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods']);
    expect(page.component.pending()).toBeUndefined();
  });

  it('a step the server reports as expired shows the list with the sentence for pending_expired', async () => {
    const page = await pageOver(
      server({
        status: { status: 401, body: { message: 'the pending sign-in has expired', code: 'pending_expired' } },
      }),
      { pending: 'confirmation' },
    );
    expect(page.component.pending()).toBeUndefined();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(messageOf(page)).toBe(DEFAULT_LOGIN_MESSAGES['pending_expired']);
  });

  it('a step the server no longer holds shows the list alone', async () => {
    const page = await pageOver(server(), { pending: 'confirmation' });
    expect(page.component.pending()).toBeUndefined();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(messageOf(page)).toBeNull();
  });

  it('a step other than the confirmation shows a note and the cancel', async () => {
    const page = await pageOver(
      server({ status: { status: 200, body: { ...waiting, reason: 'mfa', factors: ['totp'] } } }),
      {
        pending: 'mfa',
      },
    );
    expect(page.element.querySelector('input[name="confirmation"]')).toBeNull();
    expect(page.element.textContent).toContain('another step');
    expect(page.element.querySelector('button.ccc-login-cancel')).not.toBeNull();
  });

  async function confirmWith(page: Page, secret: string): Promise<void> {
    page.component.confirmation = secret;
    await page.component.confirm();
    await page.settle();
  }

  it('confirms with the password after reading the list again, checks the session and emits the page the sign-in returns to', async () => {
    const page = await pageOver(server({ status: { status: 200, body: waiting } }), { pending: 'confirmation' });
    await confirmWith(page, 'lodestar');
    const requests = sent(page.transport);
    expect(requests.slice(2, 5)).toEqual([
      'GET /console/api/user/methods',
      'POST /console/api/user/pending/confirm',
      'GET /console/api/user/session',
    ]);
    expect(page.transport.requests[3].body).toEqual({ password: 'lodestar' });
    // The application is mounted at the root here, so the path the server reports is the router URL.
    expect(page.signedIn).toEqual(['/console/missions']);
    expect(page.component.pending()).toBeUndefined();
  });

  it('turns the page the server reports into a router URL under the application mount', async () => {
    const unmount = mountedAt('/console/');
    try {
      const page = await pageOver(
        server({ status: { status: 200, body: { ...waiting, returnUrl: '/console/missions/m-7' } } }),
        {
          pending: 'confirmation',
        },
      );
      await confirmWith(page, 'lodestar');
      expect(page.signedIn).toEqual(['/missions/m-7']);
    } finally {
      unmount();
    }
  });

  it('hands on a page the server reports outside the application mount as it is', async () => {
    const unmount = mountedAt('/console/');
    try {
      const page = await pageOver(
        server({ status: { status: 200, body: { ...waiting, returnUrl: '/portal/tracker' } } }),
        {
          pending: 'confirmation',
        },
      );
      await confirmWith(page, 'lodestar');
      expect(page.signedIn).toEqual(['/portal/tracker']);
    } finally {
      unmount();
    }
  });

  it('emits home when the sign-in had no page to return to', async () => {
    const page = await pageOver(
      server({ status: { status: 200, body: { ...waiting, returnUrl: '' } } }),
      { pending: 'confirmation' },
      {
        home: '/dashboard',
      },
    );
    await confirmWith(page, 'lodestar');
    expect(page.signedIn).toEqual(['/dashboard']);
  });

  it("a wrong password shows the server's words and keeps the step", async () => {
    const page = await pageOver(
      server({
        status: { status: 200, body: waiting },
        confirm: { status: 401, body: { message: 'Invalid Credentials' } },
      }),
      { pending: 'confirmation' },
    );
    await confirmWith(page, 'wrong');
    expect(messageOf(page)).toBe('Invalid Credentials');
    expect(page.component.pending()).toEqual(waiting);
    expect(page.element.querySelector('input[name="confirmation"]')).not.toBeNull();
  });

  it('a locked name shows the sentence for the code the 429 body carries, with the wait, and keeps the step', async () => {
    const page = await pageOver(
      server({
        status: { status: 200, body: waiting },
        confirm: {
          status: 429,
          body: { message: 'Too many sign-in attempts', code: 'too_many_attempts', retryAfter: 840 },
          headers: { 'retry-after': '840' },
        },
      }),
      { pending: 'confirmation' },
    );
    await confirmWith(page, 'wrong');
    expect(messageOf(page)).toBe(`${DEFAULT_LOGIN_MESSAGES['too_many_attempts']} Try again in 14 minutes.`);
    expect(page.component.pending()).toEqual(waiting);
    expect(page.element.querySelector('input[name="confirmation"]')).not.toBeNull();
    expect(TestBed.inject(NotificationService).notifications()).toEqual([]);
  });

  const endings: { name: string; answer: TransportResponse; want: string }[] = [
    {
      name: 'an expired step returns to the list with its sentence',
      answer: { status: 401, body: { message: 'the pending sign-in has expired', code: 'pending_expired' } },
      want: DEFAULT_LOGIN_MESSAGES['pending_expired'],
    },
    {
      name: "a step the server no longer holds returns to the list with the server's words",
      answer: { status: 404, body: { message: 'no pending sign-in' } },
      want: 'no pending sign-in',
    },
    {
      name: "a step the sign-in does not wait for returns to the list with the server's words",
      answer: { status: 409, body: { message: 'the pending sign-in does not wait for a password confirmation' } },
      want: 'the pending sign-in does not wait for a password confirmation',
    },
  ];
  for (const tt of endings) {
    it(tt.name, async () => {
      const page = await pageOver(server({ status: { status: 200, body: waiting }, confirm: tt.answer }), {
        pending: 'confirmation',
      });
      await confirmWith(page, 'lodestar');
      expect(messageOf(page)).toBe(tt.want);
      expect(page.component.pending()).toBeUndefined();
      expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    });
  }

  it('a confirmation the policy holds again for MFA reads the status again', async () => {
    const state = server({
      status: { status: 200, body: waiting },
      confirm: { status: 200, body: { mfaIsRequired: true } },
    });
    const page = await pageOver(state, { pending: 'confirmation' });
    state.status = { status: 200, body: { ...waiting, reason: 'mfa' } };
    await confirmWith(page, 'lodestar');
    expect(page.component.pending()?.reason).toBe('mfa');
    expect(page.signedIn).toEqual([]);
  });

  it('cancels through the cancel route after reading the list again, returns to the list and says so', async () => {
    const page = await pageOver(server({ status: { status: 200, body: waiting } }), { pending: 'confirmation' });
    await page.component.cancel();
    await page.settle();
    expect(sent(page.transport).slice(2)).toEqual([
      'GET /console/api/user/methods',
      'POST /console/api/user/pending/cancel',
    ]);
    expect(page.component.pending()).toBeUndefined();
    expect(page.cancelled).toBe(1);
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });
});

describe('LoginMethodsComponent changes a password the operator set', () => {
  async function signIn(page: Page): Promise<void> {
    page.component.username = 'overseer';
    page.component.password = 'lodestar';
    await page.component.login();
    await page.settle();
  }

  async function change(page: Page, oldPassword: string, newPassword: string, again = newPassword): Promise<void> {
    page.component.oldPassword = oldPassword;
    page.component.newPassword = newPassword;
    page.component.newPasswordAgain = again;
    await page.component.changePassword();
    await page.settle();
  }

  const fieldsOf = (page: Page): string[] =>
    Array.from(page.element.querySelectorAll<HTMLInputElement>('input')).map((input) => input.name);

  it('a sign-in whose session must change its password renders the change form in the list\'s place, loads nothing and emits nothing', async () => {
    const page = await pageOver(server({ passwordChangeRequired: true }));
    TestBed.inject(AuthService).redirectUrl.set('/missions/m-7');
    await signIn(page);
    expect(page.signedIn).toEqual([]);
    expect(page.component.changing()).toBe(true);
    expect(fieldsOf(page)).toEqual(['oldPassword', 'newPassword', 'newPasswordAgain']);
    expect(buttonsOf(page)).toEqual([]);
    expect(page.element.querySelector('.ccc-login-change-note')?.textContent?.trim()).toBe(
      DEFAULT_LOGIN_MESSAGES['password_change_required'],
    );
    expect(sent(page.transport)).not.toContain('GET /console/api/permission-digest');
    expect(TestBed.inject(AuthService).authenticated()).toBe(true);
    expect(page.component.password).toBe('');
  });

  it('two new passwords that differ are refused on the page, with no request', async () => {
    const page = await pageOver(server({ passwordChangeRequired: true }));
    await signIn(page);
    const before = sent(page.transport).length;
    await change(page, 'lodestar', 'anvil-run-9', 'anvil-run-8');
    expect(sent(page.transport)).toHaveLength(before);
    expect(messageOf(page)).toBe(PASSWORDS_DIFFER);
    expect(page.component.changing()).toBe(true);
  });

  it('a change the server accepts reads the list again, posts to the change path, checks the session and emits the page recorded at the sign-in', async () => {
    const page = await pageOver(server({ passwordChangeRequired: true }));
    TestBed.inject(AuthService).redirectUrl.set('/missions/m-7');
    await signIn(page);
    const before = sent(page.transport).length;
    await change(page, 'lodestar', 'anvil-run-9');
    const requests = sent(page.transport).slice(before);
    expect(requests.slice(0, 2)).toEqual(['GET /console/api/user/methods', `POST ${changePath}`]);
    expect(page.transport.requests[before + 1].body).toEqual({ oldPassword: 'lodestar', newPassword: 'anvil-run-9' });
    expect(requests.slice(2)).toContain('GET /console/api/user/session');
    expect(requests.slice(2)).toContain('GET /console/api/permission-digest');
    expect(page.signedIn).toEqual(['/missions/m-7']);
    expect(page.component.changing()).toBe(false);
    expect(page.component.oldPassword).toBe('');
    expect(page.component.newPassword).toBe('');
    expect(messageOf(page)).toBeNull();
  });

  const refusals: { name: string; answer: TransportResponse; want: string }[] = [
    {
      name: "a refusal without a code shows the server's words",
      answer: { status: 400, body: { message: 'The new password must differ from the current one' } },
      want: 'The new password must differ from the current one',
    },
    {
      name: 'a refusal with a code the application holds a sentence for shows that sentence',
      answer: { status: 401, body: { message: 'User disabled', code: 'user_disabled' } },
      want: DEFAULT_LOGIN_MESSAGES['user_disabled'],
    },
  ];
  for (const tt of refusals) {
    it(tt.name, async () => {
      const page = await pageOver(server({ passwordChangeRequired: true, change: tt.answer }));
      await signIn(page);
      await change(page, 'wrong', 'anvil-run-9');
      expect(messageOf(page)).toBe(tt.want);
      expect(page.component.changing()).toBe(true);
      expect(page.signedIn).toEqual([]);
    });
  }

  it('cancelling the change ends the session, shows the list again and emits cancelled', async () => {
    const page = await pageOver(server({ passwordChangeRequired: true }));
    await signIn(page);
    await page.component.cancelChange();
    await page.settle();
    expect(sent(page.transport)).toContain('DELETE /console/api/user/session');
    expect(page.component.changing()).toBe(false);
    expect(fieldsOf(page)).toEqual(['username', 'password']);
    expect(buttonsOf(page)).toEqual(['Sign in with Google']);
    expect(page.cancelled).toBe(1);
    expect(TestBed.inject(AuthService).authenticated()).toBe(false);
  });
});
