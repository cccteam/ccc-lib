import { Routes } from '@angular/router';
import { AuthenticationGuard } from '@cccteam/ccc-lib/auth-authentication-guard';
import { resourceRoutes } from '@cccteam/ccc-lib/ccc-resource';
import { UiComponent } from './components/ui/ui.component';
import { usersConfig } from './configs/users.config';
import { resourceMeta } from './core/generated/zz_gen_resources';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((comp) => comp.LoginComponent),
  },
  {
    path: '',
    component: UiComponent,
    canActivate: [AuthenticationGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/ui/dashboard/dashboard.component').then((comp) => comp.DashboardComponent),
      },
      resourceRoutes(usersConfig, resourceMeta),
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
