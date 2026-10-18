import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input, OnInit, output, PendingTasks, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { LoginMethod, PendingSignIn, SignInRefusal, SignInResult } from '@cccteam/resource';
import { AuthService } from '@cccteam/resource-angular/auth-service';
import { RESOURCE_CLIENT, storeSignal } from '@cccteam/resource-angular/resource-client';
import { FRONTEND_LOGIN_PATH } from '@cccteam/resource-angular/types';
import { UiCoreService } from '@cccteam/resource-angular/ui-core-service';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * The login page's sign-in methods, rendered from what the server offers. On arrival the
 * component reads the methods list through the application's client and renders it: the
 * password form when the list has a password method, and one button per redirect method,
 * in the server's order; nothing it shows is named here, so the bundle is the same in
 * every environment and a method that is not registered has no button. The server's label
 * is the default for each method and `labels` overrides it by registration name; nothing
 * else about a method is the page's to change.
 *
 * It owns the journey from the list to the session. A password sign-in posts through the
 * client, which reads the list again first so the POST carries a live XSRF token; the
 * session established, the component checks it through AuthService (loading the digest,
 * the domains and the feature flags) and emits `signedIn` with the router URL of the page
 * to go to: the page the login guard turned away from, else `home`. The page navigates
 * there and starts whatever it starts on a sign-in (the idle service). A redirect method
 * sends the browser to the method's path, naming the same page as the one to return to;
 * the server's callback brings the browser back there signed in, or back to this page with
 * `?code=` for a refusal or `?pending=` for a step that waits.
 *
 * A refusal arriving in the URL renders the sentence the application holds for the code
 * (`LOGIN_MESSAGES`, through UiCoreService) and nothing for a code it does not know; one
 * the server answers on a step renders that sentence when it carries a code, and the
 * server's words otherwise (a wrong password). A pending step, entered with `?pending=` or
 * answered to a password sign-in, is read from the pending status route and takes the
 * list's place: for a confirmation, the password form of the user the sign-in matched,
 * posting to the confirmation route, with a cancel that returns to the list; for a step
 * the server names a page for, the browser goes there. Everything around the methods, the
 * branding, a manifest, a forgotten-password link, is the page's, composed around the
 * component.
 */
@Component({
  selector: 'ccc-login-methods',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login-methods.component.html',
  styleUrl: './login-methods.component.scss',
})
export class LoginMethodsComponent implements OnInit {
  private client = inject(RESOURCE_CLIENT);
  private auth = inject(AuthService);
  private ui = inject(UiCoreService);
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  private loginPath = inject(FRONTEND_LOGIN_PATH);
  /** Every request is registered as pending work, so the application is stable only once it has answered. */
  private pendingTasks = inject(PendingTasks);

  /** The application's own words for a method, by registration name; the server's label otherwise. */
  labels = input<Readonly<Record<string, string>>>({});
  /** The router URL a sign-in lands on when the login guard recorded no page: the root by default. */
  home = input('/');
  /** The sign-in is complete and the session checked: the router URL of the page to go to. */
  signedIn = output<string>();
  /** The person cancelled the pending step; the list is shown again. */
  cancelled = output<void>();

  username = '';
  password = '';
  confirmation = '';
  /** A request of the component is in flight; its controls are disabled meanwhile. */
  busy = signal(false);

  /** The methods list as the client last read it; undefined before the first read answers. */
  private list = storeSignal(this.client.auth.snapshot);
  /** The methods the server offers, in its order; empty until the list answers. */
  methods = computed<readonly LoginMethod[]>(() => this.list()?.methods ?? []);
  /** The password form's method, when the server offers one. */
  passwordMethod = computed(() => this.methods().find((method) => method.kind === 'password'));
  /** The redirect methods, one button each, in the server's order. */
  redirectMethods = computed(() => this.methods().filter((method) => method.kind === 'redirect'));
  /** The step the sign-in waits on, taking the list's place; undefined while the list is shown. */
  pending = signal<PendingSignIn | undefined>(undefined);

  /** The refusal code the URL carries, or empty: the only thing the URL says. */
  private code = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('code') ?? '')), {
    initialValue: '',
  });
  /** The sentence of a refusal answered on a step, or empty; it replaces the URL's once a step has run. */
  private refusal = signal<string | undefined>(undefined);
  /** The refusal sentence on screen: a step's answer once there is one, else the sentence held for the URL's code. */
  message = computed(() => this.refusal() ?? this.ui.loginMessage(this.code()));

  ngOnInit(): void {
    void this.tracked(() => this.arrive());
  }

  /** The words for a method: the application's override by name, else the server's label. */
  labelOf(method: LoginMethod): string {
    return this.labels()[method.name] ?? method.label;
  }

  /** Posts the password form: the session, a pending step, or a refusal rendered in place. */
  login(): Promise<void> {
    const method = this.passwordMethod();
    if (this.busy() || !method) {
      return Promise.resolve();
    }
    return this.step(async () => {
      const result = await this.client.auth.signInWithPassword(method, {
        username: this.username,
        password: this.password,
      });
      await this.follow(result, () => this.landing());
    });
  }

  /** Sends the browser to a redirect method's path, naming the page the sign-in returns to. */
  signInThrough(method: LoginMethod): void {
    if (this.busy()) {
      return;
    }
    this.leaveFor(this.client.auth.signInUrl(method, this.browserPath(this.landing())));
  }

  /** Confirms the pending sign-in with the password of the user it matched. */
  confirm(): Promise<void> {
    const waiting = this.pending();
    if (this.busy() || !waiting) {
      return Promise.resolve();
    }
    return this.step(async () => {
      const result = await this.client.auth.confirmPending(this.confirmation);
      await this.follow(result, () => (waiting.returnUrl ? this.routerUrl(waiting.returnUrl) : this.landing()));
    });
  }

  /** Discards the pending sign-in and shows the list again. */
  cancel(): Promise<void> {
    if (this.busy() || !this.pending()) {
      return Promise.resolve();
    }
    return this.step(async () => {
      await this.client.auth.cancelPending();
      this.pending.set(undefined);
      this.confirmation = '';
      this.cancelled.emit();
    });
  }

  /** Reads the list, the page's first request, and the pending step when the URL says one waits. */
  private async arrive(): Promise<void> {
    try {
      await this.client.auth.methods();
      if (this.route.snapshot.queryParamMap.has('pending')) {
        await this.readPending();
      }
    } catch (error) {
      this.refusal.set(messageOf(error));
    }
  }

  /**
   * Reads the pending status and renders what it says: the step while one waits, the list
   * with the refusal's sentence (`pending_expired`) when the sign-in is gone, the list alone
   * when none waits.
   */
  private async readPending(): Promise<void> {
    const status = await this.client.auth.pending();
    switch (status.outcome) {
      case 'waiting':
        this.pending.set({
          reason: status.reason,
          email: status.email,
          expiresAt: status.expiresAt,
          returnUrl: status.returnUrl,
          ...(status.factors ? { factors: status.factors } : {}),
        });
        return;
      case 'none':
        this.pending.set(undefined);
        return;
      case 'refused':
        this.pending.set(undefined);
        this.refusal.set(this.sentenceOf(status));
        return;
    }
  }

  /**
   * Acts on a step's result: the session is checked and `signedIn` emitted with the page
   * `page` names; a pending step is read, or the browser sent where the server chose; a
   * refusal is rendered, and one that ends the pending sign-in returns to the list.
   */
  private async follow(result: SignInResult, page: () => string): Promise<void> {
    switch (result.outcome) {
      case 'session':
        await this.complete(page());
        return;
      case 'pending':
        if (result.redirectUrl) {
          this.leaveFor(result.redirectUrl);
          return;
        }
        this.confirmation = '';
        await this.readPending();
        return;
      case 'refused':
        if (result.code === 'pending_expired' || result.status === 404 || result.status === 409) {
          this.pending.set(undefined);
        }
        this.refusal.set(this.sentenceOf(result));
        return;
    }
  }

  /** Checks the session the step established and hands the page on; a check that finds none renders the library's sentence. */
  private async complete(page: string): Promise<void> {
    const session = await firstValueFrom(this.auth.checkUserSession());
    if (!session?.authenticated) {
      this.refusal.set(this.ui.loginMessage('internal_error'));
      return;
    }
    this.password = '';
    this.confirmation = '';
    this.pending.set(undefined);
    this.refusal.set(undefined);
    this.signedIn.emit(page);
  }

  /** The sentence for a refusal: the one the application holds for its code, else the server's words. */
  private sentenceOf(refusal: SignInRefusal): string {
    const held = refusal.code === undefined ? '' : this.ui.loginMessage(refusal.code);
    return held || refusal.message;
  }

  /** Runs one step of the journey as pending work, busy meanwhile, rendering a failure in place. */
  private step(work: () => Promise<void>): Promise<void> {
    return this.tracked(async () => {
      this.busy.set(true);
      this.refusal.set(undefined);
      try {
        await work();
      } catch (error) {
        this.refusal.set(messageOf(error));
      } finally {
        this.busy.set(false);
      }
    });
  }

  /** Runs one piece of work as a pending task of the application, released when it settles. */
  private async tracked<T>(work: () => Promise<T>): Promise<T> {
    const release = this.pendingTasks.add();
    try {
      return await work();
    } finally {
      release();
    }
  }

  /** The router URL a sign-in lands on: the page the login guard turned away from, read once, else `home`. */
  private landing(): string {
    const recorded = this.auth.redirectUrl();
    this.auth.redirectUrl.set('');
    if (recorded === '' || recorded.startsWith(this.loginPath)) {
      return this.home();
    }
    return recorded;
  }

  /** The browser path of a router URL: resolved against the document's base, the application's mount. */
  private browserPath(url: string): string {
    const resolved = new URL(url.replace(/^\//, ''), this.document.baseURI);
    return resolved.pathname + resolved.search;
  }

  /** The router URL of a browser path the server reported: the path under the document's base, else the path itself. */
  private routerUrl(path: string): string {
    const base = new URL(this.document.baseURI).pathname;
    return base !== '/' && path.startsWith(base) ? `/${path.slice(base.length)}` : path;
  }

  /** Sends the browser to a URL: a redirect method's, or the page the server chose for a pending step. */
  protected leaveFor(url: string): void {
    this.document.location.assign(url);
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
