import { TestBed } from '@angular/core/testing';
import { DEFAULT_LOGIN_MESSAGES, provideLoginMessages } from '@cccteam/resource-angular/types';
import { NotificationService } from '@cccteam/resource-angular/ui-notification-service';

import { UiCoreService } from './ui-core.service';

// The login refusal contract on the browser side: a code arrives in the URL, the service
// answers the sentence the application holds for it, and nothing else ever reaches the page.

describe('UiCoreService login messages', () => {
  const cases: { name: string; code: string; want: string }[] = [
    { name: 'a session code answers its default sentence', code: 'no_roles', want: DEFAULT_LOGIN_MESSAGES['no_roles'] },
    { name: 'the internal error code answers its default sentence', code: 'internal_error', want: DEFAULT_LOGIN_MESSAGES['internal_error'] },
    { name: 'an unknown code answers nothing', code: 'call 555-0100 for a password reset', want: '' },
    { name: 'an empty code answers nothing', code: '', want: '' },
    { name: 'a key inherited from Object is not a code', code: 'constructor', want: '' },
    { name: 'the prototype key is not a code', code: '__proto__', want: '' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      TestBed.configureTestingModule({});
      const ui = TestBed.inject(UiCoreService);
      expect(ui.loginMessage(tt.code)).toBe(tt.want);
    });
  }

  it('holds a sentence for every session code', () => {
    const sessionCodes = [
      'internal_error',
      'login_refused',
      'no_oidc_cookie',
      'invalid_state',
      'invalid_pkce',
      'token_exchange_failed',
      'no_id_token',
      'verify_id_token_failed',
      'parse_claims_failed',
      'not_workspace_member',
      'email_not_verified',
      'no_roles',
      'no_email_claim',
    ];
    TestBed.configureTestingModule({});
    const ui = TestBed.inject(UiCoreService);
    for (const code of sessionCodes) {
      expect(ui.loginMessage(code), code).not.toBe('');
    }
    expect(Object.keys(DEFAULT_LOGIN_MESSAGES).sort()).toEqual([...sessionCodes].sort());
  });

  describe('publishLoginError', () => {
    const cases: { name: string; code: string; wantPublished: boolean }[] = [
      { name: 'publishes a known code as an error notification', code: 'no_roles', wantPublished: true },
      { name: 'publishes nothing for an unknown code', code: 'call 555-0100', wantPublished: false },
      { name: 'publishes nothing for an empty code', code: '', wantPublished: false },
    ];

    for (const tt of cases) {
      it(tt.name, () => {
        TestBed.configureTestingModule({});
        const ui = TestBed.inject(UiCoreService);
        const notifications = TestBed.inject(NotificationService);

        expect(ui.publishLoginError(tt.code)).toBe(tt.wantPublished);
        const messages = notifications.notifications().map((n) => n.message);
        expect(messages).toEqual(tt.wantPublished ? [DEFAULT_LOGIN_MESSAGES[tt.code]] : []);
      });
    }
  });

  describe('provideLoginMessages', () => {
    const cases: { name: string; code: string; want: string }[] = [
      { name: 'adds the application code', code: 'not_provisioned', want: 'Your account has not been set up yet.' },
      { name: 'rewords a default', code: 'no_roles', want: 'Ask the flight desk for a role.' },
      { name: 'keeps the other defaults', code: 'invalid_state', want: DEFAULT_LOGIN_MESSAGES['invalid_state'] },
      { name: 'still answers nothing for an unknown code', code: 'anything else', want: '' },
    ];

    for (const tt of cases) {
      it(tt.name, () => {
        TestBed.configureTestingModule({
          providers: [
            provideLoginMessages({
              not_provisioned: 'Your account has not been set up yet.',
              no_roles: 'Ask the flight desk for a role.',
            }),
          ],
        });
        const ui = TestBed.inject(UiCoreService);
        expect(ui.loginMessage(tt.code)).toBe(tt.want);
      });
    }
  });
});
