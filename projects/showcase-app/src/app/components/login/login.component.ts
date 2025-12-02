import { Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { AlertLevel, API_URL, AuthService, BASE_URL, IdleService, SESSION_PATH, UiCoreService } from '@cccteam/ccc-lib';
import { PaneComponent } from '../shared/pane/pane.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [PaneComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
})
export class LoginComponent implements OnDestroy {
  private ui = inject(UiCoreService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private idle = inject(IdleService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  sessionPath = inject(SESSION_PATH);
  baseUrl = inject(BASE_URL);
  apiUrl = inject(API_URL)

  constructor() {
    this.dialog.closeAll();

    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.ui.publishError({ message: params['message'], level: AlertLevel.ERROR, link: '' });
      }
    });
    this.authService.logout().subscribe();
    this.idle.stop();
  }

  ngOnDestroy(): void {
    // Ineffective for OIDC, but necessary for other auth methods
    this.idle.start();
  }

  authenticate(): void {
    const encodedUrl = encodeURIComponent(this.getAndResetRedirectUrl());
    console.log('Redirecting to login', `${this.apiUrl}/${this.sessionPath}?returnUrl=${encodedUrl}`);
    window.location.href = `/api/user/login?returnUrl=${encodedUrl}`;
  }

  /**
   * Retrieves the current redirect url and then resets it in the state.
   * @returns string with the redirect url.
   */
  getAndResetRedirectUrl(): string {
    const redirectUrl = this.auth.redirectUrl();
    this.auth.redirectUrl.set(this.baseUrl);
    if (redirectUrl === '') {
      return this.baseUrl;
    }
    return redirectUrl;
  }
}
