import { inject, InjectionToken } from '@angular/core';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';
import { CoreState } from '../state/core.state';
import { AuthenticationGuardAction } from '../state/core.actions';
export const AuthenticationGuard = (route, routerState) => {
    const store = inject(Store);
    const authService = inject(AuthService);
    const API_URL = new InjectionToken('apiUrl');
    const apiUrl = inject(API_URL);
    const authenticate = () => {
        const url = routerState.url;
        const absoluteUrl = apiUrl + (!url.toString().startsWith('/') ? '/' + url : url);
        const encodedUrl = encodeURIComponent(absoluteUrl);
        window.location.href = `${authService.loginRoute()}?returnUrl=${encodedUrl}`;
    };
    return store.select(CoreState.isAuthenticated).pipe(switchMap((authenticated) => {
        if (authenticated) {
            return of(authenticated);
        }
        // Handle uninitialized state (ie Browser reload)
        return store.dispatch(AuthenticationGuardAction.CheckUserSession).pipe(switchMap(() => {
            return store.select(CoreState.isAuthenticated);
        }));
    }), map((authenticated) => {
        if (authenticated) {
            return true;
        }
        authenticate();
        return false;
    }), catchError(() => {
        authenticate();
        return of(false);
    }));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uZ3VhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jY2MtbGliL3NyYy9saWIvZ3VhcmRzL2F1dGhlbnRpY2F0aW9uLmd1YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDcEMsT0FBTyxFQUFFLEVBQUUsRUFBYyxNQUFNLE1BQU0sQ0FBQztBQUN0QyxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDdEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ2hELE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRWxFLE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLENBQ2pDLEtBQTZCLEVBQzdCLFdBQWdDLEVBQ1gsRUFBRTtJQUN2QixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXhDLE1BQU0sT0FBTyxHQUFHLElBQUksY0FBYyxDQUFTLFFBQVEsQ0FBQyxDQUFDO0lBQ3JELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUvQixNQUFNLFlBQVksR0FBRyxHQUFTLEVBQUU7UUFDOUIsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQztRQUM1QixNQUFNLFdBQVcsR0FDZixNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDLFVBQVUsRUFBRSxjQUFjLFVBQVUsRUFBRSxDQUFDO0lBQy9FLENBQUMsQ0FBQztJQUVGLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUNqRCxTQUFTLENBQUMsQ0FBQyxhQUFhLEVBQUUsRUFBRTtRQUMxQixJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFDRCxpREFBaUQ7UUFDakQsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUNwRSxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQ2IsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQyxDQUFDLEVBQ0YsR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLEVBQUU7UUFDcEIsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNsQixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxZQUFZLEVBQUUsQ0FBQztRQUVmLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyxDQUFDLEVBQ0YsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLFlBQVksRUFBRSxDQUFDO1FBRWYsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkIsQ0FBQyxDQUFDLENBQ0gsQ0FBQztBQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGluamVjdCwgSW5qZWN0aW9uVG9rZW4gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIFJvdXRlclN0YXRlU25hcHNob3QgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgU3RvcmUgfSBmcm9tICdAbmd4cy9zdG9yZSc7XG5pbXBvcnQgeyBvZiwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2F0Y2hFcnJvciwgbWFwLCBzd2l0Y2hNYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBBdXRoU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2UvYXV0aC5zZXJ2aWNlJztcbmltcG9ydCB7IENvcmVTdGF0ZSB9IGZyb20gJy4uL3N0YXRlL2NvcmUuc3RhdGUnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRpb25HdWFyZEFjdGlvbiB9IGZyb20gJy4uL3N0YXRlL2NvcmUuYWN0aW9ucyc7XG5cbmV4cG9ydCBjb25zdCBBdXRoZW50aWNhdGlvbkd1YXJkID0gKFxuICByb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCxcbiAgcm91dGVyU3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3Rcbik6IE9ic2VydmFibGU8Ym9vbGVhbj4gPT4ge1xuICBjb25zdCBzdG9yZSA9IGluamVjdChTdG9yZSk7XG4gIGNvbnN0IGF1dGhTZXJ2aWNlID0gaW5qZWN0KEF1dGhTZXJ2aWNlKTtcblxuICBjb25zdCBBUElfVVJMID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZz4oJ2FwaVVybCcpO1xuICBjb25zdCBhcGlVcmwgPSBpbmplY3QoQVBJX1VSTCk7XG5cbiAgY29uc3QgYXV0aGVudGljYXRlID0gKCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHVybCA9IHJvdXRlclN0YXRlLnVybDtcbiAgICBjb25zdCBhYnNvbHV0ZVVybCA9XG4gICAgICBhcGlVcmwgKyAoIXVybC50b1N0cmluZygpLnN0YXJ0c1dpdGgoJy8nKSA/ICcvJyArIHVybCA6IHVybCk7XG4gICAgY29uc3QgZW5jb2RlZFVybCA9IGVuY29kZVVSSUNvbXBvbmVudChhYnNvbHV0ZVVybCk7XG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBgJHthdXRoU2VydmljZS5sb2dpblJvdXRlKCl9P3JldHVyblVybD0ke2VuY29kZWRVcmx9YDtcbiAgfTtcblxuICByZXR1cm4gc3RvcmUuc2VsZWN0KENvcmVTdGF0ZS5pc0F1dGhlbnRpY2F0ZWQpLnBpcGUoXG4gICAgc3dpdGNoTWFwKChhdXRoZW50aWNhdGVkKSA9PiB7XG4gICAgICBpZiAoYXV0aGVudGljYXRlZCkge1xuICAgICAgICByZXR1cm4gb2YoYXV0aGVudGljYXRlZCk7XG4gICAgICB9XG4gICAgICAvLyBIYW5kbGUgdW5pbml0aWFsaXplZCBzdGF0ZSAoaWUgQnJvd3NlciByZWxvYWQpXG4gICAgICByZXR1cm4gc3RvcmUuZGlzcGF0Y2goQXV0aGVudGljYXRpb25HdWFyZEFjdGlvbi5DaGVja1VzZXJTZXNzaW9uKS5waXBlKFxuICAgICAgICBzd2l0Y2hNYXAoKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBzdG9yZS5zZWxlY3QoQ29yZVN0YXRlLmlzQXV0aGVudGljYXRlZCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pLFxuICAgIG1hcCgoYXV0aGVudGljYXRlZCkgPT4ge1xuICAgICAgaWYgKGF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIGF1dGhlbnRpY2F0ZSgpO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSksXG4gICAgY2F0Y2hFcnJvcigoKSA9PiB7XG4gICAgICBhdXRoZW50aWNhdGUoKTtcblxuICAgICAgcmV0dXJuIG9mKGZhbHNlKTtcbiAgICB9KVxuICApO1xufTtcbiJdfQ==