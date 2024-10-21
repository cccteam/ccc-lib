import { HttpContext, HttpContextToken } from '@angular/common/http';
export interface CustomHttpRequestOptions {
    suppressGlobalError: boolean;
}
export declare const CUSTOM_HTTP_REQUEST_OPTIONS: HttpContextToken<CustomHttpRequestOptions>;
export declare function errorOptions(suppressGlobalError: boolean | undefined): {
    context: HttpContext;
};
