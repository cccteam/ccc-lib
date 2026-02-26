import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import {
  API_URL,
  BASE_URL,
  FRONTEND_LOGIN_PATH,
  IDLE_KEEPALIVE_DURATION,
  IDLE_LOGOUT_ACTION,
  IDLE_SESSION_DURATION,
  IDLE_TIMEOUT_REQUIRE_CONFIRMATION,
  IDLE_WARNING_DURATION,
  LOGOUT_ACTION,
  METHOD_META,
  PERMISSION_REQUIRED,
  RESOURCE_META,
  SESSION_PATH,
} from '@cccteam/ccc-lib/types';
import { ApiInterceptor } from '@cccteam/ccc-lib/ui-interceptor';
import { envVars } from '../environments/env';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { requiresPermission } from './core/generated/zz_gen_constants';
import { methodMeta } from './core/generated/zz_gen_methods';
import { resourceMeta } from './core/generated/zz_gen_resources';

const customTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 0,
  touchendHideDelay: 1500,
  disableTooltipInteractivity: true,
};

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FRONTEND_LOGIN_PATH,
      useValue: '/login',
    },
    {
      provide: SESSION_PATH,
      useValue: 'user/session',
    },
    {
      provide: IDLE_LOGOUT_ACTION,
      useValue: () => {
        console.log('User has idled too long and logged out!');
      },
    },
    {
      provide: LOGOUT_ACTION,
      useValue: () => {
        console.log('User has logged out!');
      },
    },
    {
      provide: RESOURCE_META,
      useValue: resourceMeta,
    },
    {
      provide: METHOD_META,
      useValue: methodMeta,
    },
    {
      provide: IDLE_SESSION_DURATION,
      useValue: envVars.sessionDuration,
    },
    {
      provide: IDLE_WARNING_DURATION,
      useValue: envVars.warningDuration,
    },
    {
      provide: IDLE_KEEPALIVE_DURATION,
      useValue: envVars.keepAliveDuration,
    },
    {
      provide: IDLE_TIMEOUT_REQUIRE_CONFIRMATION,
      useValue: envVars.timeoutRequireConfirmation,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true,
    },
    {
      provide: BASE_URL,
      useValue: environment.baseUrl,
    },
    {
      provide: API_URL,
      useValue: environment.apiUrl,
    },
    {
      provide: PERMISSION_REQUIRED,
      useValue: requiresPermission,
    },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({
        paramsInheritanceStrategy: 'always',
      }),
    ),
    importProvidersFrom(MatNativeDateModule, BrowserAnimationsModule),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipDefaults },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
