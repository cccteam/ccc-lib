import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { CUSTOM_HTTP_REQUEST_OPTIONS } from '../service/request-options';
import { AlertLevel } from '../models/error-message';
import { ApiInterceptorAction } from '../state/core.actions';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private store = inject(Store);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.store.dispatch(new ApiInterceptorAction.BeginActivity(request.method + ' ' + request.url));

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
        if (error.status === 401) {
          this.ngZone.run(() => {
            this.store.dispatch(new ApiInterceptorAction.SetRedirectUrl(this.router.url));
            this.router.navigate(['/login']);
          });
        }
        if (!request.context.get(CUSTOM_HTTP_REQUEST_OPTIONS).suppressGlobalError) {
          const message = error.error?.message ?? error.message ?? error.error;
          this.store.dispatch(
            new ApiInterceptorAction.PublishError({
              message: message,
              level: AlertLevel.ERROR,
              link: '',
            }),
          );
        }

        return throwError(() => error);
      }),
      finalize(() => {
        this.store.dispatch(new ApiInterceptorAction.EndActivity(request.method + ' ' + request.url));
      }),
    );
  }
}
