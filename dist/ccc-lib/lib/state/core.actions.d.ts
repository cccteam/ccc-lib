import { ErrorMessage } from '../models/error-message';
export declare namespace AuthenticationGuardAction {
    class SetRedirectUrl {
        redirectUrl: string;
        static readonly type = "[AuthenticationGuard] Set Redirect Url And Navigate To Login Page";
        constructor(redirectUrl: string);
    }
    class CheckUserSession {
        static readonly type = "[AuthenticationGuard] Check User Session";
    }
}
export declare namespace ApiInterceptorAction {
    class BeginActivity {
        process: string;
        static readonly type = "[ApiInterceptor] Add Loading Activity";
        constructor(process: string);
    }
    class EndActivity {
        process: string;
        static readonly type = "[ApiInterceptor] Remove Loading Activity";
        constructor(process: string);
    }
    class SetRedirectUrl {
        redirectUrl: string;
        static readonly type = "[ApiInterceptor] Set Redirect Url";
        constructor(redirectUrl: string);
    }
    class PublishError {
        message: ErrorMessage;
        static readonly type = "[ApiInterceptor] Publish Error";
        constructor(message: ErrorMessage);
    }
}
export declare namespace LoginAction {
    class Logout {
        static readonly type = "[Login] Auto Logout";
    }
    class SetRedirectUrl {
        redirectUrl: string;
        static readonly type = "[Login] Set Redirect Url";
        constructor(redirectUrl: string);
    }
    class PublishError {
        message: ErrorMessage;
        static readonly type = "[Login] Publish Error";
        constructor(message: ErrorMessage);
    }
}
export declare namespace AppAction {
    class CheckUserSession {
        static readonly type = "[App] Check User Session";
    }
    class SetRedirectUrl {
        redirectUrl: string;
        static readonly type = "[App] Set Redirect Url";
        constructor(redirectUrl: string);
    }
}
export declare namespace HeaderAction {
    class ToggleSidenav {
        static readonly type = "[Header] Toggle Sidenav";
    }
    class Logout {
        static readonly type = "[Header] User Logout";
    }
}
