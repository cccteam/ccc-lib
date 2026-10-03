import { TestBed } from '@angular/core/testing';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';
import { Subject } from 'rxjs';

import {
  AppReloader,
  AppUpdateService,
  provideAppUpdate,
  RELOAD_LABEL,
  UNRECOVERABLE_MESSAGE,
  UPDATE_CHECK_INTERVAL,
  VERSION_READY_MESSAGE,
} from './app-update.service';

// The update service over a fake worker: a ready event raises one persistent notice with
// Reload, Reload goes through the seam, an unrecoverable state raises its notice, an absent
// or disabled worker leaves everything inert, the hourly check runs only while the tab is
// visible, and reloadWhenReady() reloads on the next ready event with no notice, or at once
// when a version is already ready.

class FakeSwUpdate {
  readonly versionUpdates = new Subject<VersionEvent>();
  readonly unrecoverable = new Subject<UnrecoverableStateEvent>();
  isEnabled = true;
  checks = 0;
  /** What the next checks answer: whether a new version was found and is ready. */
  found = false;

  async checkForUpdate(): Promise<boolean> {
    this.checks++;
    return this.found;
  }

  ready(): void {
    this.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    });
  }
}

class FakeReloader {
  reloads = 0;

  reload(): void {
    this.reloads++;
  }
}

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(state: DocumentVisibilityState): void {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

/** The service as provideAppUpdate() starts it, over the given worker (none when null). */
function start(worker: FakeSwUpdate | null): { service: AppUpdateService; reloader: FakeReloader } {
  TestBed.configureTestingModule({
    providers: [
      ...(worker ? [{ provide: SwUpdate, useValue: worker }] : []),
      { provide: AppReloader, useClass: FakeReloader },
      provideAppUpdate(),
    ],
  });
  return { service: TestBed.inject(AppUpdateService), reloader: TestBed.inject(AppReloader) as unknown as FakeReloader };
}

function notices(): { message: string; persistent?: boolean; action?: { label: string; run: () => void } }[] {
  return TestBed.inject(NotificationService)
    .notifications()
    .map((n) => ({ message: n.message, persistent: n.persistent, action: n.action }));
}

describe('AppUpdateService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    delete (document as { visibilityState?: unknown }).visibilityState;
  });

  describe('the notices', () => {
    it('a ready event raises one persistent notice with Reload, and a second ready event adds none', () => {
      const worker = new FakeSwUpdate();
      const { service } = start(worker);
      worker.ready();
      worker.ready();
      expect(service.ready()).toBe(true);
      expect(notices()).toEqual([
        { message: VERSION_READY_MESSAGE, persistent: true, action: expect.objectContaining({ label: RELOAD_LABEL }) },
      ]);
    });

    it('the Reload action reloads through the seam', () => {
      const worker = new FakeSwUpdate();
      const { reloader } = start(worker);
      worker.ready();
      notices()[0].action?.run();
      expect(reloader.reloads).toBe(1);
    });

    it('an unrecoverable state raises its notice with Reload', () => {
      const worker = new FakeSwUpdate();
      const { reloader } = start(worker);
      worker.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'a file of this version is gone' });
      expect(notices()).toEqual([
        { message: UNRECOVERABLE_MESSAGE, persistent: true, action: expect.objectContaining({ label: RELOAD_LABEL }) },
      ]);
      notices()[0].action?.run();
      expect(reloader.reloads).toBe(1);
    });

    it('other version events raise nothing', () => {
      const worker = new FakeSwUpdate();
      start(worker);
      worker.versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });
      worker.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: 'old' } });
      expect(notices()).toEqual([]);
    });
  });

  describe('an absent or disabled worker', () => {
    const cases: { name: string; worker: () => FakeSwUpdate | null }[] = [
      { name: 'no worker provided', worker: () => null },
      {
        name: 'a disabled worker',
        worker: () => {
          const worker = new FakeSwUpdate();
          worker.isEnabled = false;
          return worker;
        },
      },
    ];

    for (const tt of cases) {
      it(`${tt.name} is inert and starts no timer`, async () => {
        const worker = tt.worker();
        const { service, reloader } = start(worker);
        expect(service.enabled).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(2 * UPDATE_CHECK_INTERVAL);
        expect(worker?.checks ?? 0).toBe(0);
        await expect(service.checkNow()).resolves.toBe(false);
        service.reloadWhenReady();
        expect(reloader.reloads).toBe(0);
        expect(notices()).toEqual([]);
      });
    }
  });

  describe('the checks', () => {
    it('run hourly while the tab is visible, stop while it is hidden, and run once when it is visible again', async () => {
      const worker = new FakeSwUpdate();
      start(worker);
      expect(worker.checks).toBe(0);

      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL);
      expect(worker.checks).toBe(1);
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL);
      expect(worker.checks).toBe(2);

      setVisibility('hidden');
      await vi.advanceTimersByTimeAsync(3 * UPDATE_CHECK_INTERVAL);
      expect(worker.checks).toBe(2);

      setVisibility('visible');
      await vi.advanceTimersByTimeAsync(0);
      expect(worker.checks).toBe(3);
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL);
      expect(worker.checks).toBe(4);
    });

    it('a tab hidden at start runs no timer until it is visible', async () => {
      visibility = 'hidden';
      const worker = new FakeSwUpdate();
      start(worker);
      await vi.advanceTimersByTimeAsync(2 * UPDATE_CHECK_INTERVAL);
      expect(worker.checks).toBe(0);
      setVisibility('visible');
      await vi.advanceTimersByTimeAsync(0);
      expect(worker.checks).toBe(1);
    });

    it('checkNow answers what the worker found and swallows a failed check', async () => {
      const worker = new FakeSwUpdate();
      const { service } = start(worker);
      await expect(service.checkNow()).resolves.toBe(false);
      worker.found = true;
      await expect(service.checkNow()).resolves.toBe(true);
      worker.checkForUpdate = () => Promise.reject(new Error('offline'));
      await expect(service.checkNow()).resolves.toBe(false);
    });
  });

  describe('reloadWhenReady', () => {
    it('checks, then reloads on the ready event with no notice', async () => {
      const worker = new FakeSwUpdate();
      const { service, reloader } = start(worker);
      service.reloadWhenReady();
      await vi.advanceTimersByTimeAsync(0);
      expect(worker.checks).toBe(1);
      expect(reloader.reloads).toBe(0);
      worker.ready();
      expect(reloader.reloads).toBe(1);
      expect(notices()).toEqual([]);
    });

    it('reloads at once when a version is already ready, with no further check', async () => {
      const worker = new FakeSwUpdate();
      const { service, reloader } = start(worker);
      worker.ready();
      expect(notices().length).toBe(1);
      service.reloadWhenReady();
      await vi.advanceTimersByTimeAsync(0);
      expect(reloader.reloads).toBe(1);
      expect(worker.checks).toBe(0);
    });
  });
});
