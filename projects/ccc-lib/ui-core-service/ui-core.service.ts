import { computed, inject, Injectable, signal } from '@angular/core';
import { CreateNotificationMessage } from '@cccteam/ccc-lib/types';
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

  publishError(message: CreateNotificationMessage): void {
    this.notifications.addGlobalNotification(message);
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
