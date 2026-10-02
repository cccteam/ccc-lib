import { Domain } from './brands';
import { ResourceDescriptor } from './descriptor';
import { Requester } from './permissions';
import { XsrfOptions, defaultXsrf, readCookie } from './transport';

/** The request header a live request carries: the tab's id. The server registers the subscription under it. */
export const subscribeHeader = 'X-Subscribe';

/**
 * The reserved query parameter a live request carries: the version the browser's cache
 * keys the answer by. Its value is the change document's `at` (unix microseconds) once a
 * change has arrived for the row or list, and the tab's seed before that. The server's
 * decoders accept and skip it.
 */
export const versionParam = '_v';

/** The live routes of a session-serving outlet, under its API prefix. */
export const liveRoutes = {
  token: 'live/token',
  renew: 'live/renew',
  unsubscribe: 'live/unsubscribe',
} as const;

/** How often a tab renews its live subscriptions, in milliseconds. */
export const liveRenewInterval = 120_000;

/** How long the server holds a subscription after it was written or renewed, in milliseconds. */
export const liveSubscriptionTtl = 300_000;

/** How long the server keeps a change document, in milliseconds; a gap longer than this is a resync. */
export const liveChangeTtl = 600_000;

/**
 * The Firestore identity the server mints for the session's principal, answered by
 * `GET <prefix>/live/token` and handed to the feed's `start`. Against the emulator
 * (`emulator` set) `token` is empty and the browser connects with a mock user token for
 * `uid`; in production `emulator` is empty and `token` is a custom token the browser
 * signs in with.
 */
export interface LiveIdentity {
  uid: string;
  token: string;
  project: string;
  database: string;
  apiKey: string;
  emulator: string;
}

/**
 * One change the feed reports. A `row` event names a row by resource and key (and says
 * whether it was deleted); a `list` event names a resource in a domain (no domain for a
 * global resource); a `resource` event names a resource alone and stands for every row
 * and list of it, sent when a request touched more rows than the server looks up one by
 * one. `at` is the change document's server timestamp as unix microseconds in decimal:
 * the version the refetch carries.
 */
export interface ChangeEvent {
  kind: 'row' | 'list' | 'resource';
  resource: string;
  key?: string;
  domain?: string;
  deleted?: boolean;
  at: string;
}

/**
 * The change feed: what delivers a user's change set to the tab. `start` receives the
 * identity the server minted and begins listening; `stop` ends it; `onChange` and
 * `onResync` register listeners and return their release. A feed emits `resync` when it
 * cannot vouch for having seen every change (its listener recovered after an error, or the
 * page became visible again after being hidden longer than the change documents live), and
 * the live session answers by refetching every live row and list with a fresh seed, as its
 * own start does. @cccteam/resource-firestore is the Firestore implementation; this
 * package depends on no SDK.
 */
export interface ChangeFeed {
  start(identity: LiveIdentity): Promise<void>;
  stop(): Promise<void>;
  onChange(listener: (event: ChangeEvent) => void): () => void;
  onResync(listener: () => void): () => void;
}

/**
 * What a live request subscribes to, and what a tab renews: a row is its resource and
 * key; a list is its resource and domain, with no domain for a global resource. Filter,
 * sort, and cursor are not part of it: any change to the resource in the domain refetches
 * the page.
 */
export interface LiveSubscription {
  resource: string;
  key?: string;
  domain?: string;
}

/** The server's answer to a renewal: the subscriptions it kept and the ones the digest no longer grants, echoed as sent. */
export interface RenewResponse {
  kept: LiveSubscription[];
  dropped: LiveSubscription[];
  expiresAt: string;
}

/**
 * What a watcher does when its row or list changed: fetch it again with `version` as the
 * version parameter. `event` is the change that caused it, absent on a resync.
 */
export type LiveRefetch = (version: string, event?: ChangeEvent) => void;

/** The page events the live session listens to; the window, in a browser. */
export interface PageEvents {
  addEventListener(type: string, listener: (event: { persisted?: boolean }) => void): void;
  removeEventListener(type: string, listener: (event: { persisted?: boolean }) => void): void;
}

/** The knobs of a live session an application or a spec may turn. Every one has a default. */
export interface LiveOptions {
  /** How often the tab renews its subscriptions; defaults to liveRenewInterval. */
  renewInterval?: number;
  /** The XSRF echo on the page-leave unsubscribe, which bypasses the transport; the server's names by default, `false` for none. */
  xsrf?: XsrfOptions | false;
  /** The fetch the page-leave unsubscribe rides with keepalive; the global one by default. */
  fetch?: typeof fetch;
  /** Where pagehide and pageshow are heard; the window by default, nothing outside a browser. */
  page?: PageEvents;
}

/** What createClient hands the live session beside the options. */
export interface LiveSessionOptions extends LiveOptions {
  request: Requester;
  baseUrl: string;
  /** Whether the API serves live subscriptions (the descriptor's `live`). */
  enabled: boolean;
}

/** The subscription of a handle's list, or of one of its rows when a key is given: the one place the key's string form is decided. */
export function liveSubscription(
  descriptor: ResourceDescriptor,
  domain: Domain | undefined,
  key?: readonly unknown[],
): LiveSubscription {
  if (key !== undefined) {
    return { resource: descriptor.resource, key: key.map(String).join('/') };
  }
  return domain === undefined ? { resource: descriptor.resource } : { resource: descriptor.resource, domain };
}

/** Whether two subscriptions name the same row or list. */
export function sameSubscription(a: LiveSubscription | undefined, b: LiveSubscription | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === b;
  }
  return subscriptionKey(a) === subscriptionKey(b);
}

function subscriptionKey(subscription: LiveSubscription): string {
  return `${subscription.resource}|${subscription.key ?? ''}|${subscription.domain ?? ''}`;
}

const base64url = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** A fresh opaque id: 16 random bytes as 22 base64url characters. The tab id and the seed are minted with it. */
export function mintLiveId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < 15; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += base64url[(n >> 18) & 63] + base64url[(n >> 12) & 63] + base64url[(n >> 6) & 63] + base64url[n & 63];
  }
  return out + base64url[bytes[15] >> 2] + base64url[(bytes[15] & 3) << 4];
}

/** The URL with the version parameter set to `version`, replacing one already there; the rest of the URL as given. */
export function versionedUrl(url: string, version: string): string {
  const mark = url.indexOf('?');
  const path = mark === -1 ? url : url.slice(0, mark);
  const query = mark === -1 ? '' : url.slice(mark + 1);
  const kept = query.split('&').filter((part) => part !== '' && !part.startsWith(`${versionParam}=`));
  kept.push(`${versionParam}=${encodeURIComponent(version)}`);
  return `${path}?${kept.join('&')}`;
}

/** The later of two versions written as decimal microseconds; undefined when neither is set. */
function later(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined || b === undefined) {
    return a ?? b;
  }
  if (a.length !== b.length) {
    return a.length > b.length ? a : b;
  }
  return a > b ? a : b;
}

interface Watcher {
  subscription: LiveSubscription;
  refetch: LiveRefetch;
}

/**
 * The tab's live session: the one place live state lives for a client. It mints the tab
 * id and the seed, holds the live rows and lists the pages watch, dispatches the feed's
 * events to them, renews the tab's subscriptions, unsubscribes when the page leaves, and
 * ends everything at logout.
 *
 * A live request (a list or read called with `{ live: true }`) carries the tab id in the
 * subscribe header and the version in the reserved parameter only while the session is
 * `active`: the API serves live subscriptions and a feed is running. Until then the
 * request is handled exactly as today, and `start` refetches every watched row and list
 * once the feed runs, so a page that mounted before the feed was up becomes live without
 * asking again itself.
 *
 * Nothing cached is keyed to a user other than through the version: the seed is minted
 * when the feed starts and again at logout, so a second user on the machine never meets
 * the first user's cached answers.
 */
export class LiveSession {
  /** The tab's id, minted once per tab. */
  readonly tab = mintLiveId();
  /** Whether the API serves live subscriptions (the descriptor's `live`). */
  readonly enabled: boolean;

  private seedValue = mintLiveId();
  private feed: ChangeFeed | undefined;
  private feedReleases: (() => void)[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly watchers = new Map<string, Set<Watcher>>();
  /** The latest `at` seen per row or list. Kept past the watcher's release, so a remount asks by the same version and the browser's cache can answer. */
  private readonly lastSeen = new Map<string, string>();
  /** The latest `at` of a resource-level event per resource: every row and list of it is at least that version. */
  private readonly resourceSeen = new Map<string, string>();
  /** Subscriptions the server dropped at the last renewal; not renewed again until a watcher asks for them anew. */
  private readonly dropped = new Set<string>();
  private readonly request: Requester;
  private readonly baseUrl: string;
  private readonly renewInterval: number;
  private readonly xsrf: XsrfOptions | false;
  private readonly keepaliveFetch: typeof fetch | undefined;
  private readonly page: PageEvents | undefined;
  private readonly onPageHide = (): void => this.leave();
  private readonly onPageShow = (event: { persisted?: boolean }): void => {
    if (event.persisted) {
      void this.renew().catch(() => undefined);
    }
  };

  constructor(options: LiveSessionOptions) {
    this.request = options.request;
    this.baseUrl = options.baseUrl;
    this.enabled = options.enabled;
    this.renewInterval = options.renewInterval ?? liveRenewInterval;
    this.xsrf = options.xsrf === undefined ? defaultXsrf : options.xsrf;
    this.keepaliveFetch = options.fetch ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined);
    this.page = options.page ?? (typeof window === 'undefined' ? undefined : window);
  }

  /** The version a row or list is asked by before any change arrived for it: minted when the feed starts and at logout. */
  get seed(): string {
    return this.seedValue;
  }

  /** Whether a feed is running. */
  get started(): boolean {
    return this.feed !== undefined;
  }

  /** Whether a `{ live: true }` call carries the subscribe header and the version: the API serves live and a feed is running. */
  get active(): boolean {
    return this.enabled && this.started;
  }

  /**
   * Holds a row or list live: `refetch` runs whenever the feed reports a change to it
   * (or to its whole resource) and on every resync. Returns the release. Several watchers
   * may hold one subscription; it stays current, and renewed, while any does.
   */
  watch(subscription: LiveSubscription, refetch: LiveRefetch): () => void {
    const key = subscriptionKey(subscription);
    const watcher: Watcher = { subscription, refetch };
    let held = this.watchers.get(key);
    if (!held) {
      held = new Set();
      this.watchers.set(key, held);
    }
    held.add(watcher);
    this.dropped.delete(key);
    return () => {
      const current = this.watchers.get(key);
      if (!current) {
        return;
      }
      current.delete(watcher);
      if (current.size === 0) {
        this.watchers.delete(key);
      }
    };
  }

  /** The version a request for the row or list carries: the latest change seen for it, else the seed. */
  version(subscription: LiveSubscription): string {
    return (
      later(this.lastSeen.get(subscriptionKey(subscription)), this.resourceSeen.get(subscription.resource)) ??
      this.seedValue
    );
  }

  /** The tab's current live subscriptions: every watched row and list the server has not dropped. */
  subscriptions(): LiveSubscription[] {
    const current: LiveSubscription[] = [];
    for (const [key, held] of this.watchers) {
      if (this.dropped.has(key)) {
        continue;
      }
      const [first] = held;
      if (first) {
        current.push(first.subscription);
      }
    }
    return current;
  }

  /**
   * Dispatches one change: the watchers of the row or list it names refetch with its
   * `at`; a resource event reaches every watcher of the resource. The version is recorded
   * whether or not anything watches, so a page mounted later asks by it.
   */
  dispatch(event: ChangeEvent): void {
    if (event.kind === 'resource') {
      this.resourceSeen.set(event.resource, later(this.resourceSeen.get(event.resource), event.at) ?? event.at);
      for (const [, held] of this.watchers) {
        for (const watcher of [...held]) {
          if (watcher.subscription.resource === event.resource) {
            watcher.refetch(this.version(watcher.subscription), event);
          }
        }
      }
      return;
    }
    const subscription: LiveSubscription =
      event.kind === 'row'
        ? { resource: event.resource, key: event.key ?? '' }
        : { resource: event.resource, domain: event.domain || undefined };
    const key = subscriptionKey(subscription);
    this.lastSeen.set(key, later(this.lastSeen.get(key), event.at) ?? event.at);
    const version = this.version(subscription);
    for (const watcher of [...(this.watchers.get(key) ?? [])]) {
      watcher.refetch(version, event);
    }
  }

  /** Forgets every version seen, mints a fresh seed, and refetches every watched row and list by it. */
  resync(): void {
    this.seedValue = mintLiveId();
    this.lastSeen.clear();
    this.resourceSeen.clear();
    for (const [, held] of this.watchers) {
      for (const watcher of [...held]) {
        watcher.refetch(this.seedValue);
      }
    }
  }

  /**
   * Starts live pages for the tab: fetches the identity the server minted, starts the
   * feed with it, wires its events to the watchers, begins renewing, listens for the page
   * leaving, and refetches every watched row and list by a fresh seed so each becomes
   * live. Throws when the API serves no live subscriptions; does nothing when a feed is
   * already running.
   */
  async start(feed: ChangeFeed): Promise<void> {
    if (!this.enabled) {
      throw new Error(
        'this API serves no live subscriptions: its descriptor does not say live, so no change feed can be started for it',
      );
    }
    if (this.feed) {
      return;
    }
    const identity = await this.request<LiveIdentity>('GET', liveRoutes.token, { headers: this.headers() });
    await feed.start(identity);
    this.feed = feed;
    this.feedReleases = [feed.onChange((event) => this.dispatch(event)), feed.onResync(() => this.resync())];
    this.page?.addEventListener('pagehide', this.onPageHide);
    this.page?.addEventListener('pageshow', this.onPageShow);
    this.timer = setInterval(() => {
      void this.renew().catch(() => undefined);
    }, this.renewInterval);
    this.resync();
  }

  /**
   * Renews the tab's current subscriptions with the server, which re-checks each against
   * the digest, and drops the ones it reports dropped: they are not renewed again until a
   * watcher asks for them anew. Nothing is sent while no feed runs or nothing is watched.
   */
  async renew(): Promise<RenewResponse | undefined> {
    if (!this.feed) {
      return undefined;
    }
    const subscriptions = this.subscriptions();
    if (subscriptions.length === 0) {
      return undefined;
    }
    const response = await this.request<RenewResponse | null>('POST', liveRoutes.renew, {
      body: { tab: this.tab, subscriptions },
      headers: this.headers(),
    });
    for (const dropped of response?.dropped ?? []) {
      this.dropped.add(subscriptionKey(dropped));
    }
    return response ?? undefined;
  }

  /**
   * The logout path, run before the session is logged out: deletes every subscription of
   * the principal and revokes the feed's identity (`all: true`), stops the feed, forgets
   * every version seen, and mints a fresh seed so the next user on this machine never
   * meets this user's cached answers. Best effort: a refused unsubscribe still stops the
   * feed. Without a running feed nothing is sent, since nothing was subscribed.
   */
  async stop(): Promise<void> {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.page?.removeEventListener('pagehide', this.onPageHide);
    this.page?.removeEventListener('pageshow', this.onPageShow);
    const feed = this.feed;
    if (feed) {
      this.feed = undefined;
      for (const release of this.feedReleases) {
        release();
      }
      this.feedReleases = [];
      try {
        await this.request<unknown>('POST', liveRoutes.unsubscribe, {
          body: { tab: this.tab, all: true },
          headers: this.headers(),
        });
      } catch {
        // Best effort: the server's TTL ends what this could not.
      }
      try {
        await feed.stop();
      } catch {
        // The feed is being discarded either way.
      }
    }
    this.lastSeen.clear();
    this.resourceSeen.clear();
    this.dropped.clear();
    this.seedValue = mintLiveId();
  }

  /**
   * The page-leave unsubscribe: deletes this tab's subscriptions with a keepalive fetch,
   * which outlives the page where the transport would not. Best effort, sent only while a
   * feed runs; a page restored from the back-forward cache renews at once instead.
   */
  leave(): void {
    if (!this.feed || !this.keepaliveFetch) {
      return;
    }
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...this.headers(),
    };
    if (this.xsrf) {
      const token = readCookie(this.xsrf.cookieName);
      if (token !== undefined) {
        headers[this.xsrf.headerName] = token;
      }
    }
    void this.keepaliveFetch(`${this.baseUrl}/${liveRoutes.unsubscribe}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tab: this.tab, all: false }),
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => undefined);
  }

  /** The subscribe header every live-route request carries, so each shows the tab on its request log line. */
  private headers(): Record<string, string> {
    return { [subscribeHeader]: this.tab };
  }
}
