import { InjectionToken, Provider, signal, Signal } from '@angular/core';
import { Domain, Permission, Resource } from './permissions';
import { MethodMeta, ResourceMeta } from './resource-meta';

/**
 * The base URL for API requests (e.g., 'https://api.example.com/').
 * @defaultValue '/'
 */
export const BASE_URL = new InjectionToken<string>('BASE_URL', { factory: () => '/' });

/**
 * The path to the frontend login page (e.g., '/login').
 * @defaultValue '/login'
 */
export const FRONTEND_LOGIN_PATH = new InjectionToken<string>('FRONTEND_LOGIN_PATH', { factory: () => '/login' });

/**
 * The path to the session endpoint (e.g., 'user/session').
 * @defaultValue 'user/session'
 */
export const SESSION_PATH = new InjectionToken<string>('SESSION_PATH', { factory: () => 'user/session' });

/**
 * The base URL for API requests (e.g., '/api').
 * @defaultValue '/api'
 */
export const API_URL = new InjectionToken<string>('API_URL', { factory: () => '/api' });

/**
 * The path to the generated permission digest endpoint, relative to API_URL.
 * @defaultValue 'permission-digest'
 */
export const PERMISSION_DIGEST_PATH = new InjectionToken<string>('PERMISSION_DIGEST_PATH', {
  factory: () => 'permission-digest',
});

/**
 * The path to the generated user-domains endpoint, relative to API_URL.
 * @defaultValue 'user-domains'
 */
export const USER_DOMAINS_PATH = new InjectionToken<string>('USER_DOMAINS_PATH', { factory: () => 'user-domains' });

/**
 * The available permissions in the system.
 * @defaultValue an empty array
 */
export const AVAILABLE_PERMISSIONS = new InjectionToken<{
  Create: Permission;
  Delete: Permission;
  List: Permission;
  Read: Permission;
  Update: Permission;
}>('AVAILABLE_PERMISSIONS');
export const AVAILABLE_DOMAINS = new InjectionToken<Record<string, Domain>[]>('AVAILABLE_DOMAINS', {
  factory: () => [],
});

/**
 * The selected tenant for the library's pages: a signal the application provides from
 * its tenant picker. Every request the store makes for a domain-scoped resource is
 * bound to it, and a permission question about a domain-scoped target whose scope
 * names no domain is asked in its digest. Undefined means no tenant is selected: a
 * domain-scoped request is refused by the client before it is sent, and a domain-scoped
 * permission question answers false.
 * @defaultValue a signal holding undefined
 */
export const RESOURCE_DOMAIN = new InjectionToken<Signal<Domain | undefined>>('RESOURCE_DOMAIN', {
  factory: () => signal<Domain | undefined>(undefined),
});

/**
 * The generated resourceMeta from the output of the [ccc package](https://github.com/cccteam/ccc) typescript generator
 * Required to work with generated routes and resource metadata
 * @defaultValue a no-op function that returns an empty object
 */
export const RESOURCE_META = new InjectionToken<(resource: Resource) => ResourceMeta>('RESOURCE_META', {
  factory: () => () => ({}) as ResourceMeta,
});

/**
 * The generated methodMeta from the output of the [ccc package](https://github.com/cccteam/ccc) typescript generator
 * Required to work with generated method data
 * @defaultValue a no-op function that returns an empty object
 */
export const METHOD_META = new InjectionToken<(method: string) => MethodMeta>('METHOD_META', {
  factory: () => () => ({}) as MethodMeta,
});

/**
 * The duration in seconds for the session to be considered idle.
 * @defaultValue 300 seconds
 */
export const IDLE_SESSION_DURATION = new InjectionToken<number>('IDLE_SESSION_DURATION', { factory: () => 300 });

/**
 * The duration in seconds for the warning to be shown to the user before the session times out due to inactivity.
 * @defaultValue 60 seconds
 */
export const IDLE_WARNING_DURATION = new InjectionToken<number>('IDLE_WARNING_DURATION', { factory: () => 60 });

/**
 * The duration in seconds for the keepalive ping to be sent to the server to keep the session alive.
 * @defaultValue 30 seconds
 */
export const IDLE_KEEPALIVE_DURATION = new InjectionToken<number>('IDLE_KEEPALIVE_DURATION', { factory: () => 30 });

/**
 * A function to be called when the user logs out.
 * @defaultValue a no-op function that returns 0
 */
export const LOGOUT_ACTION = new InjectionToken<() => void>('LOGOUT_ACTION', { factory: () => () => 0 });

/**
 * A function to be called when the user is logged out due to inactivity.
 * @defaultValue a no-op function that returns 0
 */
export const IDLE_LOGOUT_ACTION = new InjectionToken<() => void>('IDLE_LOGOUT_ACTION', {
  factory: () => () => 0,
});

/**
 * When true, user activity (mouse movement, keypress, etc.) will NOT reset the idle timer once the warning is shown.
 * The user must explicitly call `stayLoggedIn()` (e.g. via a modal button) to reset the timer.
 * When false (default), any activity resets the idle timer as usual.
 * @defaultValue false
 */
export const IDLE_TIMEOUT_REQUIRE_CONFIRMATION = new InjectionToken<boolean>('IDLE_TIMEOUT_REQUIRE_CONFIRMATION', {
  factory: () => false,
});

/**
 * The sentence a login page shows for each login refusal code the session module sends.
 * A refused login redirects to the login page with `?code=<code>` and nothing else; the
 * page renders the sentence it holds for the code and nothing for a code it does not
 * know, so no text that arrives in the URL is ever displayed. One entry per code in the
 * session module's "Login refusal codes" table.
 */
export const DEFAULT_LOGIN_MESSAGES: Readonly<Record<string, string>> = {
  internal_error: 'Sign-in failed because of a problem on our side. Please try again.',
  login_refused: 'Sign-in was refused for this account.',
  no_oidc_cookie: 'Sign-in could not be completed because the browser lost its sign-in cookie. Please try again.',
  invalid_state: 'Sign-in could not be completed because it did not match the sign-in this browser started. Please try again.',
  invalid_pkce: 'Sign-in could not be completed because its verification code was missing. Please try again.',
  token_exchange_failed: 'The identity provider did not complete the sign-in. Please try again.',
  no_id_token: 'The identity provider did not return an identity token. Please try again.',
  verify_id_token_failed: 'The identity token could not be verified. Please try again.',
  parse_claims_failed: 'The identity token could not be read. Please try again.',
  not_workspace_member: 'This account is not a member of the required organization.',
  email_not_verified: 'The email address of this account is not verified.',
  no_roles: 'This account has no role in this application. Please contact your administrator.',
  no_email_claim: 'The identity provider did not say which account signed in.',
};

/**
 * The login refusal codes the application holds text for: the session module's codes with
 * the library's sentences, plus whatever `provideLoginMessages` adds. `UiCoreService`
 * reads it for `loginMessage` and `publishLoginError`.
 * @defaultValue DEFAULT_LOGIN_MESSAGES
 */
export const LOGIN_MESSAGES = new InjectionToken<Readonly<Record<string, string>>>('LOGIN_MESSAGES', {
  factory: () => DEFAULT_LOGIN_MESSAGES,
});

/**
 * Adds the application's own login refusal codes, or rewords a default: the library's
 * sentences come first and the application's entries after, so a repeated key wins. An
 * application whose custom session data resolver refuses with `not_provisioned` provides
 * `provideLoginMessages({ not_provisioned: 'Your account has not been set up yet.' })`.
 */
export function provideLoginMessages(messages: Record<string, string>): Provider {
  return { provide: LOGIN_MESSAGES, useValue: { ...DEFAULT_LOGIN_MESSAGES, ...messages } };
}
