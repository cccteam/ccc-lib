/* eslint-disable @typescript-eslint/no-namespace */
// no-namespace rule is disabled because action hygiene prevents import pollution

import { CreateNotificationMessage } from './notification-message';

export namespace ApiInterceptorAction {
  export class BeginActivity {
    static readonly type = '[ApiInterceptor] Add Loading Activity';
    constructor(public process: string) {}
  }
  export class EndActivity {
    static readonly type = '[ApiInterceptor] Remove Loading Activity';
    constructor(public process: string) {}
  }
  export class PublishError {
    static readonly type = '[ApiInterceptor] Publish Error';
    constructor(public message: CreateNotificationMessage) {}
  }
  export class SetRedirectUrl {
    static readonly type = '[ApiInterceptor] Set Redirect Url';
    constructor(public redirectUrl: string) {}
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
