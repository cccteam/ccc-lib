import { Inject, Injectable } from "@angular/core";
import { map } from "rxjs";
import { BASE_URL } from "../base/tokens";
import { errorOptions } from "./request-options";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
const routes = {
    login: (rootUrl) => `${rootUrl}/user/login`,
    session: (rootUrl) => `${rootUrl}/user/session`,
};
export class AuthService {
    http;
    baseUrl;
    constructor(http, baseUrl) {
        this.http = http;
        this.baseUrl = baseUrl;
    }
    /**
     * Logs a user out.
     *
     * @returns Observable with a boolean indicating whether they were logged out.
     */
    logout() {
        return this.http.delete(routes.session(this.baseUrl), errorOptions(false)).pipe(map(() => true));
    }
    /**
     * Checks a user's session with the server.
     *
     * @returns Observable with the user session info
     */
    checkUserSession() {
        return this.http.get(routes.session(this.baseUrl), errorOptions(false));
    }
    loginRoute() {
        return routes.login(this.baseUrl);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, deps: [{ token: i1.HttpClient }, { token: BASE_URL }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, providedIn: "root" });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.7", ngImport: i0, type: AuthService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: "root",
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [BASE_URL]
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2NjLWxpYi9zcmMvbGliL3NlcnZpY2UvYXV0aC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBRSxHQUFHLEVBQWMsTUFBTSxNQUFNLENBQUM7QUFDdkMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQzs7O0FBRWpELE1BQU0sTUFBTSxHQUFHO0lBQ2IsS0FBSyxFQUFFLENBQUMsT0FBZSxFQUFVLEVBQUUsQ0FBQyxHQUFHLE9BQU8sYUFBYTtJQUMzRCxPQUFPLEVBQUUsQ0FBQyxPQUFlLEVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxlQUFlO0NBQ2hFLENBQUM7QUFLRixNQUFNLE9BQU8sV0FBVztJQUNGO0lBQTRDO0lBQWhFLFlBQW9CLElBQWdCLEVBQTRCLE9BQWU7UUFBM0QsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUE0QixZQUFPLEdBQVAsT0FBTyxDQUFRO0lBQUcsQ0FBQztJQUVuRjs7OztPQUlHO0lBQ0gsTUFBTTtRQUNKLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ25HLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsZ0JBQWdCO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBYyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsVUFBVTtRQUNSLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEMsQ0FBQzt1R0F2QlUsV0FBVyw0Q0FDd0IsUUFBUTsyR0FEM0MsV0FBVyxjQUZWLE1BQU07OzJGQUVQLFdBQVc7a0JBSHZCLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25COzswQkFFd0MsTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHR0cENsaWVudCB9IGZyb20gXCJAYW5ndWxhci9jb21tb24vaHR0cFwiO1xuaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7IG1hcCwgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBCQVNFX1VSTCB9IGZyb20gXCIuLi9iYXNlL3Rva2Vuc1wiO1xuaW1wb3J0IHsgU2Vzc2lvbkluZm8gfSBmcm9tIFwiLi4vbW9kZWxzL3Nlc3Npb24taW5mb1wiO1xuaW1wb3J0IHsgZXJyb3JPcHRpb25zIH0gZnJvbSBcIi4vcmVxdWVzdC1vcHRpb25zXCI7XG5cbmNvbnN0IHJvdXRlcyA9IHtcbiAgbG9naW46IChyb290VXJsOiBzdHJpbmcpOiBzdHJpbmcgPT4gYCR7cm9vdFVybH0vdXNlci9sb2dpbmAsXG4gIHNlc3Npb246IChyb290VXJsOiBzdHJpbmcpOiBzdHJpbmcgPT4gYCR7cm9vdFVybH0vdXNlci9zZXNzaW9uYCxcbn07XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogXCJyb290XCIsXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBodHRwOiBIdHRwQ2xpZW50LCBASW5qZWN0KEJBU0VfVVJMKSBwcml2YXRlIGJhc2VVcmw6IHN0cmluZykge31cblxuICAvKipcbiAgICogTG9ncyBhIHVzZXIgb3V0LlxuICAgKlxuICAgKiBAcmV0dXJucyBPYnNlcnZhYmxlIHdpdGggYSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGV5IHdlcmUgbG9nZ2VkIG91dC5cbiAgICovXG4gIGxvZ291dCgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5odHRwLmRlbGV0ZShyb3V0ZXMuc2Vzc2lvbih0aGlzLmJhc2VVcmwpLCBlcnJvck9wdGlvbnMoZmFsc2UpKS5waXBlKG1hcCgoKSA9PiB0cnVlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGEgdXNlcidzIHNlc3Npb24gd2l0aCB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBAcmV0dXJucyBPYnNlcnZhYmxlIHdpdGggdGhlIHVzZXIgc2Vzc2lvbiBpbmZvXG4gICAqL1xuICBjaGVja1VzZXJTZXNzaW9uKCk6IE9ic2VydmFibGU8U2Vzc2lvbkluZm8gfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5nZXQ8U2Vzc2lvbkluZm8+KHJvdXRlcy5zZXNzaW9uKHRoaXMuYmFzZVVybCksIGVycm9yT3B0aW9ucyhmYWxzZSkpO1xuICB9XG5cbiAgbG9naW5Sb3V0ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiByb3V0ZXMubG9naW4odGhpcy5iYXNlVXJsKTtcbiAgfVxufVxuIl19