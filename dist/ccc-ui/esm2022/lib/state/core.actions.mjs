/* eslint-disable @typescript-eslint/no-namespace */
// no-namespace rule is disabled because action hygiene prevents import pollution
export var AuthenticationGuardAction;
(function (AuthenticationGuardAction) {
    class SetRedirectUrl {
        redirectUrl;
        static type = "[AuthenticationGuard] Set Redirect Url And Navigate To Login Page";
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    AuthenticationGuardAction.SetRedirectUrl = SetRedirectUrl;
    class CheckUserSession {
        static type = "[AuthenticationGuard] Check User Session";
    }
    AuthenticationGuardAction.CheckUserSession = CheckUserSession;
})(AuthenticationGuardAction || (AuthenticationGuardAction = {}));
export var ApiInterceptorAction;
(function (ApiInterceptorAction) {
    class BeginActivity {
        process;
        static type = "[ApiInterceptor] Add Loading Activity";
        constructor(process) {
            this.process = process;
        }
    }
    ApiInterceptorAction.BeginActivity = BeginActivity;
    class EndActivity {
        process;
        static type = "[ApiInterceptor] Remove Loading Activity";
        constructor(process) {
            this.process = process;
        }
    }
    ApiInterceptorAction.EndActivity = EndActivity;
    class SetRedirectUrl {
        redirectUrl;
        static type = "[ApiInterceptor] Set Redirect Url";
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    ApiInterceptorAction.SetRedirectUrl = SetRedirectUrl;
    class PublishError {
        message;
        static type = "[ApiInterceptor] Publish Error";
        constructor(message) {
            this.message = message;
        }
    }
    ApiInterceptorAction.PublishError = PublishError;
})(ApiInterceptorAction || (ApiInterceptorAction = {}));
export var LoginAction;
(function (LoginAction) {
    class Logout {
        static type = "[Login] Auto Logout";
    }
    LoginAction.Logout = Logout;
    class SetRedirectUrl {
        redirectUrl;
        static type = "[Login] Set Redirect Url";
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    LoginAction.SetRedirectUrl = SetRedirectUrl;
    class PublishError {
        message;
        static type = "[Login] Publish Error";
        constructor(message) {
            this.message = message;
        }
    }
    LoginAction.PublishError = PublishError;
})(LoginAction || (LoginAction = {}));
export var AppAction;
(function (AppAction) {
    class CheckUserSession {
        static type = "[App] Check User Session";
    }
    AppAction.CheckUserSession = CheckUserSession;
    class SetRedirectUrl {
        redirectUrl;
        static type = "[App] Set Redirect Url";
        constructor(redirectUrl) {
            this.redirectUrl = redirectUrl;
        }
    }
    AppAction.SetRedirectUrl = SetRedirectUrl;
    class SetNavIdentifier {
        identifier;
        static type = "[App] Set Nav Identifier";
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    AppAction.SetNavIdentifier = SetNavIdentifier;
})(AppAction || (AppAction = {}));
export var HeaderAction;
(function (HeaderAction) {
    class ToggleSidenav {
        static type = "[Header] Toggle Sidenav";
    }
    HeaderAction.ToggleSidenav = ToggleSidenav;
    class Logout {
        static type = "[Header] User Logout";
    }
    HeaderAction.Logout = Logout;
})(HeaderAction || (HeaderAction = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS5hY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2NjLWxpYi9zcmMvbGliL3N0YXRlL2NvcmUuYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxvREFBb0Q7QUFDcEQsaUZBQWlGO0FBSWpGLE1BQU0sS0FBVyx5QkFBeUIsQ0FTekM7QUFURCxXQUFpQix5QkFBeUI7SUFDeEMsTUFBYSxjQUFjO1FBRU47UUFEbkIsTUFBTSxDQUFVLElBQUksR0FBRyxtRUFBbUUsQ0FBQztRQUMzRixZQUFtQixXQUFtQjtZQUFuQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUFHLENBQUM7O0lBRi9CLHdDQUFjLGlCQUcxQixDQUFBO0lBRUQsTUFBYSxnQkFBZ0I7UUFDM0IsTUFBTSxDQUFVLElBQUksR0FBRywwQ0FBMEMsQ0FBQzs7SUFEdkQsMENBQWdCLG1CQUU1QixDQUFBO0FBQ0gsQ0FBQyxFQVRnQix5QkFBeUIsS0FBekIseUJBQXlCLFFBU3pDO0FBRUQsTUFBTSxLQUFXLG9CQUFvQixDQWtCcEM7QUFsQkQsV0FBaUIsb0JBQW9CO0lBQ25DLE1BQWEsYUFBYTtRQUVMO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsdUNBQXVDLENBQUM7UUFDL0QsWUFBbUIsT0FBZTtZQUFmLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBRyxDQUFDOztJQUYzQixrQ0FBYSxnQkFHekIsQ0FBQTtJQUNELE1BQWEsV0FBVztRQUVIO1FBRG5CLE1BQU0sQ0FBVSxJQUFJLEdBQUcsMENBQTBDLENBQUM7UUFDbEUsWUFBbUIsT0FBZTtZQUFmLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBRyxDQUFDOztJQUYzQixnQ0FBVyxjQUd2QixDQUFBO0lBQ0QsTUFBYSxjQUFjO1FBRU47UUFEbkIsTUFBTSxDQUFVLElBQUksR0FBRyxtQ0FBbUMsQ0FBQztRQUMzRCxZQUFtQixXQUFtQjtZQUFuQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUFHLENBQUM7O0lBRi9CLG1DQUFjLGlCQUcxQixDQUFBO0lBRUQsTUFBYSxZQUFZO1FBRUo7UUFEbkIsTUFBTSxDQUFVLElBQUksR0FBRyxnQ0FBZ0MsQ0FBQztRQUN4RCxZQUFtQixPQUFxQjtZQUFyQixZQUFPLEdBQVAsT0FBTyxDQUFjO1FBQUcsQ0FBQzs7SUFGakMsaUNBQVksZUFHeEIsQ0FBQTtBQUNILENBQUMsRUFsQmdCLG9CQUFvQixLQUFwQixvQkFBb0IsUUFrQnBDO0FBRUQsTUFBTSxLQUFXLFdBQVcsQ0FjM0I7QUFkRCxXQUFpQixXQUFXO0lBQzFCLE1BQWEsTUFBTTtRQUNqQixNQUFNLENBQVUsSUFBSSxHQUFHLHFCQUFxQixDQUFDOztJQURsQyxrQkFBTSxTQUVsQixDQUFBO0lBRUQsTUFBYSxjQUFjO1FBRU47UUFEbkIsTUFBTSxDQUFVLElBQUksR0FBRywwQkFBMEIsQ0FBQztRQUNsRCxZQUFtQixXQUFtQjtZQUFuQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUFHLENBQUM7O0lBRi9CLDBCQUFjLGlCQUcxQixDQUFBO0lBRUQsTUFBYSxZQUFZO1FBRUo7UUFEbkIsTUFBTSxDQUFVLElBQUksR0FBRyx1QkFBdUIsQ0FBQztRQUMvQyxZQUFtQixPQUFxQjtZQUFyQixZQUFPLEdBQVAsT0FBTyxDQUFjO1FBQUcsQ0FBQzs7SUFGakMsd0JBQVksZUFHeEIsQ0FBQTtBQUNILENBQUMsRUFkZ0IsV0FBVyxLQUFYLFdBQVcsUUFjM0I7QUFFRCxNQUFNLEtBQVcsU0FBUyxDQWN6QjtBQWRELFdBQWlCLFNBQVM7SUFDeEIsTUFBYSxnQkFBZ0I7UUFDM0IsTUFBTSxDQUFVLElBQUksR0FBRywwQkFBMEIsQ0FBQzs7SUFEdkMsMEJBQWdCLG1CQUU1QixDQUFBO0lBRUQsTUFBYSxjQUFjO1FBRU47UUFEbkIsTUFBTSxDQUFVLElBQUksR0FBRyx3QkFBd0IsQ0FBQztRQUNoRCxZQUFtQixXQUFtQjtZQUFuQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUFHLENBQUM7O0lBRi9CLHdCQUFjLGlCQUcxQixDQUFBO0lBRUQsTUFBYSxnQkFBZ0I7UUFFUjtRQURuQixNQUFNLENBQVUsSUFBSSxHQUFHLDBCQUEwQixDQUFDO1FBQ2xELFlBQW1CLFVBQWtCO1lBQWxCLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBRyxDQUFDOztJQUY5QiwwQkFBZ0IsbUJBRzVCLENBQUE7QUFDSCxDQUFDLEVBZGdCLFNBQVMsS0FBVCxTQUFTLFFBY3pCO0FBRUQsTUFBTSxLQUFXLFlBQVksQ0FRNUI7QUFSRCxXQUFpQixZQUFZO0lBQzNCLE1BQWEsYUFBYTtRQUN4QixNQUFNLENBQVUsSUFBSSxHQUFHLHlCQUF5QixDQUFDOztJQUR0QywwQkFBYSxnQkFFekIsQ0FBQTtJQUVELE1BQWEsTUFBTTtRQUNqQixNQUFNLENBQVUsSUFBSSxHQUFHLHNCQUFzQixDQUFDOztJQURuQyxtQkFBTSxTQUVsQixDQUFBO0FBQ0gsQ0FBQyxFQVJnQixZQUFZLEtBQVosWUFBWSxRQVE1QiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1uYW1lc3BhY2UgKi9cbi8vIG5vLW5hbWVzcGFjZSBydWxlIGlzIGRpc2FibGVkIGJlY2F1c2UgYWN0aW9uIGh5Z2llbmUgcHJldmVudHMgaW1wb3J0IHBvbGx1dGlvblxuXG5pbXBvcnQgeyBFcnJvck1lc3NhZ2UgfSBmcm9tIFwiLi4vbW9kZWxzL2Vycm9yLW1lc3NhZ2VcIjtcblxuZXhwb3J0IG5hbWVzcGFjZSBBdXRoZW50aWNhdGlvbkd1YXJkQWN0aW9uIHtcbiAgZXhwb3J0IGNsYXNzIFNldFJlZGlyZWN0VXJsIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9IFwiW0F1dGhlbnRpY2F0aW9uR3VhcmRdIFNldCBSZWRpcmVjdCBVcmwgQW5kIE5hdmlnYXRlIFRvIExvZ2luIFBhZ2VcIjtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVkaXJlY3RVcmw6IHN0cmluZykge31cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBDaGVja1VzZXJTZXNzaW9uIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9IFwiW0F1dGhlbnRpY2F0aW9uR3VhcmRdIENoZWNrIFVzZXIgU2Vzc2lvblwiO1xuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgQXBpSW50ZXJjZXB0b3JBY3Rpb24ge1xuICBleHBvcnQgY2xhc3MgQmVnaW5BY3Rpdml0eSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSBcIltBcGlJbnRlcmNlcHRvcl0gQWRkIExvYWRpbmcgQWN0aXZpdHlcIjtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJvY2Vzczogc3RyaW5nKSB7fVxuICB9XG4gIGV4cG9ydCBjbGFzcyBFbmRBY3Rpdml0eSB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSBcIltBcGlJbnRlcmNlcHRvcl0gUmVtb3ZlIExvYWRpbmcgQWN0aXZpdHlcIjtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJvY2Vzczogc3RyaW5nKSB7fVxuICB9XG4gIGV4cG9ydCBjbGFzcyBTZXRSZWRpcmVjdFVybCB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSBcIltBcGlJbnRlcmNlcHRvcl0gU2V0IFJlZGlyZWN0IFVybFwiO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWRpcmVjdFVybDogc3RyaW5nKSB7fVxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFB1Ymxpc2hFcnJvciB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSBcIltBcGlJbnRlcmNlcHRvcl0gUHVibGlzaCBFcnJvclwiO1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtZXNzYWdlOiBFcnJvck1lc3NhZ2UpIHt9XG4gIH1cbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBMb2dpbkFjdGlvbiB7XG4gIGV4cG9ydCBjbGFzcyBMb2dvdXQge1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gXCJbTG9naW5dIEF1dG8gTG9nb3V0XCI7XG4gIH1cblxuICBleHBvcnQgY2xhc3MgU2V0UmVkaXJlY3RVcmwge1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gXCJbTG9naW5dIFNldCBSZWRpcmVjdCBVcmxcIjtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVkaXJlY3RVcmw6IHN0cmluZykge31cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBQdWJsaXNoRXJyb3Ige1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gXCJbTG9naW5dIFB1Ymxpc2ggRXJyb3JcIjtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbWVzc2FnZTogRXJyb3JNZXNzYWdlKSB7fVxuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgQXBwQWN0aW9uIHtcbiAgZXhwb3J0IGNsYXNzIENoZWNrVXNlclNlc3Npb24ge1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gXCJbQXBwXSBDaGVjayBVc2VyIFNlc3Npb25cIjtcbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBTZXRSZWRpcmVjdFVybCB7XG4gICAgc3RhdGljIHJlYWRvbmx5IHR5cGUgPSBcIltBcHBdIFNldCBSZWRpcmVjdCBVcmxcIjtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVkaXJlY3RVcmw6IHN0cmluZykge31cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBTZXROYXZJZGVudGlmaWVyIHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9IFwiW0FwcF0gU2V0IE5hdiBJZGVudGlmaWVyXCI7XG4gICAgY29uc3RydWN0b3IocHVibGljIGlkZW50aWZpZXI6IHN0cmluZykge31cbiAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIEhlYWRlckFjdGlvbiB7XG4gIGV4cG9ydCBjbGFzcyBUb2dnbGVTaWRlbmF2IHtcbiAgICBzdGF0aWMgcmVhZG9ubHkgdHlwZSA9IFwiW0hlYWRlcl0gVG9nZ2xlIFNpZGVuYXZcIjtcbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBMb2dvdXQge1xuICAgIHN0YXRpYyByZWFkb25seSB0eXBlID0gXCJbSGVhZGVyXSBVc2VyIExvZ291dFwiO1xuICB9XG59XG4iXX0=