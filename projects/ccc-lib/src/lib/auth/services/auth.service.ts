import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../../types/base/tokens';
import { SessionInfo } from '../../types/session-info';
import { errorOptions } from './request-options';

const routes = {
  login: (rootUrl: string): string => `${rootUrl}/user/login`,
  session: (rootUrl: string): string => `${rootUrl}/user/session`,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string,
  ) {}

  /**
   * Logs a user out.
   *
   * @returns Observable with a boolean indicating whether they were logged out.
   */
  logout(): Observable<boolean> {
    return this.http.delete(routes.session(this.apiUrl), errorOptions(false)).pipe(map(() => true));
  }

  /**
   * Checks a user's session with the server.
   *
   * @returns Observable with the user session info
   */
  checkUserSession(): Observable<SessionInfo | null> {
    return this.http.get<SessionInfo>(routes.session(this.apiUrl), errorOptions(false));
  }

  loginRoute(): string {
    return routes.login(this.apiUrl);
  }
}
