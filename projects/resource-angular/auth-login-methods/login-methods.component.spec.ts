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
// the page recorded at the sign-in is emitted once the change is accepted. The mailed links
// arrive here with their token: an invitation is opened and stands over the list until a
// sign-in, an acceptance or an account with a password accepts it; a sign-up link opens the
// account form; a confirmation link is posted once a session stands. The component ends no
// session on arrival: with nothing in the URL it asks for the session, and one standing is
// offered Continue or Sign out in the list's place. With a step or a link in the URL, a
// progress bar holds the list back until the reads have answered, so a person found signed
// in moves straight on and is never shown a form. Every POST is preceded by a read of the
// list, so it carries a live XSRF token.

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
const invitationRoutes = {
  open: '/console/api/user/invitation',
  accept: '/console/api/user/invitation/accept',
  signUp: '/console/api/user/invitation/sign-up',
};
const emailRoutes = { add: '/console/api/user/email', verify: '/console/api/user/email/verify' };
const signUpRoutes = {
  start: '/console/api/user/sign-up',
  open: '/console/api/user/sign-up/open',
  complete: '/console/api/user/sign-up/complete',
};
/** The list of a server that sends mail: invitations, the address step and an open sign-up. */
const mailingList: LoginMethods = {
  ...consoleList,
  invitation: invitationRoutes,
  email: emailRoutes,
  signUp: signUpRoutes,
};
const invited = {
  email: 'ensign@fleet.example',
  tenant: 'anvil',
  expiresAt: '2026-10-30T12:00:00Z',
  signUp: true,
  usernameIsEmail: false,
};
const dead = { status: 404, body: { message: 'the link has expired or was already used' } };
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
  invitationOpen: TransportResponse;
  invitationAccept: TransportResponse;
  invitationSignUp: TransportResponse;
  emailVerify: TransportResponse;
  signUpStart: TransportResponse;
  signUpOpen: TransportResponse;
  signUpComplete: TransportResponse;
  authenticated: boolean;
  /** The session's operator-set password must change before anything else is served. */
  passwordChangeRequired: boolean;
  /** The browser arrives signed in: the session read answers authenticated before any sign-in. */
  arrivesSignedIn: boolean;
}

function server(overrides: Partial<Server> = {}): Server {
  return {
    methods: consoleList,
    login: { status: 200, body: { mfaIsRequired: false } },
    status: { status: 404, body: { message: 'no pending sign-in' } },
    confirm: { status: 200, body: { mfaIsRequired: false } },
    change: { status: 200, body: undefined },
    invitationOpen: { status: 200, body: invited },
    invitationAccept: { status: 200, body: { accepted: true } },
    invitationSignUp: { status: 200, body: { mfaIsRequired: false } },
    emailVerify: { status: 200, body: { email: 'pax@fleet.example' } },
    signUpStart: { status: 200, body: {} },
    signUpOpen: { status: 200, body: { email: 'rookie@fleet.example', usernameIsEmail: false } },
    signUpComplete: { status: 200, body: { mfaIsRequired: false } },
    authenticated: true,
    passwordChangeRequired: false,
    arrivesSignedIn: false,
    ...overrides,
  };
}

function transportOf(state: Server): ScriptedTransport {
  // The session stands once a sign-in step was answered, or from the start when the browser arrives signed in.
  let signedIn = state.arrivesSignedIn;
  const signsIn = (answer: TransportResponse): TransportResponse => {
    if (answer.status < 400) {
      signedIn = true;
    }
    return answer;
  };
  return scriptedTransport((request: TransportRequest) => {
    const path = request.url.replace(/\?.*$/, '');
    switch (`${request.method} ${path}`) {
      case 'GET /console/api/user/methods':
        return { status: 200, body: state.methods };
      case 'POST /console/api/user/password/login':
        return signsIn(state.login);
      case `POST ${invitationRoutes.open}`:
        return state.invitationOpen;
      case `POST ${invitationRoutes.accept}`:
        return state.invitationAccept;
      case `POST ${invitationRoutes.signUp}`:
        return signsIn(state.invitationSignUp);
      case `POST ${emailRoutes.verify}`:
        return state.emailVerify;
      case `POST ${signUpRoutes.start}`:
        return state.signUpStart;
      case `POST ${signUpRoutes.open}`:
        return state.signUpOpen;
      case `POST ${signUpRoutes.complete}`:
        return signsIn(state.signUpComplete);
      case 'GET /console/api/user/pending':
        return state.status;
      case 'POST /console/api/user/pending/confirm':
        return signsIn(state.confirm);
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
            authenticated: state.authenticated && signedIn,
            username: 'overseer',
            passwordChangeRequired: state.passwordChangeRequired,
          },
        };
      case 'DELETE /console/api/user/session':
        state.authenticated = false;
        signedIn = false;
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

/** The component over the transport, arrived with the query, before its first change detection. */
async function mount(
  transport: ScriptedTransport,
  query: Record<string, string> = {},
  inputs: Record<string, unknown> = {},
): Promise<Page> {
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
  return page;
}

/** The component over the server, arrived with the query, settled. */
async function pageOver(
  state: Server,
  query: Record<string, string> = {},
  inputs: Record<string, unknown> = {},
): Promise<Page> {
  const page = await mount(transportOf(state), query, inputs);
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
      expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
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
    // The arrival reads the list and asks for the session; the sign-in reads the list again and posts.
    expect(requests.slice(0, 4)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/session',
      'GET /console/api/user/methods',
      'POST /console/api/user/password/login',
    ]);
    expect(page.transport.requests[3].body).toEqual({ username: 'overseer', password: 'lodestar' });
    expect(requests.slice(4)).toContain('GET /console/api/user/session');
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
      // The arrival's session read alone: a refused sign-in checks no session.
      expect(sent(page.transport).filter((request) => request === 'GET /console/api/user/session')).toHaveLength(1);
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
      'GET /console/api/user/session',
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
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
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
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
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

  it("a sign-in whose session must change its password renders the change form in the list's place, loads nothing and emits nothing", async () => {
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

describe('LoginMethodsComponent renders the password form for a username that is the address', () => {
  it('asks for the email address, as an email field, and otherwise for a username', async () => {
    const page = await pageOver(server({ methods: { ...consoleList, usernameIsEmail: true } }));
    const field = page.element.querySelector<HTMLInputElement>('input[name="username"]');
    expect(field?.type).toBe('email');
    expect(Array.from(page.element.querySelectorAll('mat-label')).map((label) => label.textContent?.trim())).toEqual([
      'Email address',
      'Password',
    ]);
    TestBed.resetTestingModule();
    const plain = await pageOver(server());
    expect(plain.element.querySelector<HTMLInputElement>('input[name="username"]')?.type).toBe('text');
  });
});

describe('LoginMethodsComponent opens an invitation', () => {
  const noteOf = (page: Page): string | null =>
    page.element.querySelector('.ccc-login-invitation-note')?.textContent?.trim() ?? null;

  it('entered with ?invitation=, posts the token after the list and keeps the invitation over the list, checking for a session', async () => {
    const page = await pageOver(server({ methods: mailingList }), { invitation: 'tok-1' });
    expect(sent(page.transport)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/methods',
      `POST ${invitationRoutes.open}`,
      'GET /console/api/user/session',
    ]);
    expect(page.transport.requests[2].body).toEqual({ token: 'tok-1' });
    expect(page.component.invitation()).toEqual(invited);
    expect(noteOf(page)).toBe(
      'ensign@fleet.example is invited to anvil. Sign in to accept it, or create an account with a password.',
    );
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(buttonsOf(page)).toEqual(['Sign in with Google']);
    expect(page.element.querySelector('.ccc-login-create-account')).not.toBeNull();
    expect(page.element.querySelector('.ccc-login-accept')).toBeNull();
    // The open sign-up's own step steps aside while an invitation stands.
    expect(page.element.querySelector('.ccc-login-sign-up')).toBeNull();
  });

  it('words a global invitation without a tenant, and one without a password method without the account', async () => {
    const page = await pageOver(
      server({
        methods: { ...mailingList, invitation: { open: invitationRoutes.open, accept: invitationRoutes.accept } },
        invitationOpen: { status: 200, body: { ...invited, tenant: '', signUp: false } },
      }),
      { invitation: 'tok-1' },
    );
    expect(noteOf(page)).toBe('ensign@fleet.example is invited. Sign in to accept it.');
    expect(page.element.querySelector('.ccc-login-create-account')).toBeNull();
  });

  it("a dead link shows the server's words and the list alone", async () => {
    const page = await pageOver(server({ methods: mailingList, invitationOpen: dead }), { invitation: 'tok-dead' });
    expect(page.component.invitation()).toBeUndefined();
    expect(messageOf(page)).toBe(dead.body.message);
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(sent(page.transport)).not.toContain('GET /console/api/user/session');
  });

  it('a password sign-in accepts it: the session is checked, the page emitted, and the note gone', async () => {
    const page = await pageOver(server({ methods: mailingList }), { invitation: 'tok-1' }, { home: '/dashboard' });
    page.component.username = 'ensign';
    page.component.password = 'orbit-and-anchor';
    await page.component.login();
    await page.settle();
    expect(page.signedIn).toEqual(['/dashboard']);
    expect(page.component.invitation()).toBeUndefined();
  });

  it('a person found signed in is offered to accept it as they are; the acceptance posts, checks the session and emits the page', async () => {
    const page = await pageOver(
      server({ methods: mailingList, arrivesSignedIn: true }),
      { invitation: 'tok-1' },
      { home: '/dashboard' },
    );
    expect(page.component.signedInAs()).toBe('overseer');
    const accept = page.element.querySelector<HTMLButtonElement>('.ccc-login-accept');
    expect(accept?.textContent?.trim()).toBe('Accept as overseer');
    page.transport.requests.length = 0;
    await page.component.accept();
    await page.settle();
    expect(sent(page.transport).slice(0, 3)).toEqual([
      'GET /console/api/user/methods',
      `POST ${invitationRoutes.accept}`,
      'GET /console/api/user/session',
    ]);
    expect(page.signedIn).toEqual(['/dashboard']);
    expect(page.component.invitation()).toBeUndefined();
  });

  it('an acceptance the server refuses, the invitation gone, shows its words and drops the note', async () => {
    const page = await pageOver(
      server({
        methods: mailingList,
        arrivesSignedIn: true,
        invitationAccept: { status: 404, body: { message: 'the browser carries no live invitation' } },
      }),
      { invitation: 'tok-1' },
    );
    await page.component.accept();
    await page.settle();
    expect(messageOf(page)).toBe('the browser carries no live invitation');
    expect(page.component.invitation()).toBeUndefined();
    expect(page.signedIn).toEqual([]);
  });

  it('the account form takes a username and the password twice, posts them to the sign-up route and follows the sign-in', async () => {
    const page = await pageOver(server({ methods: mailingList }), { invitation: 'tok-1' }, { home: '/dashboard' });
    page.component.openAccountForm();
    await page.settle();
    expect(page.component.account()).toEqual({
      source: 'invitation',
      email: 'ensign@fleet.example',
      usernameIsEmail: false,
    });
    expect(page.element.querySelector('input[name="accountUsername"]')).not.toBeNull();
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    expect(page.element.querySelector('.ccc-login-account-note')?.textContent?.trim()).toBe(
      'Choose a username and a password for your account. ensign@fleet.example is its email address.',
    );
    page.transport.requests.length = 0;
    page.component.accountUsername = 'ensign';
    page.component.accountPassword = 'orbit-and-anchor';
    page.component.accountPasswordAgain = 'orbit-and-anchor';
    await page.component.createAccount();
    await page.settle();
    expect(sent(page.transport).slice(0, 3)).toEqual([
      'GET /console/api/user/methods',
      `POST ${invitationRoutes.signUp}`,
      'GET /console/api/user/session',
    ]);
    expect(page.transport.requests[1].body).toEqual({ password: 'orbit-and-anchor', username: 'ensign' });
    expect(page.signedIn).toEqual(['/dashboard']);
    expect(page.component.account()).toBeUndefined();
    expect(page.component.accountPassword).toBe('');
  });

  it('the account form asks for no username where the username is the address, and posts none', async () => {
    const page = await pageOver(
      server({ methods: mailingList, invitationOpen: { status: 200, body: { ...invited, usernameIsEmail: true } } }),
      { invitation: 'tok-1' },
    );
    page.component.openAccountForm();
    await page.settle();
    expect(page.element.querySelector('input[name="accountUsername"]')).toBeNull();
    expect(page.element.querySelector('.ccc-login-account-note')?.textContent?.trim()).toBe(
      'Choose a password for your account. You will sign in as ensign@fleet.example.',
    );
    page.transport.requests.length = 0;
    page.component.accountPassword = 'orbit-and-anchor';
    page.component.accountPasswordAgain = 'orbit-and-anchor';
    await page.component.createAccount();
    expect(page.transport.requests[1].body).toEqual({ password: 'orbit-and-anchor' });
  });

  it('two passwords that differ are refused without a request; a taken name is shown on the form; a gone invitation returns to the list', async () => {
    const state = server({ methods: mailingList });
    const page = await pageOver(state, { invitation: 'tok-1' });
    page.component.openAccountForm();
    page.transport.requests.length = 0;
    page.component.accountPassword = 'one';
    page.component.accountPasswordAgain = 'two';
    await page.component.createAccount();
    await page.settle();
    expect(messageOf(page)).toBe(PASSWORDS_DIFFER);
    expect(page.transport.requests).toEqual([]);

    state.invitationSignUp = { status: 409, body: { message: 'the username is taken' } };
    page.component.accountPasswordAgain = 'one';
    await page.component.createAccount();
    await page.settle();
    expect(messageOf(page)).toBe('the username is taken');
    expect(page.component.account()).not.toBeUndefined();

    state.invitationSignUp = { status: 404, body: { message: 'the browser carries no live invitation' } };
    await page.component.createAccount();
    await page.settle();
    expect(messageOf(page)).toBe('the browser carries no live invitation');
    expect(page.component.account()).toBeUndefined();
    expect(page.component.invitation()).toBeUndefined();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });

  it('cancelling the account form shows the list with the invitation still standing, and emits cancelled', async () => {
    const page = await pageOver(server({ methods: mailingList }), { invitation: 'tok-1' });
    page.component.openAccountForm();
    page.component.cancelAccount();
    await page.settle();
    expect(page.component.account()).toBeUndefined();
    expect(page.component.invitation()).toEqual(invited);
    expect(page.cancelled).toBe(1);
  });
});

describe('LoginMethodsComponent signs a person up', () => {
  it('offers the step when the list names sign-up routes, asks for the address, posts it and says the link is on its way', async () => {
    const page = await pageOver(server({ methods: mailingList }));
    expect(page.element.querySelector('.ccc-login-sign-up')).not.toBeNull();
    page.component.beginSignUp();
    await page.settle();
    expect(page.element.querySelector('input[name="signUpEmail"]')).not.toBeNull();
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    page.transport.requests.length = 0;
    page.component.signUpEmail = 'rookie@fleet.example';
    await page.component.sendSignUpLink();
    await page.settle();
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', `POST ${signUpRoutes.start}`]);
    expect(page.transport.requests[1].body).toEqual({ email: 'rookie@fleet.example' });
    expect(page.component.started()).toBe('rookie@fleet.example');
    expect(page.element.querySelector('.ccc-login-started-note')?.textContent).toContain('rookie@fleet.example');
    page.component.backToSignIn();
    await page.settle();
    expect(page.component.started()).toBeUndefined();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(page.cancelled).toBe(1);
  });

  it('is not offered when the list names no sign-up routes', async () => {
    const page = await pageOver(server());
    expect(page.element.querySelector('.ccc-login-sign-up')).toBeNull();
    page.component.beginSignUp();
    await page.settle();
    expect(page.component.starting()).toBe(false);
  });

  it('a mailbox sent too many links is refused with the sentence and the wait, the address field staying', async () => {
    const page = await pageOver(
      server({
        methods: mailingList,
        signUpStart: { status: 429, body: { message: 'Too many links', code: 'too_many_attempts', retryAfter: 600 } },
      }),
    );
    page.component.beginSignUp();
    page.component.signUpEmail = 'rookie@fleet.example';
    await page.component.sendSignUpLink();
    await page.settle();
    expect(messageOf(page)).toBe(`${DEFAULT_LOGIN_MESSAGES['too_many_attempts']} Try again in 10 minutes.`);
    expect(page.component.starting()).toBe(true);
  });

  it('entered with ?signUp=, opens the link after the list and renders the account form, which completes the sign-up with the token', async () => {
    const page = await pageOver(server({ methods: mailingList }), { signUp: 'tok-s' }, { home: '/dashboard' });
    expect(sent(page.transport)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/methods',
      `POST ${signUpRoutes.open}`,
    ]);
    expect(page.component.account()).toEqual({
      source: 'signUp',
      token: 'tok-s',
      email: 'rookie@fleet.example',
      usernameIsEmail: false,
    });
    expect(page.element.querySelector('input[name="accountUsername"]')).not.toBeNull();
    page.transport.requests.length = 0;
    page.component.accountUsername = 'rookie';
    page.component.accountPassword = 'orbit-and-anchor';
    page.component.accountPasswordAgain = 'orbit-and-anchor';
    await page.component.createAccount();
    await page.settle();
    expect(sent(page.transport).slice(0, 3)).toEqual([
      'GET /console/api/user/methods',
      `POST ${signUpRoutes.complete}`,
      'GET /console/api/user/session',
    ]);
    expect(page.transport.requests[1].body).toEqual({
      token: 'tok-s',
      password: 'orbit-and-anchor',
      username: 'rookie',
    });
    expect(page.signedIn).toEqual(['/dashboard']);
  });

  it("a dead sign-up link shows the server's words and the list", async () => {
    const page = await pageOver(server({ methods: mailingList, signUpOpen: dead }), { signUp: 'tok-dead' });
    expect(page.component.account()).toBeUndefined();
    expect(messageOf(page)).toBe(dead.body.message);
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });
});

describe('LoginMethodsComponent confirms an email address', () => {
  /** The requests of the journey itself, without the digest, domains and flags the first authenticated session read loads. */
  const stepsOf = (page: Page): string[] =>
    sent(page.transport).filter((request) => !/permission-digest|user-domains|features/.test(request));

  it('entered with ?verify= signed out, waits for the sign-in, then posts the token, shows the address and emits the page on Continue', async () => {
    const page = await pageOver(server({ methods: mailingList }), { verify: 'tok-v' }, { home: '/dashboard' });
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
    expect(page.component.landed()).toBeUndefined();
    page.transport.requests.length = 0;
    page.component.username = 'pax';
    page.component.password = 'lodestar';
    await page.component.login();
    await page.settle();
    // The first authenticated session read also loads the digest, the domains and the flags.
    expect(stepsOf(page)).toEqual([
      'GET /console/api/user/methods',
      'POST /console/api/user/password/login',
      'GET /console/api/user/session',
      'GET /console/api/user/methods',
      `POST ${emailRoutes.verify}`,
      'GET /console/api/user/session',
    ]);
    expect(page.transport.requests.find((r) => r.url === emailRoutes.verify)?.body).toEqual({ token: 'tok-v' });
    expect(page.signedIn).toEqual([]);
    expect(page.component.verified()).toBe('pax@fleet.example');
    expect(page.element.querySelector('.ccc-login-landed-note')?.textContent?.trim()).toBe(
      'pax@fleet.example is confirmed as your email address.',
    );
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    page.component.proceed();
    await page.settle();
    expect(page.signedIn).toEqual(['/dashboard']);
    expect(page.component.landed()).toBeUndefined();
  });

  it('entered with ?verify= signed in, posts the token at once', async () => {
    const page = await pageOver(server({ methods: mailingList, arrivesSignedIn: true }), { verify: 'tok-v' });
    expect(stepsOf(page)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/session',
      'GET /console/api/user/session',
      'GET /console/api/user/methods',
      `POST ${emailRoutes.verify}`,
      'GET /console/api/user/session',
    ]);
    expect(page.component.verified()).toBe('pax@fleet.example');
    expect(page.component.landed()).toBe('/');
  });

  it("a dead or another account's link shows the server's words with Continue, the session standing", async () => {
    const page = await pageOver(server({ methods: mailingList, arrivesSignedIn: true, emailVerify: dead }), {
      verify: 'tok-v',
    });
    expect(page.component.verified()).toBeUndefined();
    expect(messageOf(page)).toBe(dead.body.message);
    expect(page.element.querySelector('.ccc-login-continue')).not.toBeNull();
    page.component.proceed();
    expect(page.signedIn).toEqual(['/']);
  });

  it('a redirect method returns to this page with the token, so the confirmation follows the round trip', async () => {
    const page = await pageOver(server({ methods: mailingList }), { verify: 'tok-v' });
    page.component.signInThrough(google);
    expect(page.left).toEqual([
      `/console/api/user/google/login?returnUrl=${encodeURIComponent('/login?verify=tok-v')}`,
    ]);
  });
});

describe('LoginMethodsComponent finds a session standing', () => {
  const noteOf = (page: Page): string | null =>
    page.element.querySelector('.ccc-login-signed-in-note')?.textContent?.trim() ?? null;
  /** The requests of the journey itself, without the digest, domains and flags the first authenticated session read loads. */
  const stepsOf = (page: Page): string[] =>
    sent(page.transport).filter((request) => !/permission-digest|user-domains|features/.test(request));

  it("arriving with nothing in the URL, asks for the session after the list; one standing takes the list's place with Continue and Sign out", async () => {
    const page = await pageOver(server({ arrivesSignedIn: true }));
    expect(stepsOf(page)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
    expect(page.component.signedInAlone()).toBe('overseer');
    expect(noteOf(page)).toBe('You are signed in as overseer.');
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    expect(buttonsOf(page)).toEqual([]);
    expect(page.element.querySelector('.ccc-login-continue')).not.toBeNull();
    expect(page.element.querySelector('.ccc-login-sign-out')).not.toBeNull();
    expect(page.signedIn).toEqual([]);
  });

  it('arriving signed out, shows the list alone', async () => {
    const page = await pageOver(server());
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
    expect(page.component.signedInAlone()).toBeUndefined();
    expect(noteOf(page)).toBeNull();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });

  it('Continue checks the session again and emits the page the guard recorded, else home', async () => {
    const page = await pageOver(server({ arrivesSignedIn: true }), {}, { home: '/dashboard' });
    page.transport.requests.length = 0;
    await page.component.continueAs();
    await page.settle();
    expect(sent(page.transport)).toEqual(['GET /console/api/user/session']);
    expect(page.signedIn).toEqual(['/dashboard']);
    expect(page.component.signedInAlone()).toBeUndefined();
  });

  it('Continue goes to the page the guard recorded', async () => {
    const page = await pageOver(server({ arrivesSignedIn: true }), {}, { home: '/dashboard' });
    TestBed.inject(AuthService).redirectUrl.set('/missions/m-7');
    await page.component.continueAs();
    expect(page.signedIn).toEqual(['/missions/m-7']);
  });

  it('a recorded page that is the sign-out page itself counts as none', async () => {
    const page = await pageOver(server({ arrivesSignedIn: true }), {}, { home: '/dashboard' });
    TestBed.inject(AuthService).redirectUrl.set('/logout');
    await page.component.continueAs();
    expect(page.signedIn).toEqual(['/dashboard']);
  });

  it('Sign out ends the session and shows the list, so the form posts on no session', async () => {
    const page = await pageOver(server({ arrivesSignedIn: true }));
    page.transport.requests.length = 0;
    await page.component.signOut();
    await page.settle();
    expect(sent(page.transport)).toEqual(['DELETE /console/api/user/session']);
    expect(page.component.signedInAlone()).toBeUndefined();
    expect(noteOf(page)).toBeNull();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(page.signedIn).toEqual([]);
    expect(TestBed.inject(AuthService).authenticated()).toBe(false);
  });

  it('a session marked for a password change gets the change form on arrival, and the change emits home', async () => {
    const page = await pageOver(
      server({ arrivesSignedIn: true, passwordChangeRequired: true }),
      {},
      { home: '/dashboard' },
    );
    expect(page.component.changing()).toBe(true);
    expect(page.component.signedInAlone()).toBeUndefined();
    expect(page.element.querySelector('input[name="oldPassword"]')).not.toBeNull();
    page.component.oldPassword = 'set-by-operator';
    page.component.newPassword = 'mine';
    page.component.newPasswordAgain = 'mine';
    await page.component.changePassword();
    await page.settle();
    expect(page.signedIn).toEqual(['/dashboard']);
  });

  it('with a step or a link in the URL, the session is read for that alone', async () => {
    const page = await pageOver(server({ arrivesSignedIn: true, status: { status: 200, body: waiting } }), {
      pending: '1',
    });
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/pending']);
    expect(page.component.signedInAlone()).toBeUndefined();
  });

  it('does nothing while a step is in flight, or when no session stands', async () => {
    const page = await pageOver(server());
    page.transport.requests.length = 0;
    await page.component.continueAs();
    await page.component.signOut();
    expect(sent(page.transport)).toEqual([]);
  });
});

describe('LoginMethodsComponent holds the list back while a link in the URL is resolved', () => {
  /** A promise and the call that settles it. */
  function gate(): { opened: Promise<void>; open(): void } {
    let open = (): void => undefined;
    const opened = new Promise<void>((resolve) => {
      open = resolve;
    });
    return { opened, open };
  }

  /** The server's transport with its first session read held: `asked` settles when that read is sent, and `answer()` lets it through. */
  function holdingSession(state: Server): { transport: ScriptedTransport; asked: Promise<void>; answer(): void } {
    const inner = transportOf(state);
    const asked = gate();
    const answered = gate();
    let held = false;
    const transport = scriptedTransport(async (request: TransportRequest) => {
      if (!held && request.method === 'GET' && request.url === '/console/api/user/session') {
        held = true;
        asked.open();
        await answered.opened;
      }
      return inner(request);
    });
    return { transport, asked: asked.opened, answer: answered.open };
  }

  /** Counts every form added to the page from now on; the call returned stops counting and answers the count. */
  function formsAdded(page: Page): () => number {
    let count = 0;
    const countIn = (records: MutationRecord[]): void => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element && (node.matches('form') || node.querySelector('form') !== null)) {
            count++;
          }
        });
      }
    };
    const watcher = new MutationObserver(countIn);
    watcher.observe(page.element, { childList: true, subtree: true });
    return () => {
      countIn(watcher.takeRecords());
      watcher.disconnect();
      return count;
    };
  }

  /** The page arrived and the list answered, the first session read in flight: the bar on screen, nothing else. */
  async function arrivedAt(held: ReturnType<typeof holdingSession>, page: Page): Promise<void> {
    page.fixture.detectChanges();
    await held.asked;
    page.fixture.detectChanges();
    expect(page.component.arriving()).toBe(true);
    expect(barOf(page)).not.toBeNull();
    expect(page.element.querySelector('form')).toBeNull();
    expect(page.element.querySelectorAll('button')).toHaveLength(0);
  }

  const barOf = (page: Page): Element | null => page.element.querySelector('mat-progress-bar');

  it('with ?verify=, the password form is not in the DOM before the session read answers; the bar is', async () => {
    const held = holdingSession(server({ methods: mailingList }));
    const page = await mount(held.transport, { verify: 'tok-v' });
    page.fixture.detectChanges();
    // Before the list answers: the bar alone, set as the component arrives.
    expect(page.component.arriving()).toBe(true);
    expect(barOf(page)).not.toBeNull();
    expect(page.element.querySelector('form')).toBeNull();
    await held.asked;
    page.fixture.detectChanges();
    // The list has answered and the session read is in flight: still the bar alone.
    expect(sent(page.transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/session']);
    expect(barOf(page)).not.toBeNull();
    expect(page.element.querySelector('input[name="password"]')).toBeNull();
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    expect(page.element.querySelector('form')).toBeNull();
    expect(buttonsOf(page)).toEqual([]);
    held.answer();
    await page.settle();
    expect(barOf(page)).toBeNull();
  });

  it('with ?verify=, a session read that finds nobody signed in ends the bar and shows the form, which still waits for the sign-in', async () => {
    const held = holdingSession(server({ methods: mailingList }));
    const page = await mount(held.transport, { verify: 'tok-v' }, { home: '/dashboard' });
    await arrivedAt(held, page);
    held.answer();
    await page.settle();
    expect(page.component.arriving()).toBe(false);
    expect(barOf(page)).toBeNull();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
    expect(page.element.querySelector('input[name="password"]')).not.toBeNull();
    expect(buttonsOf(page)).toEqual(['Sign in with Google']);
    expect(page.component.landed()).toBeUndefined();
    expect(page.signedIn).toEqual([]);
    page.component.username = 'pax';
    page.component.password = 'lodestar';
    await page.component.login();
    await page.settle();
    expect(page.component.verified()).toBe('pax@fleet.example');
    expect(page.component.landed()).toBe('/dashboard');
  });

  it('with ?verify=, a session read that finds the person signed in moves straight on to the confirmation, with no form in between', async () => {
    const held = holdingSession(server({ methods: mailingList, arrivesSignedIn: true }));
    const page = await mount(held.transport, { verify: 'tok-v' }, { home: '/dashboard' });
    const forms = formsAdded(page);
    await arrivedAt(held, page);
    held.answer();
    await page.settle();
    expect(page.component.arriving()).toBe(false);
    expect(barOf(page)).toBeNull();
    expect(forms()).toBe(0);
    expect(page.element.querySelector('form')).toBeNull();
    expect(page.element.querySelector('input[name="username"]')).toBeNull();
    expect(page.component.verified()).toBe('pax@fleet.example');
    expect(page.component.landed()).toBe('/dashboard');
    expect(page.element.querySelector('.ccc-login-landed-note')?.textContent?.trim()).toBe(
      'pax@fleet.example is confirmed as your email address.',
    );
    expect(page.element.querySelector('.ccc-login-continue')).not.toBeNull();
    expect(sent(page.transport)).toContain(`POST ${emailRoutes.verify}`);
  });

  it('with ?invitation=, the bar stands until the invitation and the session are read, then the note and the form show', async () => {
    const held = holdingSession(server({ methods: mailingList }));
    const page = await mount(held.transport, { invitation: 'tok-1' });
    await arrivedAt(held, page);
    expect(page.element.querySelector('.ccc-login-invitation-note')).toBeNull();
    held.answer();
    await page.settle();
    expect(barOf(page)).toBeNull();
    expect(page.element.querySelector('.ccc-login-invitation-note')).not.toBeNull();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });

  it('with ?invitation=, a person found signed in is offered the acceptance once the reads answer, with no form shown before', async () => {
    const held = holdingSession(server({ methods: mailingList, arrivesSignedIn: true }));
    const page = await mount(held.transport, { invitation: 'tok-1' });
    const forms = formsAdded(page);
    await arrivedAt(held, page);
    held.answer();
    await page.settle();
    expect(barOf(page)).toBeNull();
    expect(page.element.querySelector('.ccc-login-accept')?.textContent?.trim()).toBe('Accept as overseer');
    // The form arrives with the acceptance, in one render, never before it.
    expect(forms()).toBe(1);
  });

  it('a plain arrival shows no bar: the list renders as soon as it answers', async () => {
    const page = await mount(transportOf(server()));
    page.fixture.detectChanges();
    expect(page.component.arriving()).toBe(false);
    expect(barOf(page)).toBeNull();
    await page.settle();
    expect(barOf(page)).toBeNull();
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });

  it("a dead link ends the bar and shows the server's words with the list", async () => {
    const page = await pageOver(server({ methods: mailingList, signUpOpen: dead }), { signUp: 'tok-dead' });
    expect(page.component.arriving()).toBe(false);
    expect(barOf(page)).toBeNull();
    expect(messageOf(page)).toBe(dead.body.message);
    expect(page.element.querySelector('input[name="username"]')).not.toBeNull();
  });
});
