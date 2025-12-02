import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { generatedNavItems } from '@cccteam/ccc-lib/src';

export interface MenuItem {
  label: string;
  route?: string[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, MatToolbarModule, MatMenuModule, MatButtonModule, RouterModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  openGroup: MenuItem | null = null;
  menuData = generatedNavItems;
}
