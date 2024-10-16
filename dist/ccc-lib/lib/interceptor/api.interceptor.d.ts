import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export declare class ApiInterceptor implements HttpInterceptor {
    private store;
    private router;
    private ngZone;
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ApiInterceptor, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ApiInterceptor>;
}
