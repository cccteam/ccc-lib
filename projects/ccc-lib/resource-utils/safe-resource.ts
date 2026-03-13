import { httpResource, HttpResourceOptions, HttpResourceRef } from '@angular/common/http';
import {
  computed,
  linkedSignal,
  Resource,
  resourceFromSnapshots,
  ResourceRef,
  ResourceSnapshot,
  Signal,
} from '@angular/core';
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
  const resource = withPreviousValue(httpResource<T>(url, options));
  const safeValue = computed(() => {
    if (!resource.hasValue()) {
      return defaultValue;
    }
    return resource.value();
  });
  return { safeValue, resource: resource as ResourceRef<T | undefined> };
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
  const resource = withPreviousValue(rxResource<T, A>(options));
  const safeValue = computed(() => {
    if (!resource.hasValue()) {
      return defaultValue;
    }
    return resource.value();
  });
  return { safeValue, resource: resource as ResourceRef<T | undefined> };
}

/**
 * This utility function comes from the angular docs: https://angular.dev/guide/signals/resource#composing-resources-with-snapshots
 *
 * It takes a resource definition and provides a new resource that behaves the same as the input resource, but when the input
 * resource enters a loading state, it keeps the value from its previous state, if any.
 */
function withPreviousValue<T>(input: Resource<T>): Resource<T> {
  const derived = linkedSignal<ResourceSnapshot<T>, ResourceSnapshot<T>>({
    source: input.snapshot,
    computation: (snap, previous) => {
      if (snap.status === 'loading' && previous && previous.value.status !== 'error') {
        // When the input resource enters loading state, we keep the value
        // from its previous state, if any.
        return { status: 'loading' as const, value: previous.value.value };
      }
      // Otherwise we simply forward the state of the input resource.
      return snap;
    },
  });
  return resourceFromSnapshots(derived);
}
