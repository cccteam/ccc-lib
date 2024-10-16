import { inject, Injectable, InjectionToken } from '@angular/core';
import { map } from 'rxjs';
import { errorOptions } from './request-options';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
const routes = {
    login: (rootUrl) => `${rootUrl}/user/login`,
    session: (rootUrl) => `${rootUrl}/user/session`,
};
export class AuthService {
    http;
    API_URL = new InjectionToken('apiUrl');
    apiUrl = inject(this.API_URL);
    constructor(http) {
        this.http = http;
    }
    /**
     * Logs a user out.
     *
     * @returns Observable with a boolean indicating whether they were logged out.
     */
    logout() {
        return this.http
            .delete(routes.session(this.apiUrl), errorOptions(false))
            .pipe(map(() => true));
    }
    /**
     * Checks a user's session with the server.
     *
     * @returns Observable with the user session info
     */
    checkUserSession() {
        return this.http.get(routes.session(this.apiUrl), errorOptions(false));
    }
    loginRoute() {
        return routes.login(this.apiUrl);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, deps: [{ token: i1.HttpClient }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2NjLWxpYi9zcmMvbGliL3NlcnZpY2UvYXV0aC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxNQUFNLEVBQVUsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQWMsR0FBRyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQzs7O0FBR2pELE1BQU0sTUFBTSxHQUFHO0lBQ2IsS0FBSyxFQUFFLENBQUMsT0FBZSxFQUFVLEVBQUUsQ0FBQyxHQUFHLE9BQU8sYUFBYTtJQUMzRCxPQUFPLEVBQUUsQ0FBQyxPQUFlLEVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxlQUFlO0NBQ2hFLENBQUM7QUFLRixNQUFNLE9BQU8sV0FBVztJQUlGO0lBSHBCLE9BQU8sR0FBRyxJQUFJLGNBQWMsQ0FBUyxRQUFRLENBQUMsQ0FBQztJQUMvQyxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU5QixZQUFvQixJQUFnQjtRQUFoQixTQUFJLEdBQUosSUFBSSxDQUFZO0lBQUcsQ0FBQztJQUV4Qzs7OztPQUlHO0lBQ0gsTUFBTTtRQUNKLE9BQU8sSUFBSSxDQUFDLElBQUk7YUFDYixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3hELElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGdCQUFnQjtRQUNkLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQ2xCLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUMzQixZQUFZLENBQUMsS0FBSyxDQUFDLENBQ3BCLENBQUM7SUFDSixDQUFDO0lBRUQsVUFBVTtRQUNSLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkMsQ0FBQzt1R0EvQlUsV0FBVzsyR0FBWCxXQUFXLGNBRlYsTUFBTTs7MkZBRVAsV0FBVztrQkFIdkIsVUFBVTttQkFBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgaW5qZWN0LCBJbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBtYXAgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGVycm9yT3B0aW9ucyB9IGZyb20gJy4vcmVxdWVzdC1vcHRpb25zJztcbmltcG9ydCB7IFNlc3Npb25JbmZvIH0gZnJvbSAnLi4vbW9kZWxzL3Nlc3Npb24taW5mbyc7XG5cbmNvbnN0IHJvdXRlcyA9IHtcbiAgbG9naW46IChyb290VXJsOiBzdHJpbmcpOiBzdHJpbmcgPT4gYCR7cm9vdFVybH0vdXNlci9sb2dpbmAsXG4gIHNlc3Npb246IChyb290VXJsOiBzdHJpbmcpOiBzdHJpbmcgPT4gYCR7cm9vdFVybH0vdXNlci9zZXNzaW9uYCxcbn07XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBBdXRoU2VydmljZSB7XG4gIEFQSV9VUkwgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignYXBpVXJsJyk7XG4gIGFwaVVybCA9IGluamVjdCh0aGlzLkFQSV9VUkwpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cDogSHR0cENsaWVudCkge31cblxuICAvKipcbiAgICogTG9ncyBhIHVzZXIgb3V0LlxuICAgKlxuICAgKiBAcmV0dXJucyBPYnNlcnZhYmxlIHdpdGggYSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGV5IHdlcmUgbG9nZ2VkIG91dC5cbiAgICovXG4gIGxvZ291dCgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5odHRwXG4gICAgICAuZGVsZXRlKHJvdXRlcy5zZXNzaW9uKHRoaXMuYXBpVXJsKSwgZXJyb3JPcHRpb25zKGZhbHNlKSlcbiAgICAgIC5waXBlKG1hcCgoKSA9PiB0cnVlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGEgdXNlcidzIHNlc3Npb24gd2l0aCB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBPYnNlcnZhYmxlIHdpdGggdGhlIHVzZXIgc2Vzc2lvbiBpbmZvXG4gICAqL1xuICBjaGVja1VzZXJTZXNzaW9uKCk6IE9ic2VydmFibGU8U2Vzc2lvbkluZm8gfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5nZXQ8U2Vzc2lvbkluZm8+KFxuICAgICAgcm91dGVzLnNlc3Npb24odGhpcy5hcGlVcmwpLFxuICAgICAgZXJyb3JPcHRpb25zKGZhbHNlKVxuICAgICk7XG4gIH1cblxuICBsb2dpblJvdXRlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJvdXRlcy5sb2dpbih0aGlzLmFwaVVybCk7XG4gIH1cbn1cbiJdfQ==