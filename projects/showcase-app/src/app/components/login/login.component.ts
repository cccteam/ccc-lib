import { Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@cccteam/resource-angular/auth-service';
import { API_URL, BASE_URL, SESSION_PATH } from '@cccteam/resource-angular/types';
import { UiCoreService } from '@cccteam/resource-angular/ui-core-service';
import { IdleService } from '@cccteam/resource-angular/ui-idle-service';
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
  private dialog = inject(MatDialog);

  sessionPath = inject(SESSION_PATH);
  baseUrl = inject(BASE_URL);
  apiUrl = inject(API_URL);

  constructor() {
    this.dialog.closeAll();

    // A refused login returns here with a code, never text; the library holds the sentence.
    this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        this.ui.publishLoginError(params['code']);
      }
    });
    this.auth.logout().subscribe();
    this.idle.stop();
  }

  ngOnDestroy(): void {
    // Ineffective for OIDC, but necessary for other auth methods
    this.idle.start();
  }

  authenticate(): void {
    const encodedUrl = encodeURIComponent(this.getAndResetRedirectUrl());
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
