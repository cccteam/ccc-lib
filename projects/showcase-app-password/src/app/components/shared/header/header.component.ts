import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
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
  location = inject(Location);

  isPWA = computed(() => {
    return window.matchMedia('(display-mode: standalone)').matches;
  });

  logout(): void {
    this.router.navigate(['/login']);
  }

  goBack(): void {
    history.go(-1);
  }

  goForward(): void {
    this.location.forward();
  }
}
