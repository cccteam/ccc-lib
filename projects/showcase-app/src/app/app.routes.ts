import { Routes } from '@angular/router';
import { OIDCAuthenticationGuard } from '@cccteam/ccc-lib/auth-authentication-guard';
import { resourceRoutes } from '@cccteam/ccc-lib/resource-route-generator';
import { UiComponent } from './components/ui/ui.component';
import { usersConfig } from './configs/users.config';
import { resourceMeta } from './core/generated/zz_gen_resources';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((comp) => comp.LoginComponent),
  },
  {
    path: 'grid-showcase',
    loadComponent: () =>
      import('./components/grid-showcase/grid-showcase.component').then((comp) => comp.GridShowcaseComponent),
  },
  {
    path: 'virtual-scroll-grid-showcase',
    loadComponent: () =>
      import('./components/virtual-scroll-grid-showcase/virtual-scroll-grid-showcase.component').then(
        (comp) => comp.VirtualScrollGridShowcaseComponent,
      ),
  },
  {
    path: 'kendo-perf',
    loadComponent: () => import('./components/kendo-perf/kendo-perf.component').then((comp) => comp.KendoPerfComponent),
  },
  {
    path: '',
    component: UiComponent,
    canActivate: [OIDCAuthenticationGuard],
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
