/* eslint-disable @typescript-eslint/no-namespace */
// no-namespace rule is disabled because action hygiene prevents import pollution
export var AuthenticationGuardAction;
(function (AuthenticationGuardAction) {
    class SetRedirectUrl {
        redirectUrl;
        static type = '[AuthenticationGuard] Set Redirect Url And Navigate To Login Page';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    AuthenticationGuardAction.SetRedirectUrl = SetRedirectUrl;
    class CheckUserSession {
        static type = '[AuthenticationGuard] Check User Session';
    }
    AuthenticationGuardAction.CheckUserSession = CheckUserSession;
})(AuthenticationGuardAction || (AuthenticationGuardAction = {}));
export var ApiInterceptorAction;
(function (ApiInterceptorAction) {
    class BeginActivity {
        process;
        static type = '[ApiInterceptor] Add Loading Activity';
        constructor(process) {
            this.process = process;
        }
    }
    ApiInterceptorAction.BeginActivity = BeginActivity;
    class EndActivity {
        process;
        static type = '[ApiInterceptor] Remove Loading Activity';
        constructor(process) {
            this.process = process;
        }
    }
    ApiInterceptorAction.EndActivity = EndActivity;
    class SetRedirectUrl {
        redirectUrl;
        static type = '[ApiInterceptor] Set Redirect Url';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    ApiInterceptorAction.SetRedirectUrl = SetRedirectUrl;
    class PublishError {
        message;
        static type = '[ApiInterceptor] Publish Error';
        constructor(message) {
            this.message = message;
        }
    }
    ApiInterceptorAction.PublishError = PublishError;
})(ApiInterceptorAction || (ApiInterceptorAction = {}));
export var LoginAction;
(function (LoginAction) {
    class Logout {
        static type = '[Login] Auto Logout';
    }
    LoginAction.Logout = Logout;
    class SetRedirectUrl {
        redirectUrl;
        static type = '[Login] Set Redirect Url';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    LoginAction.SetRedirectUrl = SetRedirectUrl;
    class PublishError {
        message;
        static type = '[Login] Publish Error';
        constructor(message) {
            this.message = message;
        }
    }
    LoginAction.PublishError = PublishError;
})(LoginAction || (LoginAction = {}));
export var AppAction;
(function (AppAction) {
    class CheckUserSession {
        static type = '[App] Check User Session';
    }
    AppAction.CheckUserSession = CheckUserSession;
    class SetRedirectUrl {
        redirectUrl;
        static type = '[App] Set Redirect Url';
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    AppAction.SetRedirectUrl = SetRedirectUrl;
})(AppAction || (AppAction = {}));
export var HeaderAction;
(function (HeaderAction) {
    class ToggleSidenav {
        static type = '[Header] Toggle Sidenav';
    }
    HeaderAction.ToggleSidenav = ToggleSidenav;
    class Logout {
        static type = '[Header] User Logout';
    }
    HeaderAction.Logout = Logout;
})(HeaderAction || (HeaderAction = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5hY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2NjLWxpYi9zcmMvbGliL3N0YXRlL2NvcmUuYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxvREFBb0Q7QUFDcEQsaUZBQWlGO0FBSWpGLE1BQU0sS0FBVyx5QkFBeUIsQ0FVekM7QUFWRCxXQUFpQix5QkFBeUI7SUFDeEMsTUFBYSxjQUFjO1FBR047UUFGbkIsTUFBTSxDQUFVLElBQUksR0FDbEIsbUVBQW1FLENBQUM7UUFDdEUsWUFBbUIsV0FBbUI7WUFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBRyxDQUFDOztJQUgvQix3Q0FBYyxpQkFJMUIsQ0FBQTtJQUVELE1BQWEsZ0JBQWdCO1FBQzNCLE1BQU0sQ0FBVSxJQUFJLEdBQUcsMENBQTBDLENBQUM7O0lBRHZELDBDQUFnQixtQkFFNUIsQ0FBQTtBQUNILENBQUMsRUFWZ0IseUJBQXlCLEtBQXpCLHlCQUF5QixRQVV6QztBQUVELE1BQU0sS0FBVyxvQkFBb0IsQ0FrQnBDO0FBbEJELFdBQWlCLG9CQUFvQjtJQUNuQyxNQUFhLGFBQWE7UUFFTDtRQURuQixNQUFNLENBQVUsSUFBSSxHQUFHLHVDQUF1QyxDQUFDO1FBQy9ELFlBQW1CLE9BQWU7WUFBZixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQUcsQ0FBQzs7SUFGM0Isa0NBQWEsZ0JBR3pCLENBQUE7SUFDRCxNQUFhLFdBQVc7UUFFSDtRQURuQixNQUFNLENBQVUsSUFBSSxHQUFHLDBDQUEwQyxDQUFDO1FBQ2xFLFlBQW1CLE9BQWU7WUFBZixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQUcsQ0FBQzs7SUFGM0IsZ0NBQVcsY0FHdkIsQ0FBQTtJQUNELE1BQWEsY0FBYztRQUVOO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsbUNBQW1DLENBQUM7UUFDM0QsWUFBbUIsV0FBbUI7WUFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBRyxDQUFDOztJQUYvQixtQ0FBYyxpQkFHMUIsQ0FBQTtJQUVELE1BQWEsWUFBWTtRQUVKO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsZ0NBQWdDLENBQUM7UUFDeEQsWUFBbUIsT0FBcUI7WUFBckIsWUFBTyxHQUFQLE9BQU8sQ0FBYztRQUFHLENBQUM7O0lBRmpDLGlDQUFZLGVBR3hCLENBQUE7QUFDSCxDQUFDLEVBbEJnQixvQkFBb0IsS0FBcEIsb0JBQW9CLFFBa0JwQztBQUVELE1BQU0sS0FBVyxXQUFXLENBYzNCO0FBZEQsV0FBaUIsV0FBVztJQUMxQixNQUFhLE1BQU07UUFDakIsTUFBTSxDQUFVLElBQUksR0FBRyxxQkFBcUIsQ0FBQzs7SUFEbEMsa0JBQU0sU0FFbEIsQ0FBQTtJQUVELE1BQWEsY0FBYztRQUVOO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsMEJBQTBCLENBQUM7UUFDbEQsWUFBbUIsV0FBbUI7WUFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBRyxDQUFDOztJQUYvQiwwQkFBYyxpQkFHMUIsQ0FBQTtJQUVELE1BQWEsWUFBWTtRQUVKO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsdUJBQXVCLENBQUM7UUFDL0MsWUFBbUIsT0FBcUI7WUFBckIsWUFBTyxHQUFQLE9BQU8sQ0FBYztRQUFHLENBQUM7O0lBRmpDLHdCQUFZLGVBR3hCLENBQUE7QUFDSCxDQUFDLEVBZGdCLFdBQVcsS0FBWCxXQUFXLFFBYzNCO0FBRUQsTUFBTSxLQUFXLFNBQVMsQ0FTekI7QUFURCxXQUFpQixTQUFTO0lBQ3hCLE1BQWEsZ0JBQWdCO1FBQzNCLE1BQU0sQ0FBVSxJQUFJLEdBQUcsMEJBQTBCLENBQUM7O0lBRHZDLDBCQUFnQixtQkFFNUIsQ0FBQTtJQUVELE1BQWEsY0FBYztRQUVOO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsd0JBQXdCLENBQUM7UUFDaEQsWUFBbUIsV0FBbUI7WUFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBRyxDQUFDOztJQUYvQix3QkFBYyxpQkFHMUIsQ0FBQTtBQUNILENBQUMsRUFUZ0IsU0FBUyxLQUFULFNBQVMsUUFTekI7QUFFRCxNQUFNLEtBQVcsWUFBWSxDQVE1QjtBQVJELFdBQWlCLFlBQVk7SUFDM0IsTUFBYSxhQUFhO1FBQ3hCLE1BQU0sQ0FBVSxJQUFJLEdBQUcseUJBQXlCLENBQUM7O0lBRHRDLDBCQUFhLGdCQUV6QixDQUFBO0lBRUQsTUFBYSxNQUFNO1FBQ2pCLE1BQU0sQ0FBVSxJQUFJLEdBQUcsc0JBQXNCLENBQUM7O0lBRG5DLG1CQUFNLFNBRWxCLENBQUE7QUFDSCxDQUFDLEVBUmdCLFlBQVksS0FBWixZQUFZLFFBUTVCIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5hbWVzcGFjZSAqL1xuLy8gbm8tbmFtZXNwYWNlIHJ1bGUgaXMgZGlzYWJsZWQgYmVjYXVzZSBhY3Rpb24gaHlnaWVuZSBwcmV2ZW50cyBpbXBvcnQgcG9sbHV0aW9uXG5cbmltcG9ydCB7IEVycm9yTWVzc2FnZSB9IGZyb20gJy4uL21vZGVscy9lcnJvci1tZXNzYWdlJztcblxuZXhwb3J0IG5hbWVzcGFjZSBBdXRoZW50aWNhdGlvbkd1YXJkQWN0aW9uIHtcbiAgZXhwb3J0IGNsYXNzIFNldFJlZGlyZWN0VXJsIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9XG4gICAgICAnW0F1dGhlbnRpY2F0aW9uR3VhcmRdIFNldCBSZWRpcmVjdCBVcmwgQW5kIE5hdmlnYXRlIFRvIExvZ2luIFBhZ2UnO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWRpcmVjdFVybDogc3RyaW5nKSB7fVxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIENoZWNrVXNlclNlc3Npb24ge1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gJ1tBdXRoZW50aWNhdGlvbkd1YXJkXSBDaGVjayBVc2VyIFNlc3Npb24nO1xuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgQXBpSW50ZXJjZXB0b3JBY3Rpb24ge1xuICBleHBvcnQgY2xhc3MgQmVnaW5BY3Rpdml0eSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSAnW0FwaUludGVyY2VwdG9yXSBBZGQgTG9hZGluZyBBY3Rpdml0eSc7XG4gICAgY29uc3RydWN0b3IocHVibGljIHByb2Nlc3M6IHN0cmluZykge31cbiAgfVxuICBleHBvcnQgY2xhc3MgRW5kQWN0aXZpdHkge1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gJ1tBcGlJbnRlcmNlcHRvcl0gUmVtb3ZlIExvYWRpbmcgQWN0aXZpdHknO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBwcm9jZXNzOiBzdHJpbmcpIHt9XG4gIH1cbiAgZXhwb3J0IGNsYXNzIFNldFJlZGlyZWN0VXJsIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9ICdbQXBpSW50ZXJjZXB0b3JdIFNldCBSZWRpcmVjdCBVcmwnO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWRpcmVjdFVybDogc3RyaW5nKSB7fVxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFB1Ymxpc2hFcnJvciB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSAnW0FwaUludGVyY2VwdG9yXSBQdWJsaXNoIEVycm9yJztcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbWVzc2FnZTogRXJyb3JNZXNzYWdlKSB7fVxuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgTG9naW5BY3Rpb24ge1xuICBleHBvcnQgY2xhc3MgTG9nb3V0IHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9ICdbTG9naW5dIEF1dG8gTG9nb3V0JztcbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBTZXRSZWRpcmVjdFVybCB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSAnW0xvZ2luXSBTZXQgUmVkaXJlY3QgVXJsJztcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVkaXJlY3RVcmw6IHN0cmluZykge31cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBQdWJsaXNoRXJyb3Ige1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gJ1tMb2dpbl0gUHVibGlzaCBFcnJvcic7XG4gICAgY29uc3RydWN0b3IocHVibGljIG1lc3NhZ2U6IEVycm9yTWVzc2FnZSkge31cbiAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIEFwcEFjdGlvbiB7XG4gIGV4cG9ydCBjbGFzcyBDaGVja1VzZXJTZXNzaW9uIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9ICdbQXBwXSBDaGVjayBVc2VyIFNlc3Npb24nO1xuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFNldFJlZGlyZWN0VXJsIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9ICdbQXBwXSBTZXQgUmVkaXJlY3QgVXJsJztcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVkaXJlY3RVcmw6IHN0cmluZykge31cbiAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIEhlYWRlckFjdGlvbiB7XG4gIGV4cG9ydCBjbGFzcyBUb2dnbGVTaWRlbmF2IHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9ICdbSGVhZGVyXSBUb2dnbGUgU2lkZW5hdic7XG4gIH1cblxuICBleHBvcnQgY2xhc3MgTG9nb3V0IHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9ICdbSGVhZGVyXSBVc2VyIExvZ291dCc7XG4gIH1cbn1cbiJdfQ==