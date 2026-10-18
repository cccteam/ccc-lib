import { describe, expect, it } from 'bun:test';
import { AuthClient, LoginMethod, LoginMethods, loginMethodsRoute, unknownKindWarning } from './auth';
import { createClient } from './client';
import { ApiDescriptor } from './descriptor';
import { ApiError, TransportRequest, TransportResponse } from './transport';
import { ScriptedTransport, scriptedTransport } from '@cccteam/resource/testing';

// The sign-in client's contract: the methods list is read from the route the generated
// router serves and kept for a page to render from, with a method of a kind the client
// cannot drive left out and announced once; a password sign-in reads the list again before
// it posts the credentials to the path the refreshed list names, so the POST carries a live
// XSRF token and never goes to a method the server no longer offers; a redirect method's
// URL names the page to return to; the pending sign-in's status, confirmation and cancel
// ride the routes the list names; and a refusal the server answers on a step resolves
// with its code and words, through no error hook, while every other failure throws.

const descriptor: ApiDescriptor = {
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
  resources: {},
  methods: {},
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
const pendingRoutes = {
  status: '/console/api/user/pending',
  confirm: '/console/api/user/pending/confirm',
  cancel: '/console/api/user/pending/cancel',
};
const consoleList: LoginMethods = { methods: [password, google], pending: pendingRoutes };

/** What the server answers each route with; a spec changes an entry to script a step's answer. */
interface Server {
  methods: unknown;
  login: TransportResponse;
  status: TransportResponse;
  confirm: TransportResponse;
  cancel: TransportResponse;
}

function server(overrides: Partial<Server> = {}): Server {
  return {
    methods: consoleList,
    login: { status: 200, body: { mfaIsRequired: false } },
    status: { status: 404, body: { message: 'no pending sign-in' } },
    confirm: { status: 200, body: { mfaIsRequired: false } },
    cancel: { status: 200, body: undefined },
    ...overrides,
  };
}

/** The server over a scripted transport, answering by method and path. */
function transportOf(state: Server): ScriptedTransport {
  return scriptedTransport((request: TransportRequest) => {
    const path = request.url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '');
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
        return state.cancel;
      default:
        return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
    }
  });
}

/** The client's sign-in client over the server, with the errors its hook saw and the warnings it raised. */
function authOver(
  state: Server,
  baseUrl = '/console/api',
): { auth: AuthClient; transport: ScriptedTransport; errors: ApiError[]; warnings: string[] } {
  const transport = transportOf(state);
  const errors: ApiError[] = [];
  const warnings: string[] = [];
  const client = createClient(descriptor, {
    baseUrl,
    transport,
    onError: (error) => errors.push(error),
    warn: (message) => warnings.push(message),
  });
  return { auth: client.auth, transport, errors, warnings };
}

const sent = (transport: ScriptedTransport): string[] => transport.requests.map((r) => `${r.method} ${r.url}`);

describe('the methods list', () => {
  it('is read from the methods route under the API prefix and kept for the page', async () => {
    const { auth, transport } = authOver(server());
    expect(auth.get()).toBeUndefined();
    const list = await auth.methods();
    expect(sent(transport)).toEqual([`GET /console/api/${loginMethodsRoute}`]);
    expect(list).toEqual(consoleList);
    expect(auth.get()).toEqual(consoleList);
  });

  it('tells its subscribers when it is read again', async () => {
    const { auth } = authOver(server());
    const seen: (LoginMethods | undefined)[] = [];
    auth.subscribe((list) => seen.push(list));
    await auth.methods();
    expect(seen).toEqual([consoleList]);
  });

  it('leaves out a method of a kind this client does not drive, announcing it once', async () => {
    const passkey = {
      name: 'passkey',
      method: 'passkey',
      kind: 'webauthn',
      label: 'Passkey',
      path: '/console/api/user/passkey/login',
    };
    const { auth, warnings } = authOver(server({ methods: { methods: [password, passkey, google] } }));
    const list = await auth.methods();
    await auth.methods();
    expect(list).toEqual({ methods: [password, google] });
    expect(warnings).toEqual([unknownKindWarning('passkey', 'webauthn')]);
  });

  it('reads a list without pending routes, and an empty answer, as a list', async () => {
    const { auth } = authOver(
      server({ methods: { methods: [google], pending: { status: '/console/api/user/pending' } } }),
    );
    expect(await auth.methods()).toEqual({ methods: [google] });
    const empty = authOver(server({ methods: null })).auth;
    expect(await empty.methods()).toEqual({ methods: [] });
  });
});

describe('a redirect method', () => {
  it('has a URL naming the page to return to, and one without when none is given', () => {
    const { auth } = authOver(server());
    expect(auth.signInUrl(google, '/console/missions?sector=anvil')).toBe(
      '/console/api/user/google/login?returnUrl=%2Fconsole%2Fmissions%3Fsector%3Danvil',
    );
    expect(auth.signInUrl(google)).toBe('/console/api/user/google/login');
  });

  it('is refused as a URL when it is a password method', () => {
    const { auth } = authOver(server());
    expect(() => auth.signInUrl(password)).toThrow('not a redirect');
  });
});

describe('a password sign-in', () => {
  it('reads the list again, then posts the credentials to the path the list names, and resolves the session', async () => {
    const { auth, transport, errors } = authOver(server());
    const result = await auth.signInWithPassword(password, { username: 'overseer', password: 'lodestar' });
    expect(result).toEqual({ outcome: 'session' });
    expect(sent(transport)).toEqual(['GET /console/api/user/methods', 'POST /console/api/user/password/login']);
    expect(transport.requests[1].body).toEqual({ username: 'overseer', password: 'lodestar' });
    expect(errors).toEqual([]);
  });

  it('posts to the path as the server wrote it under a base URL with an origin', async () => {
    const { auth, transport } = authOver(server(), 'https://ops.example.test/console/api');
    await auth.signInWithPassword(password, { username: 'overseer', password: 'lodestar' });
    expect(sent(transport)).toEqual([
      'GET https://ops.example.test/console/api/user/methods',
      'POST https://ops.example.test/console/api/user/password/login',
    ]);
  });

  it('resolves a pending step, with the page the server chose for it when it chose one', async () => {
    const held = authOver(server({ login: { status: 200, body: { mfaIsRequired: true } } }));
    expect(await held.auth.signInWithPassword(password, { username: 'overseer', password: 'lodestar' })).toEqual({
      outcome: 'pending',
    });
    const sentOn = authOver(
      server({ login: { status: 200, body: { mfaIsRequired: true, redirectUrl: '/console/mfa' } } }),
    );
    expect(await sentOn.auth.signInWithPassword(password, { username: 'overseer', password: 'lodestar' })).toEqual({
      outcome: 'pending',
      redirectUrl: '/console/mfa',
    });
  });

  const refusals: { name: string; answer: TransportResponse; want: unknown }[] = [
    {
      name: 'a refusal with a code resolves with the code and the words',
      answer: { status: 401, body: { message: 'User disabled', code: 'user_disabled' } },
      want: { outcome: 'refused', status: 401, code: 'user_disabled', message: 'User disabled' },
    },
    {
      name: 'a wrong password resolves with the words and no code',
      answer: { status: 401, body: { message: 'Invalid Credentials' } },
      want: { outcome: 'refused', status: 401, message: 'Invalid Credentials' },
    },
    {
      name: 'a forbidden sign-in resolves as refused',
      answer: { status: 403, body: { message: 'Sign-in is not allowed for this account', code: 'policy_denied' } },
      want: {
        outcome: 'refused',
        status: 403,
        code: 'policy_denied',
        message: 'Sign-in is not allowed for this account',
      },
    },
    {
      name: 'a refusal with no body resolves with the status as its words',
      answer: { status: 401, body: undefined },
      want: { outcome: 'refused', status: 401, message: 'HTTP 401' },
    },
  ];
  for (const tt of refusals) {
    it(tt.name, async () => {
      const { auth, errors } = authOver(server({ login: tt.answer }));
      expect(await auth.signInWithPassword(password, { username: 'overseer', password: 'wrong' })).toEqual(tt.want);
      expect(errors).toEqual([]);
    });
  }

  it('throws the server fault a step does not declare, the hook seeing it', async () => {
    const { auth, errors } = authOver(server({ login: { status: 500, body: { message: 'store unavailable' } } }));
    await expect(
      auth.signInWithPassword(password, { username: 'overseer', password: 'lodestar' }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(errors.map((error) => error.status)).toEqual([500]);
  });

  it('is refused before any request for a redirect method', async () => {
    const { auth, transport } = authOver(server());
    await expect(auth.signInWithPassword(google, { username: 'overseer', password: 'lodestar' })).rejects.toThrow(
      'not a password form',
    );
    expect(transport.requests).toHaveLength(0);
  });

  it('throws without posting when the refreshed list no longer offers the method, the kept list being the new one', async () => {
    const { auth, transport } = authOver(server({ methods: { methods: [google], pending: pendingRoutes } }));
    await expect(auth.signInWithPassword(password, { username: 'overseer', password: 'lodestar' })).rejects.toThrow(
      'no longer offers the password password sign-in',
    );
    expect(sent(transport)).toEqual(['GET /console/api/user/methods']);
    expect(auth.get()).toEqual({ methods: [google], pending: pendingRoutes });
  });
});

describe('the pending sign-in', () => {
  const waiting = {
    reason: 'confirmation',
    email: 'nova@fleet.example',
    expiresAt: '2026-10-17T12:10:00Z',
    returnUrl: '/console/dashboard',
  };

  it('reports the step a sign-in waits on, reading the list first for the route', async () => {
    const { auth, transport } = authOver(server({ status: { status: 200, body: waiting } }));
    expect(await auth.pending()).toEqual({ outcome: 'waiting', ...waiting });
    expect(sent(transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/pending']);
  });

  it('reads the status from the kept list without reading the list again', async () => {
    const { auth, transport } = authOver(
      server({ status: { status: 200, body: { ...waiting, reason: 'mfa', factors: ['totp'] } } }),
    );
    await auth.methods();
    expect(await auth.pending()).toEqual({ outcome: 'waiting', ...waiting, reason: 'mfa', factors: ['totp'] });
    expect(sent(transport)).toEqual(['GET /console/api/user/methods', 'GET /console/api/user/pending']);
  });

  it('reports none when the browser has no pending sign-in', async () => {
    const { auth, errors } = authOver(server());
    expect(await auth.pending()).toEqual({ outcome: 'none' });
    expect(errors).toEqual([]);
  });

  it('reports the expiry as the server refuses it', async () => {
    const { auth, errors } = authOver(
      server({
        status: { status: 401, body: { message: 'the pending sign-in has expired', code: 'pending_expired' } },
      }),
    );
    expect(await auth.pending()).toEqual({
      outcome: 'refused',
      status: 401,
      code: 'pending_expired',
      message: 'the pending sign-in has expired',
    });
    expect(errors).toEqual([]);
  });

  it('throws when the list names no pending routes', async () => {
    const { auth } = authOver(server({ methods: { methods: [password] } }));
    await expect(auth.pending()).rejects.toThrow('names no pending sign-in routes');
    await expect(auth.confirmPending('lodestar')).rejects.toThrow('names no pending sign-in routes');
    await expect(auth.cancelPending()).rejects.toThrow('names no pending sign-in routes');
  });

  it('is confirmed with the password after the list is read again, and resolves the session', async () => {
    const { auth, transport } = authOver(server());
    await auth.methods();
    expect(await auth.confirmPending('lodestar')).toEqual({ outcome: 'session' });
    expect(sent(transport)).toEqual([
      'GET /console/api/user/methods',
      'GET /console/api/user/methods',
      'POST /console/api/user/pending/confirm',
    ]);
    expect(transport.requests[2].body).toEqual({ password: 'lodestar' });
  });

  const confirmations: { name: string; answer: TransportResponse; want: unknown }[] = [
    {
      name: 'a wrong confirmation password resolves with the words and no code',
      answer: { status: 401, body: { message: 'Invalid Credentials' } },
      want: { outcome: 'refused', status: 401, message: 'Invalid Credentials' },
    },
    {
      name: 'an expired pending sign-in resolves with its code',
      answer: { status: 401, body: { message: 'the pending sign-in has expired', code: 'pending_expired' } },
      want: { outcome: 'refused', status: 401, code: 'pending_expired', message: 'the pending sign-in has expired' },
    },
    {
      name: 'a step the pending sign-in does not wait for resolves as refused',
      answer: { status: 409, body: { message: 'the pending sign-in does not wait for a password confirmation' } },
      want: {
        outcome: 'refused',
        status: 409,
        message: 'the pending sign-in does not wait for a password confirmation',
      },
    },
    {
      name: 'no pending sign-in resolves as refused',
      answer: { status: 404, body: { message: 'no pending sign-in' } },
      want: { outcome: 'refused', status: 404, message: 'no pending sign-in' },
    },
    {
      name: 'the policy asking for MFA after the link resolves a pending step',
      answer: { status: 200, body: { mfaIsRequired: true } },
      want: { outcome: 'pending' },
    },
  ];
  for (const tt of confirmations) {
    it(tt.name, async () => {
      const { auth, errors } = authOver(server({ confirm: tt.answer }));
      expect(await auth.confirmPending('lodestar')).toEqual(tt.want);
      expect(errors).toEqual([]);
    });
  }

  it('is cancelled after the list is read again', async () => {
    const { auth, transport } = authOver(server());
    await auth.cancelPending();
    expect(sent(transport)).toEqual(['GET /console/api/user/methods', 'POST /console/api/user/pending/cancel']);
  });
});
