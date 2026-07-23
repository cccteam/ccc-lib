import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface DashboardTile {
  label: string;
  description: string;
  icon: string;
  route: string;
  testId: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly tiles: DashboardTile[] = [
    {
      label: 'Grid showcase',
      description: 'ccc-grid features: selection, sorting, filtering, pagination, and row expansion.',
      icon: 'grid_on',
      route: '/grid-showcase',
      testId: 'grid-showcase',
    },
    {
      label: 'Virtual scroll grid showcase',
      description: 'ccc-grid with enableVirtualScroll rendering 5,000 test records.',
      icon: 'view_list',
      route: '/virtual-scroll-grid-showcase',
      testId: 'virtual-scroll-grid-showcase',
    },
  ];
}
