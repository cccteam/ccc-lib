import { HttpContext, HttpContextToken } from '@angular/common/http';

export interface CustomHttpRequestOptions {
  suppressGlobalError: boolean;
}

export const CUSTOM_HTTP_REQUEST_OPTIONS = new HttpContextToken<CustomHttpRequestOptions>(() => ({
  suppressGlobalError: false,
}));

export interface CustomHttpRequestOptions {
  suppressGlobalError: boolean;
}

export function errorOptions(suppressGlobalError: boolean = false): { context: HttpContext } {
  const context = new HttpContext();
  context.set(CUSTOM_HTTP_REQUEST_OPTIONS, { suppressGlobalError });
  return { context };
}