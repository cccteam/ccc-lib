import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@cccteam/resource-angular/auth-service';
import { AlertComponent } from '@cccteam/resource-angular/ui-alert';
import { UiCoreService } from '@cccteam/resource-angular/ui-core-service';
import { IdleService } from '@cccteam/resource-angular/ui-idle-service';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';
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
