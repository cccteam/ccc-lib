import { ClientResponse, ResponseRequester } from './permissions';
import { Store } from './store';
import { Warn, warnOnce } from './warnings';

/**
 * Where the generated router serves the login page's methods list, under the API prefix:
 * `GET <prefix>/user/methods`, public, before any session and without an XSRF token.
 */
export const loginMethodsRoute = 'user/methods';

/**
 * How a sign-in method starts: `password` is a form the page posts to the method's path
 * with `{ username, password }`; `redirect` is a navigation to the method's path that sends
 * the browser away to the identity provider and brings it back signed in, refused, or
 * waiting on a pending step.
 */
export type LoginMethodKind = 'password' | 'redirect';

/**
 * One sign-in method the server offers, as its methods list describes it. A page renders
 * from the list alone: it names no path, no label and no method of its own, so the browser
 * bundle is the same in every environment and a method that is not registered has no
 * button.
 */
export interface LoginMethod {
  /**
   * The name the method was registered under on the server's Auth: `password`, or the
   * application's own name for an external registration (`google`, `lakeside-entra`). Label
   * overrides are keyed by it.
   */
  readonly name: string;
  /** The library method behind the registration: `password`, `google`, `azure`, `workos`, or one a later server adds. */
  readonly method: string;
  readonly kind: LoginMethodKind;
  /** What the page shows for the method, in the application's words: the default a page may override by name. */
  readonly label: string;
  /**
   * Where the server mounted the method's login handler: a path in the application carrying
   * the API prefix, such as `/api/user/google/login`. The form posts to it; the redirect
   * goes to it.
   */
  readonly path: string;
}

/** The paths of the pending sign-in's handlers: its status, the password confirmation, and the cancel. */
export interface PendingRoutes {
  readonly status: string;
  readonly confirm: string;
  readonly cancel: string;
}

/** What the methods route answers: the methods in the order the server lists them, and the pending sign-in's routes. */
export interface LoginMethods {
  readonly methods: readonly LoginMethod[];
  /** The pending sign-in's routes; absent on a server that wired none, where no sign-in ever waits. */
  readonly pending?: PendingRoutes;
  /**
   * The path of the password method's change: where a signed-in person posts
   * `{ oldPassword, newPassword }`, including one whose operator-set password must change
   * before anything else is served. Absent on a server with no password method.
   */
  readonly changePassword?: string;
}

/**
 * What a password change answers: `changed`, the password is the new one and the session
 * continues (regenerated, so the page checks it again); or the server's refusal, resolved
 * rather than thrown, with its words: the old password did not match, the new one is the
 * old one or fails the server's rule, or the session is an impersonation.
 */
export type PasswordChangeResult = { readonly outcome: 'changed' } | SignInRefusal;

/** What the password method's form posts. */
export interface PasswordCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * The server's refusal of a sign-in step, resolved rather than thrown so a page renders it
 * where it belongs. `code` is the server's login refusal code, for the sentence the page
 * holds for it (`user_disabled`, `pending_expired`, an application's own); it is undefined
 * when the answer carried none, such as a wrong password or a step the pending sign-in
 * does not wait for, and `message` is then the server's words.
 */
export interface SignInRefusal {
  readonly outcome: 'refused';
  readonly status: number;
  readonly code?: string;
  readonly message: string;
}

/**
 * What a sign-in step answers. `session`: the session is established, and the page's next
 * request carries it. `pending`: the sign-in waits on a step, a password confirmation or
 * the application's MFA step; `pending()` says which, unless the server named a
 * `redirectUrl` of its own for the step, which the page goes to. `refused`: see
 * SignInRefusal.
 */
export type SignInResult = { readonly outcome: 'session' } | PendingSignInResult | SignInRefusal;

export interface PendingSignInResult {
  readonly outcome: 'pending';
  /** Where the server sends the browser for the step, when its pending hook chose a page; otherwise the page reads `pending()`. */
  readonly redirectUrl?: string;
}

/**
 * Why a sign-in waits: `confirmation`, the identity matches a user that has a password,
 * which must be entered before the two are linked; `mfa`, the sign-in policy requires the
 * application's MFA step. A later server may add a reason.
 */
export type PendingReason = 'confirmation' | 'mfa' | (string & {});

/** The sign-in that waits, as the pending status route reports it. */
export interface PendingSignIn {
  readonly reason: PendingReason;
  /** The email address the identity asserted, for the page's words; empty when it asserted none. */
  readonly email: string;
  /** When the pending sign-in expires, as the server wrote it. */
  readonly expiresAt: string;
  /** The path in the application the sign-in returns to once it completes; empty when it had none. */
  readonly returnUrl: string;
  /** The methods the sign-in policy accepts for the MFA step; absent or empty for any. */
  readonly factors?: readonly string[];
}

/**
 * What the pending status route answers: a sign-in waiting (`waiting`, with the pending
 * sign-in's fields), none for this browser (`none`), or the server's refusal, which is
 * `pending_expired` when the browser's pending sign-in expired or was already used.
 */
export type PendingStatus =
  | ({ readonly outcome: 'waiting' } & PendingSignIn)
  | { readonly outcome: 'none' }
  | SignInRefusal;

/** What createClient hands the sign-in client. */
export interface AuthClientOptions {
  /** Issues the requests, resolving with the status; the client's own requester, so every request carries what the client's do. */
  request: ResponseRequester;
  /** The methods route under the API prefix: `loginMethodsRoute`. */
  route: string;
  /** Where a method the client cannot drive is announced, once per message; the client's hook, the console by default. */
  warn?: Warn;
}

/** The statuses a sign-in step resolves as a refusal rather than throws. */
const signInRefusals: readonly number[] = [401, 403];
const confirmRefusals: readonly number[] = [401, 403, 404, 409];
const statusRefusals: readonly number[] = [401, 403];
const changeRefusals: readonly number[] = [400, 401, 403, 409];

/**
 * The refusal code the server answers, with a 403, on every request of a session whose
 * operator-set password must change: everything but the password change, the session
 * read and the logout. A framework over the client treats such a refusal as it treats a
 * 401, returning the browser to the login page, where the change form is served.
 */
export const passwordChangeRequiredCode = 'password_change_required';

/** Whether a refusal is the server's answer to a session whose password must change: a 403 carrying the code. */
export function refusedForPasswordChange(refusal: { status: number; body: unknown }): boolean {
  if (refusal.status !== 403 || !refusal.body || typeof refusal.body !== 'object') {
    return false;
  }
  return (refusal.body as RefusalAnswer).code === passwordChangeRequiredCode;
}

/** The shape the methods route answers, before it is checked. */
interface MethodsAnswer {
  methods?: Partial<LoginMethod>[] | null;
  pending?: Partial<PendingRoutes> | null;
  changePassword?: string | null;
}

/** The shape a sign-in step answers on 200. */
interface SignInAnswer {
  mfaIsRequired?: boolean;
  redirectUrl?: string;
}

/** The shape a refusal answers: the server's words, and its code when it has one. */
interface RefusalAnswer {
  message?: unknown;
  code?: unknown;
}

/**
 * AuthClient drives a sign-in from the browser against what the server offers. It is the
 * one place that knows the wire shape: the methods list and its route, the password
 * method's form, the redirect method's return parameter, the pending sign-in's status,
 * confirmation and cancel, and the answers of each. A page over it renders the list,
 * posts the form, performs the redirect, and renders the pending step, naming no path of
 * its own.
 *
 * Every step that posts reads the methods list again first. The list's answer refreshes
 * the XSRF cookie the server's guard checks on a POST, so a login page left open past the
 * cookie's life signs in on the first click rather than being refused for a stale token
 * and succeeding on the second; the re-read also re-syncs the list, so a method the
 * server no longer offers is not posted to. The methods request is a page's first request
 * for the same reason: it primes the cookie.
 *
 * A refusal the server answers on a sign-in step (a wrong password, a disabled user, an
 * expired pending sign-in) resolves as `refused` with the server's code and words, so the
 * client's error hook never sees it: nothing sends the browser to the login page it is on,
 * and nothing raises a notice. Every other failure, a malformed request, a server fault,
 * no response, throws as the client's requests do.
 */
export class AuthClient {
  /** The last methods list read, for a page to render from; undefined until the first read answers. */
  readonly snapshot = new Store<LoginMethods | undefined>(undefined);
  private readonly warn: Warn;

  constructor(private readonly options: AuthClientOptions) {
    this.warn = options.warn ?? warnOnce();
  }

  /** The last methods list read, or undefined before the first read. */
  get(): LoginMethods | undefined {
    return this.snapshot.get();
  }

  subscribe(listener: (list: LoginMethods | undefined) => void): () => void {
    return this.snapshot.subscribe(listener);
  }

  /**
   * Reads the methods list: the sign-in methods the server offers, in its order, and the
   * pending sign-in's routes. The answer is kept in `snapshot`. A listed method of a kind
   * this client cannot drive is left out and announced once through the warn hook.
   */
  async methods(): Promise<LoginMethods> {
    const answer = await this.options.request<MethodsAnswer | null>('GET', this.options.route);
    const list = this.listOf(answer.body);
    this.snapshot.set(list);
    return list;
  }

  /**
   * The URL a redirect method's button sends the browser to: the method's path, naming
   * the page in the application the sign-in returns to as `returnUrl` when one is given.
   * The server sanitizes the page to a path in the application. Nothing is requested
   * here: the page assigns the URL to the browser's location.
   */
  signInUrl(method: LoginMethod, returnUrl?: string): string {
    if (method.kind !== 'redirect') {
      throw new Error(
        `the ${method.name} sign-in method is a ${method.kind} method, not a redirect: post its form with signInWithPassword`,
      );
    }
    return returnUrl ? `${method.path}?returnUrl=${encodeURIComponent(returnUrl)}` : method.path;
  }

  /**
   * Signs in through a password method: reads the methods list again, then posts the
   * credentials to the path the refreshed list names for the method. The result is the
   * session, a pending step, or the server's refusal. A method that is not a password
   * method is refused before any request, and one the refreshed list no longer offers
   * throws, the list in `snapshot` being the one to render again.
   */
  async signInWithPassword(method: LoginMethod, credentials: PasswordCredentials): Promise<SignInResult> {
    if (method.kind !== 'password') {
      throw new Error(
        `the ${method.name} sign-in method is a ${method.kind} method, not a password form: send the browser to signInUrl`,
      );
    }
    const list = await this.methods();
    const offered = list.methods.find((candidate) => candidate.name === method.name && candidate.kind === 'password');
    if (!offered) {
      throw new Error(`the server no longer offers the ${method.name} password sign-in: render the methods list again`);
    }
    const response = await this.options.request<SignInAnswer | RefusalAnswer | null>('POST', offered.path, {
      body: credentials,
      absolute: true,
      accept: signInRefusals,
    });
    return signInResultOf(response);
  }

  /**
   * Reads the pending sign-in's status: the step the browser's sign-in waits on, none, or
   * the server's refusal (`pending_expired`). It reads the methods list first when none
   * has been read, for the status route. A server whose list names no pending routes
   * never holds a sign-in, and the read throws saying so.
   */
  async pending(): Promise<PendingStatus> {
    const routes = await this.pendingRoutes(false);
    const response = await this.options.request<(Partial<PendingSignIn> & RefusalAnswer) | null>('GET', routes.status, {
      absolute: true,
      accept: [...statusRefusals, 404],
    });
    if (response.status === 404) {
      return { outcome: 'none' };
    }
    if (response.status >= 400) {
      return refusalOf(response);
    }
    const body = response.body ?? {};
    return {
      outcome: 'waiting',
      reason: stringOf(body.reason),
      email: stringOf(body.email),
      expiresAt: stringOf(body.expiresAt),
      returnUrl: stringOf(body.returnUrl),
      ...(Array.isArray(body.factors) ? { factors: body.factors.map(String) } : {}),
    };
  }

  /**
   * Confirms the pending sign-in with the password of the user it matched: reads the
   * methods list again, then posts the password to the confirmation route. The result is
   * the session, a further pending step (the policy's MFA after the link), or the
   * server's refusal: a wrong password answers 401 with the server's words and leaves the
   * pending sign-in in place, and an expired one answers `pending_expired`.
   */
  async confirmPending(password: string): Promise<SignInResult> {
    const routes = await this.pendingRoutes(true);
    const response = await this.options.request<SignInAnswer | RefusalAnswer | null>('POST', routes.confirm, {
      body: { password },
      absolute: true,
      accept: confirmRefusals,
    });
    return signInResultOf(response);
  }

  /** Discards the browser's pending sign-in, if it has one: reads the methods list again, then posts to the cancel route. */
  async cancelPending(): Promise<void> {
    const routes = await this.pendingRoutes(true);
    await this.options.request('POST', routes.cancel, { absolute: true });
  }

  /**
   * Changes the signed-in person's password: reads the methods list again, then posts the
   * old and the new password to the change path the refreshed list names. The route is
   * the one a person whose operator-set password must change reaches before anything else
   * is served, so a login page that finds `passwordChangeRequired` on the session read
   * posts here, then checks the session again. The result is `changed`, or the server's
   * refusal with its words (the old password did not match, the new one is the old one).
   * A server whose list names no change path offers no password method, and the call
   * throws saying so.
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<PasswordChangeResult> {
    const list = await this.methods();
    if (!list.changePassword) {
      throw new Error(
        'this server names no password change path in its methods list: it offers no password method to change',
      );
    }
    const response = await this.options.request<RefusalAnswer | null>('POST', list.changePassword, {
      body: { oldPassword, newPassword },
      absolute: true,
      accept: changeRefusals,
    });
    return response.status >= 400 ? refusalOf(response) : { outcome: 'changed' };
  }

  /** The pending routes of the kept list, read again when asked or when none is kept. */
  private async pendingRoutes(refresh: boolean): Promise<PendingRoutes> {
    const kept = this.snapshot.get();
    const list = refresh || !kept ? await this.methods() : kept;
    if (!list.pending) {
      throw new Error(
        'this server names no pending sign-in routes in its methods list: no sign-in of its waits on a step',
      );
    }
    return list.pending;
  }

  /** The list as the page may render it: each method with its fields as strings, the kinds this client drives only. */
  private listOf(answer: MethodsAnswer | null): LoginMethods {
    const methods: LoginMethod[] = [];
    for (const entry of answer?.methods ?? []) {
      const kind = entry.kind;
      if (kind !== 'password' && kind !== 'redirect') {
        this.warn(unknownKindWarning(stringOf(entry.name), stringOf(kind)));
        continue;
      }
      methods.push({
        name: stringOf(entry.name),
        method: stringOf(entry.method),
        kind,
        label: stringOf(entry.label),
        path: stringOf(entry.path),
      });
    }
    const pending = answer?.pending;
    const list: LoginMethods =
      pending?.status && pending.confirm && pending.cancel
        ? { methods, pending: { status: pending.status, confirm: pending.confirm, cancel: pending.cancel } }
        : { methods };
    const changePassword = answer?.changePassword;
    return typeof changePassword === 'string' && changePassword !== '' ? { ...list, changePassword } : list;
  }
}

/**
 * What the client announces, once, for a listed method whose kind it cannot drive: the
 * method is left out of the list, and a newer client is what would offer it.
 */
export function unknownKindWarning(name: string, kind: string): string {
  return (
    `the server lists the sign-in method ${name} as a ${kind} method, a kind this client does not drive: ` +
    'it is left out of the list; update @cccteam/resource to a release that drives it'
  );
}

/** The result of a sign-in step's answer: a refusal for a status the step accepts, else the session or a pending step. */
function signInResultOf(response: ClientResponse<SignInAnswer | RefusalAnswer | null>): SignInResult {
  if (response.status >= 400) {
    return refusalOf(response);
  }
  const answer = (response.body ?? {}) as SignInAnswer;
  if (answer.mfaIsRequired) {
    return answer.redirectUrl ? { outcome: 'pending', redirectUrl: answer.redirectUrl } : { outcome: 'pending' };
  }
  return { outcome: 'session' };
}

/** The server's refusal as the page renders it: its code when the answer carries one, and its words. */
function refusalOf(response: ClientResponse<unknown>): SignInRefusal {
  const body: RefusalAnswer =
    response.body && typeof response.body === 'object' ? (response.body as RefusalAnswer) : {};
  const code = typeof body.code === 'string' && body.code !== '' ? body.code : undefined;
  const message = typeof body.message === 'string' && body.message !== '' ? body.message : `HTTP ${response.status}`;
  return code === undefined
    ? { outcome: 'refused', status: response.status, message }
    : { outcome: 'refused', status: response.status, code, message };
}

function stringOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
