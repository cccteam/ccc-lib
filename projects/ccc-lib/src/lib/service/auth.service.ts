import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, map } from 'rxjs';
import { errorOptions } from './request-options';
import { SessionInfo } from '../models/session-info';

const routes = {
  login: (rootUrl: string): string => `${rootUrl}/user/login`,
  session: (rootUrl: string): string => `${rootUrl}/user/session`,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  API_URL = new InjectionToken<string>('apiUrl');
  apiUrl = inject(this.API_URL);

  constructor(private http: HttpClient) {}

  /**
   * Logs a user out.
   *
   * @returns Observable with a boolean indicating whether they were logged out.
   */
  logout(): Observable<boolean> {
    return this.http
      .delete(routes.session(this.apiUrl), errorOptions(false))
      .pipe(map(() => true));
  }

  /**
   * Checks a user's session with the server.
   *
   * @returns Observable with the user session info
   */
  checkUserSession(): Observable<SessionInfo | null> {
    return this.http.get<SessionInfo>(
      routes.session(this.apiUrl),
      errorOptions(false)
    );
  }

  loginRoute(): string {
    return routes.login(this.apiUrl);
  }
}
