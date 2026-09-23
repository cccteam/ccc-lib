import { computed, inject, Injectable, signal } from '@angular/core';
import { AlertType, CreateNotificationMessage, LOGIN_MESSAGES } from '@cccteam/resource-angular/types';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';

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

  private loginMessages = inject(LOGIN_MESSAGES);

  publishError(message: CreateNotificationMessage): void {
    this.notifications.addGlobalNotification(message);
  }

  /**
   * The sentence the application holds for a login refusal code (`LOGIN_MESSAGES`), or an
   * empty string for a code it does not know. A login page renders this for the `code`
   * query parameter a refused login arrives with, never the parameter itself. The lookup
   * is by own property, so a key inherited from Object is not a code.
   */
  loginMessage(code: string): string {
    if (!Object.hasOwn(this.loginMessages, code)) {
      return '';
    }
    const message = this.loginMessages[code];
    return typeof message === 'string' ? message : '';
  }

  /**
   * Publishes the sentence for a login refusal code as a global error notification, for a
   * login page that reports through the alert rather than inline. Nothing is published for
   * a code the application does not know.
   * @returns whether the code was known and its sentence published.
   */
  publishLoginError(code: string): boolean {
    const message = this.loginMessage(code);
    if (message === '') {
      return false;
    }
    this.publishError({ message, type: AlertType.ERROR, link: '' });
    return true;
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
