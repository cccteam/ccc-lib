import { InjectionToken } from '@angular/core';
import { Domain, Permission, Resource } from './permissions';

export const BASE_URL = new InjectionToken<string>('BASE_URL');
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
