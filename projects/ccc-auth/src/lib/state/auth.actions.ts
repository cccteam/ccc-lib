/* eslint-disable @typescript-eslint/no-namespace */
// no-namespace rule is disabled because action hygiene prevents import pollution

import { ErrorMessage } from '../models/error-message';

export namespace AuthenticationGuardAction {
  export class SetRedirectUrl {
    static readonly type = '[AuthenticationGuard] Set Redirect Url And Navigate To Login Page';
    constructor(public redirectUrl: string) {}
  }

  export class CheckUserSession {
    static readonly type = '[AuthenticationGuard] Check User Session';
  }
}

export namespace ApiInterceptorAction {
  export class BeginActivity {
    static readonly type = '[ApiInterceptor] Add Loading Activity';
    constructor(public process: string) {}
  }
  export class EndActivity {
    static readonly type = '[ApiInterceptor] Remove Loading Activity';
    constructor(public process: string) {}
  }
  export class SetRedirectUrl {
    static readonly type = '[ApiInterceptor] Set Redirect Url';
    constructor(public redirectUrl: string) {}
  }
}

export namespace LoginAction {
  export class Logout {
    static readonly type = '[Login] Auto Logout';
  }

  export class SetRedirectUrl {
    static readonly type = '[Login] Set Redirect Url';
    constructor(public redirectUrl: string) {}
  }

  export class PublishError {
    static readonly type = '[Login] Publish Error';
    constructor(public message: ErrorMessage) {}
  }
}

export namespace AppAction {
  export class CheckUserSession {
    static readonly type = '[App] Check User Session';
  }

  export class SetRedirectUrl {
    static readonly type = '[App] Set Redirect Url';
    constructor(public redirectUrl: string) {}
  }

  export class SetNavIdentifier {
    static readonly type = '[App] Set Nav Identifier';
    constructor(public identifier: string) {}
  }
}

export namespace HeaderAction {
  export class ToggleSidenav {
    static readonly type = '[Header] Toggle Sidenav';
  }

  export class Logout {
    static readonly type = '[Header] User Logout';
  }
}
