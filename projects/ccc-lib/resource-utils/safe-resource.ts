import { httpResource, HttpResourceOptions, HttpResourceRef } from '@angular/common/http';
import { computed, linkedSignal, ResourceRef, ResourceSnapshot, Signal } from '@angular/core';
import { rxResource, RxResourceOptions } from '@angular/core/rxjs-interop';

export interface SafeResourceRef<T> {
  safeValue: Signal<T | undefined>;
  resource: ResourceRef<T | undefined>;
}

/**
 * Creates a `SafeResourceRef` that wraps an HTTP resource.
 *
 *
 * The purpose of this utility function is to prevent the resource from dropping the entire application
 * into an exception state when the resource.value() is read after it fails to load.
 *
 * If it does not have a value, it will return `undefined` (or the provided `defaultValue` if specified).
 */
export function safeHttpResource<T>(
  url: () => string | undefined,
  options?: HttpResourceOptions<T, unknown> | undefined,
  defaultValue?: T,
): SafeResourceRef<T> {
  const resource = httpResource<T>(url, options);
  const safeValue = computed(() => {
    if (!resource.hasValue()) {
      return defaultValue;
    }
    return resource.value();
  });
  return { safeValue, resource: resource as HttpResourceRef<T | undefined> };
}

/**
 * Creates a `SafeResourceRef` that wraps an RxJS resource.
 *
 * The purpose of this utility function is to prevent the resource from dropping the entire application
 * into an exception state when the resource.value() is read after it fails to load.
 *
 * If it does not have a value, it will return `undefined` (or the provided `defaultValue` if specified).
 */
export function safeRxResource<T, A = unknown>(options: RxResourceOptions<T, A>, defaultValue?: T): SafeResourceRef<T> {
  const resource = rxResource<T, A>(options);
  const safeValue = computed(() => {
    if (!resource.hasValue()) {
      return defaultValue;
    }
    return resource.value();
  });
  return { safeValue, resource: resource as ResourceRef<T | undefined> };
}

/**
 * Creates a `SafeResourceRef` that wraps an HTTP resource and preserves its previous value when it enters a loading state.
 *
 * The purpose of this utility function is to prevent the resource from dropping the entire application
 * into an exception state when the resource.value() is read after it fails to load, while also preserving the previous value during loading.
 *
 */
export function staleHttpResource<T>(
  url: () => string | undefined,
  options?: HttpResourceOptions<T, unknown> | undefined,
  defaultValue?: T,
): SafeResourceRef<T> {
  const resource = httpResource<T>(url, options);
  const safeValue = linkedSignal<ResourceSnapshot<T | undefined>, T | undefined>({
    source: resource.snapshot as Signal<ResourceSnapshot<T | undefined>>,
    computation: (snap, previous) => {
      if (snap.status === 'resolved' || snap.status === 'local') {
        return (snap.value as T) ?? defaultValue;
      }
      // Hold the last good value (SWR)
      if (snap.status === 'loading' || snap.status === 'reloading') {
        return previous?.value ?? defaultValue;
      }
      return defaultValue;
    },
  });
  return { safeValue, resource: resource as HttpResourceRef<T | undefined> };
}

/**
 * Creates a `SafeResourceRef` that wraps an RxJS resource and preserves its previous value when it enters a loading state.
 *
 * The purpose of this utility function is to prevent the resource from dropping the entire application
 * into an exception state when the resource.value() is read after it fails to load, while also preserving the previous value during loading.
 *
 */
export function staleRxResource<T, A = unknown>(
  options: RxResourceOptions<T, A>,
  defaultValue?: T,
): SafeResourceRef<T> {
  const resource = rxResource<T, A>(options);

  const safeValue = linkedSignal<ResourceSnapshot<T | undefined>, T | undefined>({
    source: resource.snapshot as Signal<ResourceSnapshot<T | undefined>>,
    computation: (snap, previous) => {
      if (snap.status === 'resolved' || snap.status === 'local') {
        return (snap.value as T) ?? defaultValue;
      }
      // Hold the last good value (SWR)
      if (snap.status === 'loading' || snap.status === 'reloading') {
        return previous?.value ?? defaultValue;
      }
      return defaultValue;
    },
  });
  return { safeValue, resource: resource as ResourceRef<T | undefined> };
}
