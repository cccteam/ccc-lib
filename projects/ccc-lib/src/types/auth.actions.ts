/* eslint-disable @typescript-eslint/no-namespace */
// no-namespace rule is disabled because action hygiene prevents import pollution

import { CreateNotificationMessage } from './notification-message';
export namespace AuthenticationGuardAction {
  export class SetRedirectUrl {
    static readonly type = '[AuthenticationGuard] Set Redirect Url And Navigate To Login Page';
    constructor(public redirectUrl: string) {}
  }

  export class CheckUserSession {
    static readonly type = '[AuthenticationGuard] Check User Session';
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
    constructor(public message: CreateNotificationMessage) {}
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
