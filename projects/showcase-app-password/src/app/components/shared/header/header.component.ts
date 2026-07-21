import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/auth-service';
import { finalize, switchMap } from 'rxjs';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterModule, TopbarComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  location = inject(Location);

  isPWA = computed(() => {
    return window.matchMedia('(display-mode: standalone)').matches;
  });

  loggingOut = signal(false);

  logout(): void {
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);

    const logoutRequest = this.auth.logout().pipe(
      switchMap(() => this.router.navigate(['/login'])),
      finalize(() => this.loggingOut.set(false)),
    );

    logoutRequest.subscribe();
  }

  goBack(): void {
    history.go(-1);
  }

  goForward(): void {
    this.location.forward();
  }
}
