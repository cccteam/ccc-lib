import { HttpClient } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionInfo } from '../models/session-info';
import * as i0 from "@angular/core";
export declare class AuthService {
    private http;
    API_URL: InjectionToken<string>;
    apiUrl: string;
    constructor(http: HttpClient);
    /**
     * Logs a user out.
     *
     * @returns Observable with a boolean indicating whether they were logged out.
     */
    logout(): Observable<boolean>;
    /**
     * Checks a user's session with the server.
     *
     * @returns Observable with the user session info
     */
    checkUserSession(): Observable<SessionInfo | null>;
    loginRoute(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<AuthService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<AuthService>;
}
