import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterOutlet } from '@angular/router';
import { IdleService } from '@cccteam/ccc-lib';
import { AlertComponent, AuthService, NotificationService, UiCoreService } from '@cccteam/ccc-lib';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatProgressBarModule, AlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  core = inject(UiCoreService);
  private idle = inject(IdleService);
  public notifications = inject(NotificationService);

  title = 'CCC Demo App';

  constructor() {
    this.idle.start();
  }

  logout(): void {
    this.idle.stop();
    this.auth
      .logout()
      .pipe(tap(() => this.router.navigate(['/login'])))
      .subscribe();
  }
}
