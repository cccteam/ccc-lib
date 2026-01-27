import { computed, inject, Injectable, OnDestroy, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';
import {
  AlertLevel,
  FRONTEND_LOGIN_PATH,
  IDLE_KEEPALIVE_DURATION,
  IDLE_LOGOUT_ACTION,
  IDLE_SESSION_DURATION,
  IDLE_WARNING_DURATION,
} from '@cccteam/ccc-lib/types';
import { UiCoreService } from '@cccteam/ccc-lib/ui-core-service';
import { NotificationService } from '@cccteam/ccc-lib/ui-notification-service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IdleService implements OnDestroy {
  private auth = inject(AuthService);
  private core = inject(UiCoreService);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private readonly loginPath = inject(FRONTEND_LOGIN_PATH);

  private readonly sessionDuration = inject(IDLE_SESSION_DURATION);
  private readonly logoutAction = inject(IDLE_LOGOUT_ACTION);
  private readonly warningDuration = inject(IDLE_WARNING_DURATION);
  private readonly keepAliveDuration = inject(IDLE_KEEPALIVE_DURATION);
  private readonly idleCheckFrequency = 1000;
  private readonly warningThreshold = this.sessionDuration - this.warningDuration;

  public readonly isActive = signal(false);
  private lastActivityTimestamp: WritableSignal<number> = signal(0);
  private tick = signal(Date.now());

  public readonly secondsIdle = computed(() => {
    if (!this.isActive() || this.lastActivityTimestamp() === 0) {
      return 0;
    }
    // Depends on tick() to force re-evaluation as time passes
    return Math.floor((this.tick() - this.lastActivityTimestamp()) / 1000);
  });

  public readonly isWarning = computed(() => this.secondsIdle() >= this.warningThreshold);
  public readonly countdown = computed(() => {
    if (!this.isWarning()) {
      return 0;
    }
    const remaining = this.sessionDuration - this.secondsIdle();
    return Math.max(0, remaining);
  });

  private alertId: number | undefined;
  private mainTickerSubscription: Subscription | undefined;

  private readonly activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  constructor() {
    interval(this.keepAliveDuration * 1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.checkSession());
  }

  ngOnDestroy(): void {
    this.stop();
  }

  /**
   * Starts the idle monitoring service.
   */
  start(): void {
    if (this.isActive()) {
      return;
    }
    this.isActive.set(true);
    this.lastActivityTimestamp.set(Date.now());
    this.addActivityListeners();
    this.startMainTicker();
  }

  /**
   * Stops the idle monitoring service and cleans up timers and alerts.
   */
  stop(): void {
    this.isActive.set(false);
    this.mainTickerSubscription?.unsubscribe();
    this.removeActivityListeners();
    this.dismissWarningAlert();
  }

  /**
   * Logs out the user due to inactivity, calls the configured logout action, and stops the service.
   */
  logoutAndStop(): void {
    try {
      this.logoutAction();
    } catch (error) {
      console.error('Error during idle logout action (IDLE_LOGOUT_ACTION token):', error);
    }
    this.stop();

    this.router.navigate([this.loginPath]);
    this.core.publishError({
      message: 'You have been logged out due to inactivity.',
      level: AlertLevel.INFO,
      link: '',
    });
  }

  private startMainTicker(): void {
    this.mainTickerSubscription = interval(this.idleCheckFrequency).subscribe(() => {
      this.tick.set(Date.now());

      if (this.secondsIdle() >= this.sessionDuration) {
        this.logoutAndStop();
        return;
      }

      if (this.isWarning()) {
        this.showOrUpdateWarningAlert(this.countdown());
      } else {
        this.dismissWarningAlert();
      }
    });
  }

  private checkSession(): void {
    if (this.auth.authenticated()) {
      this.auth.checkUserSession().subscribe({
        next: () => {
          if (!this.auth.authenticated()) {
            this.logoutAndStop();
          }
        },
      });
    }
  }

  setLastActivity(): void {
    this.lastActivityTimestamp.set(Date.now());
  }
  boundActivity = this.setLastActivity.bind(this);

  private addActivityListeners(): void {
    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.boundActivity, true);
    });
  }

  private removeActivityListeners(): void {
    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.boundActivity, true);
    });
  }

  private showOrUpdateWarningAlert(countdown: number): void {
    const message = `You will be logged out in ${countdown} seconds due to inactivity.`;
    if (this.alertId !== undefined) {
      this.notifications.updateNotification({ id: this.alertId, level: AlertLevel.INFO, link: '', message });
    } else {
      this.alertId = this.notifications.addGlobalNotification({
        message,
        level: AlertLevel.INFO,
        link: '',
      });
    }
  }

  private dismissWarningAlert(): void {
    if (this.alertId !== undefined) {
      this.notifications.dismissGlobalNotificationById(this.alertId);
      this.alertId = undefined;
    }
  }
}
