import {
  DestroyRef,
  DOCUMENT,
  EnvironmentProviders,
  inject,
  Injectable,
  makeEnvironmentProviders,
  NgZone,
  provideEnvironmentInitializer,
  signal,
  Signal,
} from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { AlertType } from '@cccteam/resource-angular/types';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';

/** The notice raised when the service worker has a new version of the application ready. */
export const VERSION_READY_MESSAGE = 'A new version of this application is ready.';

/** The notice raised when the service worker reports a state only a reload recovers from. */
export const UNRECOVERABLE_MESSAGE = 'This application needs to be reloaded to keep working.';

/** How often a visible tab asks the service worker to check for a new version: an hour. */
export const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

/** The label of the action every update notice carries. */
export const RELOAD_LABEL = 'Reload';

/**
 * The one way the library reloads the document. AppUpdateService calls it, the update
 * notices' Reload action calls it, and a spec replaces it to observe a reload instead of
 * losing the page.
 */
@Injectable({ providedIn: 'root' })
export class AppReloader {
  private document = inject(DOCUMENT);

  /** Reloads the document. */
  reload(): void {
    this.document.defaultView?.location.reload();
  }
}

/**
 * Tells the person when a new build of the application is ready and reloads only when
 * they choose. It listens to the service worker (`SwUpdate` from @angular/service-worker)
 * and is inert when no worker is provided or the worker is disabled, as it is in dev mode
 * and in component specs. When the worker has a new version ready it raises one persistent
 * notice, VERSION_READY_MESSAGE, with a Reload action; when the worker reports an
 * unrecoverable state it raises UNRECOVERABLE_MESSAGE the same way. Both reload through
 * AppReloader. Checks run hourly while the tab is visible and whenever it becomes visible
 * again, none while it is hidden, with the timer outside Angular's zone so it never keeps
 * the application from settling; the worker itself checks after every page load.
 *
 * `provideAppUpdate()` starts it. The seam the version refusal uses is `ready`,
 * `checkNow()`, `reload()`, and `reloadWhenReady()`.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly worker = inject(SwUpdate, { optional: true });
  private readonly notifications = inject(NotificationService);
  private readonly reloader = inject(AppReloader);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private readonly readySignal = signal(false);
  /** True once the worker has a new version of the application ready to serve on the next load. */
  readonly ready: Signal<boolean> = this.readySignal.asReadonly();

  private reloadOnReady = false;
  private reloading = false;
  private started = false;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    if (!this.worker || !this.enabled) {
      return;
    }
    const subscriptions = [
      this.worker.versionUpdates.subscribe((event) => this.onVersionEvent(event)),
      this.worker.unrecoverable.subscribe(() => this.raiseReloadNotice(UNRECOVERABLE_MESSAGE)),
    ];
    inject(DestroyRef).onDestroy(() => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.stopTimer();
      this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    });
  }

  /** Whether a service worker is provided and enabled; without one every method here does nothing. */
  get enabled(): boolean {
    return this.worker?.isEnabled === true;
  }

  /**
   * Starts the periodic checks: hourly while the tab is visible, and once whenever it
   * becomes visible again. provideAppUpdate() calls it; a second call does nothing.
   */
  start(): void {
    if (this.started || !this.enabled) {
      return;
    }
    this.started = true;
    this.zone.runOutsideAngular(() => {
      this.document.addEventListener('visibilitychange', this.onVisibilityChange);
      if (this.visible) {
        this.startTimer();
      }
    });
  }

  /**
   * Asks the worker to check for a new version now. Resolves true when one was found and
   * is ready to activate, false when there is none, when the check fails, or when there is
   * no worker.
   */
  async checkNow(): Promise<boolean> {
    if (!this.worker || !this.enabled) {
      return false;
    }
    try {
      return await this.worker.checkForUpdate();
    } catch {
      return false;
    }
  }

  /** Reloads the document through AppReloader. */
  reload(): void {
    this.reloading = true;
    this.reloader.reload();
  }

  /**
   * Reloads onto the new version as soon as the worker has one ready, with no notice: at
   * once when a version is already ready, else after a check, on the ready event. Without
   * a worker nothing happens; the caller decides what a build with no worker does.
   */
  reloadWhenReady(): void {
    if (this.readySignal()) {
      this.reload();
      return;
    }
    if (!this.enabled) {
      return;
    }
    this.reloadOnReady = true;
    void this.checkNow();
  }

  private onVersionEvent(event: VersionEvent): void {
    if (event.type !== 'VERSION_READY') {
      return;
    }
    this.readySignal.set(true);
    if (this.reloadOnReady) {
      if (!this.reloading) {
        this.reload();
      }
      return;
    }
    this.raiseReloadNotice(VERSION_READY_MESSAGE);
  }

  private raiseReloadNotice(message: string): void {
    this.notifications.addGlobalNotification({
      message,
      type: AlertType.INFO,
      link: '',
      persistent: true,
      action: { label: RELOAD_LABEL, run: () => this.reload() },
    });
  }

  private get visible(): boolean {
    return this.document.visibilityState !== 'hidden';
  }

  private readonly onVisibilityChange = (): void => {
    if (this.visible) {
      void this.checkNow();
      this.startTimer();
    } else {
      this.stopTimer();
    }
  };

  private startTimer(): void {
    if (this.timer !== undefined) {
      return;
    }
    this.timer = setInterval(() => {
      void this.checkNow();
    }, UPDATE_CHECK_INTERVAL);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

/**
 * Starts AppUpdateService with the application: add it to the application's providers
 * beside provideServiceWorker. No component references the service; the notices it raises
 * render in the alert area every application already has.
 */
export function provideAppUpdate(): EnvironmentProviders {
  return makeEnvironmentProviders([provideEnvironmentInitializer(() => inject(AppUpdateService).start())]);
}
