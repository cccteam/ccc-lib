import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  API_URL,
  Domain,
  FRONTEND_LOGIN_PATH,
  LOGOUT_ACTION,
  Permission,
  PERMISSION_DIGEST_PATH,
  PERMISSION_REQUIRED,
  PermissionDigest,
  PermissionDigestState,
  PermissionScope,
  Resource,
  SESSION_PATH,
  SessionInfo,
  USER_DOMAINS_PATH,
} from '@cccteam/ccc-lib/types';
import { errorOptions } from '@cccteam/ccc-lib/util-request-options';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

/** The digest cache key for a scope: the domain, or '' for the global scope. */
const digestKey = (domain?: Domain): string => domain ?? '';

/**
 * Session and permission state for the application.
 *
 * Permissions come from two generated, library-owned endpoints and are cached as
 * signals: the per-scope permission digest (the session user's structural grant
 * enumeration — granted, conditional, or absent for denied) and the user's domains
 * (every tenant where they hold at least one grant — the tenant picker's source).
 * On authentication the global digest and the domains load once; a tenant's digest
 * loads on demand (`loadDigest`) and stays cached. Answers are advisory UI material —
 * what to render — and fail closed: nothing loaded means nothing permitted.
 * Enforcement stays server-side.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = inject(API_URL);
  private loginUrl = inject(FRONTEND_LOGIN_PATH);
  private sessionUrl = inject(SESSION_PATH);
  private digestUrl = inject(PERMISSION_DIGEST_PATH);
  private domainsUrl = inject(USER_DOMAINS_PATH);
  private logoutAction = inject(LOGOUT_ACTION);

  http = inject(HttpClient);
  private authenticatedSignal = signal(false);
  private sessionInfoSignal = signal({} as SessionInfo);
  private digestsSignal = signal<ReadonlyMap<string, PermissionDigest>>(new Map());
  private domainsSignal = signal<Domain[]>([]);
  private permissionsLoaded = false;

  redirectUrl = signal('');
  authenticated = this.authenticatedSignal.asReadonly();
  sessionInfo = this.sessionInfoSignal.asReadonly();

  /**
   * The domains where the session user holds at least one grant, sorted — the tenant
   * picker's source. Empty until the session authenticates.
   */
  domains = this.domainsSignal.asReadonly();

  constructor() {
    this.initializePermissionFn();
  }

  private static permissionFn: (resource: Resource, permission: Permission) => boolean;

  /**
   * Whether the session user may exercise the scope's permission: true when the digest
   * for the scope's domain (global when omitted) carries the target as granted or
   * conditional — conditional means render the surface and expect the server to
   * narrow it. False when the target is absent or the digest is not loaded (fail
   * closed). Synchronous and signal-backed, so effects and computeds that call it
   * re-evaluate when a digest loads. No scope means no requirement.
   */
  hasPermission(scope?: PermissionScope): boolean {
    if (!scope) return true;
    return this.permissionState(scope) !== undefined;
  }

  /**
   * The digest state for a scope's target: `granted`, `conditional`, or undefined for
   * denied or not loaded.
   */
  permissionState(scope: PermissionScope): PermissionDigestState | undefined {
    return this.digestsSignal().get(digestKey(scope.domain))?.[scope.resource]?.[scope.permission];
  }

  /** Whether the digest for a domain (global when omitted) has been loaded. */
  hasDigest(domain?: Domain): boolean {
    return this.digestsSignal().has(digestKey(domain));
  }

  /**
   * Answers hasPermission after making sure the scope's digest is loaded — the
   * route guard's question, so a deep link into a tenant route resolves without the
   * application prefetching anything.
   */
  ensurePermission(scope?: PermissionScope): Observable<boolean> {
    if (!scope) return of(true);
    if (this.hasDigest(scope.domain)) return of(this.hasPermission(scope));

    return this.loadDigest(scope.domain).pipe(map(() => this.hasPermission(scope)));
  }

  /**
   * Loads and caches the permission digest for a domain (global when omitted).
   * Applications call it when the user selects a tenant; an unreadable digest caches
   * as empty, so the scope fails closed rather than erroring.
   */
  loadDigest(domain?: Domain): Observable<PermissionDigest> {
    const params = domain ? new HttpParams().set('domain', domain) : new HttpParams();

    return this.http
      .get<PermissionDigest>(`${this.apiUrl}/${this.digestUrl}`, { ...errorOptions(false), params })
      .pipe(
        catchError(() => of({} as PermissionDigest)),
        tap((digest) => {
          this.digestsSignal.update((digests) => new Map(digests).set(digestKey(domain), digest ?? {}));
        }),
      );
  }

  /** Loads the session user's domains into the `domains` signal. */
  loadDomains(): Observable<Domain[]> {
    return this.http.get<Domain[]>(`${this.apiUrl}/${this.domainsUrl}`, errorOptions(false)).pipe(
      catchError(() => of([] as Domain[])),
      tap((domains) => this.domainsSignal.set(domains ?? [])),
    );
  }

  /**
   * Reloads the domains and every cached digest — after the user's roles change.
   */
  refreshPermissions(): Observable<void> {
    const cached = [...this.digestsSignal().keys()].map((key) => this.loadDigest(key === '' ? undefined : (key as Domain)));

    return forkJoin([this.loadDomains(), ...cached]).pipe(map(() => undefined));
  }

  static requiresPermission(resource: Resource, permission: Permission): boolean {
    if (!AuthService.permissionFn) {
      throw new Error(
        `AuthState has not been initialized. Ensure AuthState is provided in your module or instantiated at least once.`,
      );
    }
    return AuthService.permissionFn(resource, permission);
  }

  private initializePermissionFn(): void {
    if (!AuthService.permissionFn) {
      AuthService.permissionFn = inject(PERMISSION_REQUIRED);
    }
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
        return forkJoin([this.loadDigest(), this.loadDomains()]).pipe(map(() => sessionInfo));
      }),
    );
  }

  loginRoute(): string {
    return this.loginUrl;
  }

  private clearPermissions(): void {
    this.permissionsLoaded = false;
    this.digestsSignal.set(new Map());
    this.domainsSignal.set([]);
  }
}
