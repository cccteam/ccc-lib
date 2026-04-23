import { computed, inject, Injectable, signal } from '@angular/core';
import { AlertType, CreateNotificationMessage, LOGIN_ERROR_MESSAGES } from '@cccteam/ccc-lib/types';
import { NotificationService } from '@cccteam/ccc-lib/ui-notification-service';

@Injectable({
  providedIn: 'root',
})
export class UiCoreService {
  notifications = inject(NotificationService);
  loadingSignal = signal([] as string[]);
  sidenavOpened = signal(true);
  currentSidenavIdentifier = signal('');

  private loading = this.loadingSignal.asReadonly();
  isLoading = computed(() => this.loading().length > 0);

  private loginErrorMessages = inject(LOGIN_ERROR_MESSAGES);

  publishError(message: CreateNotificationMessage): void {
    this.notifications.addGlobalNotification(message);
  }

  /**
   * Publishes an error from an untrusted source (e.g., URL query parameter) by looking up
   * the code in `LOGIN_ERROR_MESSAGES`. Unknown codes are silently ignored.
   * @param code The message code to look up.
   * @returns true if the message was published, false if the code was not recognized.
   */
  publishLoginError(code: string): boolean {
    const safeMessage = this.loginErrorMessages[code];
    if (safeMessage) {
      this.publishError({ message: safeMessage, type: AlertType.ERROR, link: '' });
      return true;
    }
    return false;
  }

  beginActivity(process: string): void {
    if (!this.loading().includes(process)) {
      this.loadingSignal.update((current) => [...current, process]);
    }
  }

  endActivity(process: string): void {
    this.loadingSignal.update((current) => current.filter((p) => p !== process));
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }
}
