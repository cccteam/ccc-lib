import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';
import { AlertType, API_URL, BASE_URL, SESSION_PATH } from '@cccteam/ccc-lib/types';
import { UiCoreService } from '@cccteam/ccc-lib/ui-core-service';
import { IdleService } from '@cccteam/ccc-lib/ui-idle-service';
import { catchError, EMPTY, tap } from 'rxjs';
import { PaneComponent } from '../shared/pane/pane.component';

interface LoginFormData {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    PaneComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormField,
  ],
})
export class LoginComponent implements OnDestroy {
  private ui = inject(UiCoreService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private idle = inject(IdleService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  sessionPath = inject(SESSION_PATH);
  baseUrl = inject(BASE_URL);
  apiUrl = inject(API_URL);

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  loginFormModel = signal<LoginFormData>({
    username: '',
    password: '',
  });

  loginForm = form(this.loginFormModel, (schemaPath) => {
    required(schemaPath.username, {
      message: 'Invalid email.',
    });
    email(schemaPath.username, {
      message: 'Invalid email.',
    });
    required(schemaPath.password, {
      message: 'Password is required',
    });
  });

  constructor() {
    this.dialog.closeAll();

    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.ui.publishError({ message: params['message'], type: AlertType.ERROR, link: '' });
      }
    });
    this.idle.stop();
  }

  ngOnDestroy(): void {
    // Ineffective for OIDC, but necessary for other auth methods
    this.idle.start();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    void this.authenticate();
  }

  authenticate(): void {
    this.loginForm().markAsTouched();
    if (this.loginForm().invalid()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.http
      .post('/api/user/session', this.loginFormModel())
      .pipe(
        tap(() => this.router.navigate(['dashboard'])),
        catchError(() => {
          this.error.set('Invalid username or password.');
          return EMPTY;
        }),
      )
      .subscribe();
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
