import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_URL, FRONTEND_LOGIN_PATH, LOGOUT_ACTION, PERMISSION_REQUIRED, SESSION_PATH } from '@cccteam/ccc-lib/types';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';

// A session check whose answer overlaps a logout may have been answered before the server ended the session.
// It must not mark the client signed in again, or the login page sends the user back into the application.

const sessionUrl = '/api/user/session';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let logoutAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logoutAction = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
        { provide: SESSION_PATH, useValue: 'user/session' },
        { provide: FRONTEND_LOGIN_PATH, useValue: 'login' },
        { provide: LOGOUT_ACTION, useValue: logoutAction },
        { provide: PERMISSION_REQUIRED, useValue: () => false },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  async function signIn(): Promise<void> {
    const check = firstValueFrom(auth.checkUserSession());
    http.expectOne({ method: 'GET', url: sessionUrl }).flush({ authenticated: true });
    await check;
  }

  it('signs in from a session check', async () => {
    await signIn();

    expect(auth.authenticated()).toBe(true);
  });

  it('signs out and calls the logout action when the logout succeeds', async () => {
    await signIn();

    const logout = firstValueFrom(auth.logout());
    http.expectOne({ method: 'DELETE', url: sessionUrl }).flush(null);

    expect(await logout).toBe(true);
    expect(logoutAction).toHaveBeenCalledTimes(1);
    expect(auth.authenticated()).toBe(false);
  });

  it('signs out when the logout fails', async () => {
    await signIn();

    const logout = firstValueFrom(auth.logout());
    http.expectOne({ method: 'DELETE', url: sessionUrl }).flush(null, { status: 500, statusText: 'Server Error' });

    await expect(logout).rejects.toBeTruthy();
    expect(logoutAction).not.toHaveBeenCalled();
    expect(auth.authenticated()).toBe(false);
  });

  it('signs out when the logout is cancelled', async () => {
    await signIn();

    auth.logout().subscribe().unsubscribe();
    http.expectOne({ method: 'DELETE', url: sessionUrl });

    expect(auth.authenticated()).toBe(false);
  });

  it('discards a session check sent before the logout and answered after it', async () => {
    await signIn();

    const check = firstValueFrom(auth.checkUserSession());
    const checkRequest = http.expectOne({ method: 'GET', url: sessionUrl });
    const logout = firstValueFrom(auth.logout());
    http.expectOne({ method: 'DELETE', url: sessionUrl }).flush(null);
    await logout;
    checkRequest.flush({ authenticated: true });

    expect((await check).authenticated).toBeFalsy();
    expect(auth.authenticated()).toBe(false);
  });

  it('discards a session check sent and answered while the logout is in flight', async () => {
    await signIn();

    const logout = firstValueFrom(auth.logout());
    const logoutRequest = http.expectOne({ method: 'DELETE', url: sessionUrl });
    const check = firstValueFrom(auth.checkUserSession());
    http.expectOne({ method: 'GET', url: sessionUrl }).flush({ authenticated: true });

    expect((await check).authenticated).toBeFalsy();
    expect(auth.authenticated()).toBe(false);
    logoutRequest.flush(null);
    await logout;
  });

  it('discards a session check sent while the logout is in flight and answered after it', async () => {
    await signIn();

    const logout = firstValueFrom(auth.logout());
    const logoutRequest = http.expectOne({ method: 'DELETE', url: sessionUrl });
    const check = firstValueFrom(auth.checkUserSession());
    const checkRequest = http.expectOne({ method: 'GET', url: sessionUrl });
    logoutRequest.flush(null);
    await logout;
    checkRequest.flush({ authenticated: true });

    expect((await check).authenticated).toBeFalsy();
    expect(auth.authenticated()).toBe(false);
  });

  it('signs out as soon as the logout starts', async () => {
    await signIn();

    const logout = firstValueFrom(auth.logout());
    const logoutRequest = http.expectOne({ method: 'DELETE', url: sessionUrl });

    expect(auth.authenticated()).toBe(false);
    logoutRequest.flush(null);
    await logout;
  });

  it('keeps a newer sign-in when a check from before the logout answers late', async () => {
    await signIn();
    const staleCheck = firstValueFrom(auth.checkUserSession());
    const staleRequest = http.expectOne({ method: 'GET', url: sessionUrl });
    const logout = firstValueFrom(auth.logout());
    http.expectOne({ method: 'DELETE', url: sessionUrl }).flush(null);
    await logout;
    await signIn();

    staleRequest.flush({});

    expect((await staleCheck).authenticated).toBeFalsy();
    expect(auth.authenticated()).toBe(true);
  });

  it('accepts a session check sent after the logout ended', async () => {
    await signIn();
    const logout = firstValueFrom(auth.logout());
    http.expectOne({ method: 'DELETE', url: sessionUrl }).flush(null);
    await logout;

    await signIn();

    expect(auth.authenticated()).toBe(true);
  });
});
