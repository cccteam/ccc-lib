import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../shared/footer/footer.component';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-ui',
  imports: [RouterModule, HeaderComponent, FooterComponent, MatSidenavModule],
  templateUrl: './ui.component.html',
  styleUrl: './ui.component.scss',
})
export class UiComponent {}
