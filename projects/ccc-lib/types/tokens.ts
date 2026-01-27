import { InjectionToken } from '@angular/core';
import { Domain, Permission, Resource } from './permissions';
import { MethodMeta, ResourceMeta } from './resource-meta';

/**
 * The base URL for API requests (e.g., 'https://api.example.com/').
 */
export const BASE_URL = new InjectionToken<string>('BASE_URL');

/**
 * The path to the frontend login page (e.g., '/login').
 */
export const FRONTEND_LOGIN_PATH = new InjectionToken<string>('FRONTEND_LOGIN_PATH');

/**
 * The path to the session endpoint (e.g., 'user/session').
 */
export const SESSION_PATH = new InjectionToken<string>('SESSION_PATH');

/**
 * The base URL for API requests (e.g., '/api').
 */
export const API_URL = new InjectionToken<string>('API_URL');

export const PERMISSION_REQUIRED = new InjectionToken<(resource: Resource, permission: Permission) => boolean>(
  'PERMISSION_REQUIRED',
);

export const AVAILABLE_PERMISSIONS = new InjectionToken<{
  Create: Permission;
  Delete: Permission;
  List: Permission;
  Read: Permission;
  Update: Permission;
}>('AVAILABLE_PERMISSIONS');
export const AVAILABLE_DOMAINS = new InjectionToken<Record<string, Domain>[]>('AVAILABLE_DOMAINS');

export const RESOURCE_META = new InjectionToken<(resource: Resource) => ResourceMeta>('RESOURCE_META');
export const METHOD_META = new InjectionToken<(method: string) => MethodMeta>('METHOD_META');

export const IDLE_SESSION_DURATION = new InjectionToken<number>('IDLE_SESSION_DURATION');
export const IDLE_WARNING_DURATION = new InjectionToken<number>('IDLE_WARNING_DURATION');
export const IDLE_KEEPALIVE_DURATION = new InjectionToken<number>('IDLE_KEEPALIVE_DURATION');
export const LOGOUT_ACTION = new InjectionToken<() => void>('LOGOUT_ACTION');
export const IDLE_LOGOUT_ACTION = new InjectionToken<() => void>('IDLE_LOGOUT_ACTION');
