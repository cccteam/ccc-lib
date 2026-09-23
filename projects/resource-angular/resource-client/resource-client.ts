import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  DestroyRef,
  EnvironmentProviders,
  ErrorHandler,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  Provider,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  signal,
  Signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ApiError,
  Batchable,
  changes,
  ClientBase,
  ClientOptions,
  Operation,
  ResourceHandleBase,
  Store,
  Transport,
} from '@cccteam/resource';
import { AlertType, BASE_URL, FRONTEND_LOGIN_PATH, LOGIN_REDIRECT_URL } from '@cccteam/resource-angular/types';
import { UiCoreService } from '@cccteam/resource-angular/ui-core-service';
import { firstValueFrom } from 'rxjs';

/**
 * The application's @cccteam/resource client. Every application provides it, through
 * provideResourceClient, so the library's permission surface (AuthService, the
 * authorization guard, the has-permission directive), its store, and its pickers answer
 * from the same client and the same digest cache the app's own pages use. It is required:
 * an application that provides none fails at startup, here, naming the way in. Inject it
 * and narrow to the generated Api type.
 */
export const RESOURCE_CLIENT = new InjectionToken<ClientBase>('RESOURCE_CLIENT', {
  providedIn: 'root',
  factory: (): ClientBase => {
    throw new Error(
      'No RESOURCE_CLIENT is provided: add provideResourceClient((options) => createApi({ baseUrl, ...options })) ' +
        "to the application's providers, with the createApi the ccc generator emitted for it.",
    );
  },
});

/**
 * The client options the Angular adapter owns and hands the application's factory: the
 * transport over HttpClient, and the error hook that returns the browser to the login
 * page on a 401. The application spreads them into the generated createApi beside its
 * own baseUrl.
 */
export type ResourceClientOptions = Required<Pick<ClientOptions, 'transport' | 'onError'>>;

/** The activity counter the transport reports each request to. */
export type RequestActivity = Pick<UiCoreService, 'beginActivity' | 'endActivity'>;

/**
 * A Transport over Angular's HttpClient. Requests ride HttpClient for what it owns, the
 * XSRF cookie echo on mutating requests; every response resolves, whatever its status,
 * and the client judges it (a 4xx or 5xx becomes ApiError, a declared answer resolves).
 * A request that got no response at all (status 0: no server, no network) rejects. Each
 * request begins an activity when it is sent and ends it when it settles, so
 * UiCoreService.isLoading and the progress bar over it move while any request is open.
 */
export function httpClientTransport(http: HttpClient, activity?: RequestActivity): Transport {
  let sequence = 0;
  return async (request) => {
    const process = `${request.method} ${request.url} #${++sequence}`;
    activity?.beginActivity(process);
    try {
      const response = await firstValueFrom(
        http.request(request.method, request.url, {
          body: request.body,
          headers: request.headers,
          observe: 'response',
        }),
      );
      const headers: Record<string, string> = {};
      for (const name of response.headers.keys()) {
        const value = response.headers.get(name);
        if (value !== null) {
          headers[name.toLowerCase()] = value;
        }
      }
      return { status: response.status, body: response.body ?? undefined, headers };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status > 0) {
        return { status: error.status, body: error.error ?? undefined };
      }
      throw error;
    } finally {
      activity?.endActivity(process);
    }
  };
}

/**
 * Registers the app's client and the two renderings of the client's judgment the
 * application needs: the login redirect and the error notice. The factory receives the
 * options the adapter owns (see ResourceClientOptions) and spreads them into the
 * generated createApi:
 *
 *     provideResourceClient((options) => createApi({ baseUrl: environment.apiUrl, ...options }))
 *
 * With the client come an ErrorHandler (ResourceErrorHandler) that raises one global
 * notice for an ApiError nobody caught, and the browser's global error listeners, so a
 * zoneless application reports the same way a zone application does. A provider placed
 * after this call that re-provides ErrorHandler would silence the notice, so startup
 * checks that the handler in effect is this one and fails naming the way out;
 * importProvidersFrom(BrowserModule), which BrowserAnimationsModule carries, is the usual
 * culprit, and provideAnimationsAsync() is its replacement. An application's own handler
 * extends ResourceErrorHandler.
 */
export function provideResourceClient(
  factory: (options: ResourceClientOptions) => ClientBase,
): (Provider | EnvironmentProviders)[] {
  return [
    {
      provide: RESOURCE_CLIENT,
      useFactory: (): ClientBase =>
        factory({
          transport: httpClientTransport(inject(HttpClient), inject(UiCoreService)),
          onError: loginRedirectOn401(inject(Injector)),
        }),
    },
    { provide: ErrorHandler, useClass: ResourceErrorHandler },
    provideBrowserGlobalErrorListeners(),
    provideEnvironmentInitializer(() => {
      if (!(inject(ErrorHandler) instanceof ResourceErrorHandler)) {
        throw new Error(
          "provideResourceClient's ErrorHandler is not the one in effect: a provider placed after it re-provides " +
            'ErrorHandler, so an ApiError nobody caught would raise no notice. importProvidersFrom(BrowserModule), ' +
            'which BrowserAnimationsModule carries, does this; use provideAnimationsAsync() instead, or place ' +
            "provideResourceClient after it. An application's own handler extends ResourceErrorHandler.",
        );
      }
    }),
  ];
}

/**
 * The client's error hook. A 401 means the session is gone: the attempted URL,
 * BASE_URL plus the router's current URL, is kept in LOGIN_REDIRECT_URL
 * (AuthService.redirectUrl) for the login page to return to, and the browser goes to
 * FRONTEND_LOGIN_PATH; on the login page already, nothing moves. Every other status is
 * left to whoever awaited the request, and to the ErrorHandler when nobody did. The
 * router and the tokens are resolved when the event comes, not when the client is built:
 * AuthService injects the client, so nothing the client needs may inject AuthService.
 */
function loginRedirectOn401(injector: Injector): (error: ApiError) => void {
  return (error: ApiError): void => {
    if (error.status !== 401) {
      return;
    }
    const router = injector.get(Router);
    const loginPath = injector.get(FRONTEND_LOGIN_PATH);
    if (router.url.startsWith(loginPath)) {
      return;
    }
    injector.get(LOGIN_REDIRECT_URL).set(injector.get(BASE_URL) + router.url);
    void router.navigate([loginPath]);
  };
}

/** The notice for a request that got no response at all: no server, no network, or a blocked request. */
export const NO_RESPONSE_MESSAGE = 'The server could not be reached.';

/**
 * Angular's error handler for an application over the client: the notice is for the
 * error nobody caught. An ApiError that reaches it (a page awaited the request and let
 * the refusal through, or nothing awaited it) raises one global error notice in the
 * server's words, ApiError.message: the body's `message`, else `HTTP <status>`. A request
 * that got no response at all raises one saying so (NO_RESPONSE_MESSAGE). Every other
 * error goes to Angular's default handler, the console. Handling the error is what
 * silences the notice: the store's pageError, the row page's viewError, a component's
 * refusal signal, and a declared answer raise none, and a 401 raises none since the
 * client's hook has already returned the browser to the login page. zone.js hands an
 * unhandled promise rejection over wrapped, the cause under `rejection`, and the
 * browser's unhandledrejection event hands the cause itself, so the handler unwraps
 * before it judges.
 */
@Injectable()
export class ResourceErrorHandler extends ErrorHandler {
  private ui = inject(UiCoreService);

  override handleError(error: unknown): void {
    const cause = causeOf(error);
    if (cause instanceof ApiError) {
      if (cause.status !== 401) {
        this.ui.publishError({ message: cause.message, type: AlertType.ERROR, link: '' });
      }
      return;
    }
    if (cause instanceof HttpErrorResponse && cause.status === 0) {
      this.ui.publishError({ message: NO_RESPONSE_MESSAGE, type: AlertType.ERROR, link: '' });
      return;
    }
    super.handleError(error);
  }
}

/** The error under zone.js's "Uncaught (in promise)" wrapper and Angular's own, else the error itself. */
function causeOf(error: unknown): unknown {
  let cause = error;
  for (let depth = 0; depth < 4 && cause !== null && typeof cause === 'object'; depth++) {
    const wrapper = cause as { rejection?: unknown; ngOriginalError?: unknown };
    const inner = wrapper.rejection ?? wrapper.ngOriginalError;
    if (inner === undefined) {
      break;
    }
    cause = inner;
  }
  return cause;
}

/**
 * Mirrors a client Store into a signal. Call in an injection context; the
 * subscription ends with that context.
 */
export function storeSignal<T>(store: Store<T>): Signal<T> {
  const mirror = signal(store.get());
  const unsubscribe = store.subscribe((value) => mirror.set(value));
  inject(DestroyRef, { optional: true })?.onDestroy(unsubscribe);
  return mirror.asReadonly();
}

/**
 * The patch operation that saves an Angular form over one row, or undefined when the
 * form changed nothing (send no request for an empty diff). The diff runs over the
 * form's raw value — disabled controls included, so an untouched read-only control
 * never registers as a change — through `changes()`, which throws on a diff outside
 * the resource's patchable fields rather than dropping it silently.
 */
export function patchFromForm<Row extends object, Key extends unknown[]>(
  handle: ResourceHandleBase<Row, Key> & Batchable<unknown, Record<string, unknown>, Key>,
  row: Row,
  form: { getRawValue(): object },
): Operation | undefined {
  const diff = changes(handle, row, form.getRawValue());
  return diff ? handle.ops.patch(handle.keyOf(row), diff) : undefined;
}
