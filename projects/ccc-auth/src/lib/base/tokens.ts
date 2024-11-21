import { InjectionToken } from '@angular/core';
import { Permission, Resource } from '@cccteam/ccc-types';

export const BASE_URL = new InjectionToken<string>('BASE_URL');
export const PERMISSION_REQUIRED = new InjectionToken<(resource: Resource, permission: Permission) => boolean>(
  'PERMISSION_REQUIRED',
);
