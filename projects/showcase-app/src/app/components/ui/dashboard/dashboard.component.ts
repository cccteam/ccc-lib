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
  // The config-driven pages are the grid's showcase: the Users page lists one server
  // page at a time, sorts and filters through the server, and turns pages by cursor.
  readonly tiles: DashboardTile[] = [
    {
      label: 'Users',
      description: 'The config-driven list over the server: one page of rows, sort and filter as request parameters, First, Previous, and Next by cursor.',
      icon: 'grid_on',
      route: '/users',
      testId: 'users',
    },
  ];
}
