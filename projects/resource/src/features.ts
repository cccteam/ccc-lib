import { ExecutePermission, Method, Resource } from './brands';
import { MethodDescriptor } from './descriptor';
import { PermissionStore, Requester } from './permissions';
import { Store } from './store';

/**
 * The name of the generated method that flips a flag, as the descriptor's methods record
 * keys it: every generated API declares it, and the digest's Execute entry for it is what
 * says whether the session user may flip anything.
 */
export const setFeatureMethod = 'SetFeature' as Method;

/** The name of the framework-owned resource that holds every declared flag with its state. */
export const featureFlagsResource = 'FeatureFlags' as Resource;

/** One row of the feature flags resource: a declared flag and its state in this environment. */
export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  /** When the flag was last flipped (or first written), as the server wrote it. */
  updatedAt: string;
  updatedBy: string;
}

/** What the server answers a flip with: the flag's new state and when it took effect. */
export interface FeatureFlip {
  name: string;
  enabled: boolean;
  updatedAt: string;
}

/** The body of a flip, as the generated method takes it. */
export interface SetFeatureRequest {
  name: string;
  enabled: boolean;
}

/**
 * The enabled set at one instant. `loaded` says whether a load has answered since the
 * set was last cleared: an unloaded set is empty, and a consumer that needs the answer
 * before rendering (a route guard) loads it first (`ensure`).
 */
export interface FeaturesSnapshot {
  readonly enabled: ReadonlySet<string>;
  readonly loaded: boolean;
}

/** What createClient hands the feature state. */
export interface FeatureStateOptions {
  request: Requester;
  /** The route the enabled set is read from: the descriptor's `features.route`. */
  route: string;
  /** The generated flip method's descriptor entry; absent on an API that declares none, where a flip is refused before any request. */
  setFeature?: MethodDescriptor;
  /** The digest cache a flip refreshes afterwards, since a flip changes what the digest carries. */
  permissions: PermissionStore;
  /** Reads every row of the feature flags resource through the client's own handle. */
  flags: () => Promise<FeatureFlag[]>;
}

const nothing: FeaturesSnapshot = { enabled: new Set(), loaded: false };

/**
 * FeatureState owns the enabled set of feature flags: the names the server says are on
 * in this environment. It loads once at sign-in, beside the permission digest, from the
 * generated features route, and `enabled` answers synchronously from the copy and never
 * fetches: a flag the set does not hold is off, and so is every flag before the set has
 * loaded, so consumers fail closed. Nothing polls and nothing is pushed: a flip by
 * someone else is seen at the next sign-in, by design. The one exception is the person
 * flipping, whose `setFeature` refreshes this set and the digest once the write succeeds,
 * so their own pages follow at once.
 */
export class FeatureState {
  readonly snapshot = new Store<FeaturesSnapshot>(nothing);
  private inflight: Promise<readonly string[]> | undefined;

  constructor(private options: FeatureStateOptions) {}

  get(): FeaturesSnapshot {
    return this.snapshot.get();
  }

  subscribe(listener: (snapshot: FeaturesSnapshot) => void): () => void {
    return this.snapshot.subscribe(listener);
  }

  /** Whether the named flag is on; false before the set has loaded. */
  enabled(feature: string): boolean {
    return this.snapshot.get().enabled.has(feature);
  }

  /** Whether a load has answered since the set was last cleared. */
  get loaded(): boolean {
    return this.snapshot.get().loaded;
  }

  /** The enabled names, sorted. */
  names(): readonly string[] {
    return [...this.snapshot.get().enabled].sort();
  }

  /** Whether the digest says the session user may flip a flag: Execute on the generated flip method. */
  canSet(): boolean {
    return this.options.permissions.can({ resource: setFeatureMethod, permission: ExecutePermission });
  }

  /**
   * Loads (or reloads) the enabled set from the features route. Concurrent calls share
   * one request. A failed load empties the set and leaves it unloaded, so every flag
   * answers off and the next `ensure` asks again, and rethrows so callers see the failure.
   */
  refresh(): Promise<readonly string[]> {
    if (this.inflight) {
      return this.inflight;
    }
    const load = this.options
      .request<{ enabled?: string[] | null } | null>('GET', this.options.route)
      .then((body) => body?.enabled ?? [])
      .catch((error: unknown) => {
        this.snapshot.set(nothing);
        throw error;
      })
      .then((enabled) => {
        this.snapshot.set({ enabled: new Set(enabled), loaded: true });
        return enabled as readonly string[];
      })
      .finally(() => {
        this.inflight = undefined;
      });
    this.inflight = load;
    return load;
  }

  /** Answers whether a flag is on, loading the set first when it has not loaded; a failed load answers false. */
  async ensure(feature: string): Promise<boolean> {
    if (!this.loaded) {
      try {
        await this.refresh();
      } catch {
        return false;
      }
    }
    return this.enabled(feature);
  }

  /** Every declared flag with its state, read from the feature flags resource through the client. */
  flags(): Promise<FeatureFlag[]> {
    return this.options.flags();
  }

  /**
   * Flips one flag through the generated method, and once the write succeeds reloads the
   * enabled set and every cached digest and the domains, so the pages of the person
   * flipping follow at once. A refused flip (an unknown name, a missing grant) rejects with
   * the server's ApiError and refreshes nothing. An API that declares no flip method
   * refuses before any request is sent.
   */
  async setFeature(name: string, enabled: boolean): Promise<FeatureFlip> {
    const method = this.options.setFeature;
    if (!method) {
      throw new Error(`this API declares no ${setFeatureMethod} method; feature flags cannot be flipped from here`);
    }
    const body: SetFeatureRequest = { name, enabled };
    const flip = await this.options.request<FeatureFlip>('POST', method.route, { body });
    await Promise.all([this.refresh(), this.options.permissions.refresh()]);
    return flip;
  }

  /** Forgets the set — on logout. */
  clear(): void {
    this.snapshot.set(nothing);
  }
}
