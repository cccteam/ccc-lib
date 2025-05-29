import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@cccteam/ccc-lib/src/auth-service';
import { AlertLevel, BASE_URL } from '@cccteam/ccc-lib/src/types';
import { UiCoreService } from '@cccteam/ccc-lib/src/ui-core-service';
import { CUSTOM_HTTP_REQUEST_OPTIONS } from '@cccteam/ccc-lib/src/util-request-options';
import { catchError, finalize, Observable, throwError } from 'rxjs';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private ui = inject(UiCoreService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private baseUrl = inject(BASE_URL);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.ui.beginActivity(request.method + ' ' + request.url);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
        if (error.status === 401) {
          this.ngZone.run(() => {
            this.auth.redirectUrl.set(this.baseUrl + this.router.url);
            this.router.navigate(['/login']);
          });
        }
        if (!request.context.get(CUSTOM_HTTP_REQUEST_OPTIONS).suppressGlobalError) {
          const message = error.error?.message ?? error.message ?? error.error;
          this.ui.publishError({
            message: message,
            level: AlertLevel.ERROR,
            link: '',
          });
        }

        return throwError(() => error);
      }),
      finalize(() => {
        this.ui.endActivity(request.method + ' ' + request.url);
      }),
    );
  }
}
