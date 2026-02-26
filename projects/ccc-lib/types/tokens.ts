import { InjectionToken } from '@angular/core';
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
 * A function to determine if a specific permission is required for a given resource.
 * @defaultValue a function that always returns false
 */
export const PERMISSION_REQUIRED = new InjectionToken<(resource: Resource, permission: Permission) => boolean>(
  'PERMISSION_REQUIRED',
  { factory: () => () => false },
);

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
