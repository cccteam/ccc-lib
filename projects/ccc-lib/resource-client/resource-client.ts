import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, InjectionToken, Provider, signal, Signal } from '@angular/core';
import { ClientBase, Store, Transport } from '@cccteam/resource';
import { firstValueFrom } from 'rxjs';

/**
 * The application's @cccteam/resource client. The app provides it (through
 * provideResourceClient) so the library's permission surface — AuthService, the
 * authorization guard, the has-permission directive — answers from the same digest
 * cache the app's own pages use. Inject it and narrow to the generated Api type.
 */
export const RESOURCE_CLIENT = new InjectionToken<ClientBase>('RESOURCE_CLIENT');

/**
 * A Transport over Angular's HttpClient, so client requests run through the app's
 * interceptors (loading indicator, error toasts, login redirect on 401) exactly like
 * the library's own requests. Error responses resolve — the client raises ApiError.
 */
export function httpClientTransport(http: HttpClient): Transport {
  return async (request) => {
    try {
      const response = await firstValueFrom(
        http.request(request.method, request.url, { body: request.body, observe: 'response' }),
      );
      return { status: response.status, body: response.body ?? undefined };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status > 0) {
        return { status: error.status, body: error.error ?? undefined };
      }
      throw error;
    }
  };
}

/**
 * Registers the app's client. The factory receives a transport over the injector's
 * HttpClient; pass it to the generated createApi so interceptors keep applying.
 */
export function provideResourceClient(factory: (transport: Transport) => ClientBase): Provider[] {
  return [
    {
      provide: RESOURCE_CLIENT,
      useFactory: (): ClientBase => factory(httpClientTransport(inject(HttpClient))),
    },
  ];
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
