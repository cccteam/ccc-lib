import { HttpContext, HttpContextToken } from '@angular/common/http';

export interface CustomHttpRequestOptions {
  suppressGlobalError: boolean;
}

export const CUSTOM_HTTP_REQUEST_OPTIONS = new HttpContextToken<CustomHttpRequestOptions>(() => ({
  suppressGlobalError: false,
}));

export function errorOptions(suppressGlobalError: boolean | undefined): { context: HttpContext } {
  return {
    context: new HttpContext().set(CUSTOM_HTTP_REQUEST_OPTIONS, {
      suppressGlobalError: suppressGlobalError ?? false,
    }),
  };
}
