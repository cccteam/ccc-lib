import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { RESOURCE_CLIENT, httpClientTransport, storeSignal } from '@cccteam/ccc-lib/resource-client';
import {
  API_URL,
  Domain,
  FRONTEND_LOGIN_PATH,
  LOGOUT_ACTION,
  PERMISSION_DIGEST_PATH,
  PermissionDigest,
  PermissionDigestState,
  PermissionScope,
  SESSION_PATH,
  SessionInfo,
  USER_DOMAINS_PATH,
} from '@cccteam/ccc-lib/types';
import { errorOptions } from '@cccteam/ccc-lib/util-request-options';
import { createClient, fieldPermissionStates, permissionState, PermissionStore } from '@cccteam/resource';
import { from, map, Observable, of, switchMap, tap } from 'rxjs';

/**
 * Session and permission state for the application.
 *
 * Permissions are owned by a @cccteam/resource PermissionStore — the application's
 * client when it provides one (RESOURCE_CLIENT), otherwise a library-private client
 * over the configured digest and user-domains paths. One cache serves the app's own
 * pages and the library's guard, directive, and forms. The store holds the per-scope
 * permission digest (the session user's structural grant enumeration — granted,
 * conditional, or absent for denied) and the user's domains (every tenant where they
 * hold at least one grant — the tenant picker's source). On authentication the global
 * digest and the domains load once; a tenant's digest loads on demand (`loadDigest`)
 * and stays cached. Answers are advisory UI material — what to render — and fail
 * closed: nothing loaded means nothing permitted. Enforcement stays server-side.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = inject(API_URL);
  private loginUrl = inject(FRONTEND_LOGIN_PATH);
  private sessionUrl = inject(SESSION_PATH);
  private logoutAction = inject(LOGOUT_ACTION);

  http = inject(HttpClient);

  /** The permission cache: the app's client when provided, else a private one. */
  readonly permissions: PermissionStore = (inject(RESOURCE_CLIENT, { optional: true }) ?? this.privateClient())
    .permissions;

  private snapshot = storeSignal(this.permissions.snapshot);
  private authenticatedSignal = signal(false);
  private sessionInfoSignal = signal({} as SessionInfo);
  private permissionsLoaded = false;

  redirectUrl = signal('');
  authenticated = this.authenticatedSignal.asReadonly();
  sessionInfo = this.sessionInfoSignal.asReadonly();

  /**
   * The domains where the session user holds at least one grant, sorted — the tenant
   * picker's source. Empty until the session authenticates.
   */
  domains = computed<readonly Domain[]>(() => this.snapshot().domains);

  /**
   * Whether the session user may exercise the scope's permission: true when the digest
   * for the scope's domain (global when omitted) carries the target as granted or
   * conditional — conditional means render the surface and expect the server to
   * narrow it. False when the target is absent or the digest is not loaded (fail
   * closed). Synchronous and signal-backed, so effects and computeds that call it
   * re-evaluate when a digest loads. No scope means no requirement.
   */
  hasPermission(scope?: PermissionScope): boolean {
    if (!scope) {
      return true;
    }
    return this.permissionState(scope) !== undefined;
  }

  /** The digest state for one scope: granted, conditional, or undefined when absent or not loaded. */
  permissionState(scope: PermissionScope): PermissionDigestState | undefined {
    return permissionState(this.snapshot(), scope);
  }

  /**
   * The digest's field-level entries for one resource and permission: JSON field names
   * mapped to granted or conditional — a denied field is absent, and an empty record
   * means the digest carries no field information for the target (see
   * fieldPermissionStates in @cccteam/resource). Signal-backed, so computeds that call
   * it re-evaluate when a digest loads.
   */
  fieldPermissionStates(scope: PermissionScope): Record<string, PermissionDigestState> {
    return fieldPermissionStates(this.snapshot(), scope);
  }

  /** Whether the digest for the domain (global when omitted) has been loaded. */
  hasDigest(domain?: Domain): boolean {
    return this.snapshot().digests.has(domain ?? '');
  }

  /**
   * Answers a permission question, loading the scope's digest first if it is not
   * cached — the asynchronous form for route guards.
   */
  ensurePermission(scope?: PermissionScope): Observable<boolean> {
    if (!scope) {
      return of(true);
    }
    return from(this.permissions.ensure(scope).catch(() => false));
  }

  /**
   * Loads (or reloads) the permission digest for a domain — global when omitted —
   * into the cache. Call it when the user selects a tenant, before rendering that
   * tenant's pages. A failed load caches an empty digest (every question answers false).
   */
  loadDigest(domain?: Domain): Observable<PermissionDigest> {
    return from(this.permissions.loadDigest(domain).catch(() => ({}) as PermissionDigest));
  }

  /** Loads the user's domain list from the generated user-domains endpoint. */
  loadDomains(): Observable<readonly Domain[]> {
    return from(this.permissions.loadDomains().catch(() => [] as Domain[]));
  }

  /** Reloads the domains and every cached digest — after a role change, say. */
  refreshPermissions(): Observable<void> {
    return from(this.permissions.refresh().catch(() => undefined));
  }

  /**
   * Logs a user out and calls the configured logout action.
   *
   * @returns Observable with a boolean indicating whether they were logged out.
   */
  logout(): Observable<boolean> {
    return this.http
      .delete(`${this.apiUrl}/${this.sessionUrl}`, errorOptions(false))
      .pipe(map(() => true))
      .pipe(
        tap(() => {
          try {
            this.logoutAction();
          } catch (error) {
            console.error('Error during logout action (LOGOUT_ACTION token):', error);
          }
          this.authenticatedSignal.set(false);
          this.sessionInfoSignal.set({} as SessionInfo);
          this.clearPermissions();
        }),
      );
  }

  /**
   * Checks a user's session with the server. The first authenticated answer of a
   * session also loads the global permission digest and the user's domains; later
   * checks (keepalives) leave the cached permissions alone.
   *
   * @returns Observable with the user session info
   */
  checkUserSession(): Observable<SessionInfo> {
    return this.http.get<SessionInfo>(`${this.apiUrl}/${this.sessionUrl}`, errorOptions(false)).pipe(
      tap((sessionInfo) => {
        this.authenticatedSignal.set(!!sessionInfo?.authenticated);
        this.sessionInfoSignal.set(sessionInfo);
      }),
      switchMap((sessionInfo) => {
        if (!sessionInfo?.authenticated) {
          this.clearPermissions();
          return of(sessionInfo);
        }
        if (this.permissionsLoaded) return of(sessionInfo);

        this.permissionsLoaded = true;
        return from(
          Promise.all([this.permissions.loadDigest(), this.permissions.loadDomains()]).catch(() => undefined),
        ).pipe(map(() => sessionInfo));
      }),
    );
  }

  loginRoute(): string {
    return this.loginUrl;
  }

  private clearPermissions(): void {
    this.permissionsLoaded = false;
    this.permissions.clear();
  }

  /**
   * The fallback client for apps that provide no RESOURCE_CLIENT: no generated
   * descriptor, just the two library-owned permission routes, over the same
   * interceptor-aware transport.
   */
  private privateClient() {
    return createClient(
      {
        resources: {},
        methods: {},
        permissionDigestRoute: inject(PERMISSION_DIGEST_PATH),
        userDomainsRoute: inject(USER_DOMAINS_PATH),
      },
      { baseUrl: this.apiUrl, transport: httpClientTransport(this.http) },
    );
  }
}
