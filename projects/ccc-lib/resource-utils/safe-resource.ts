import { httpResource, HttpResourceOptions, HttpResourceRef } from '@angular/common/http';
import { computed, ResourceRef, Signal } from '@angular/core';
import { rxResource, RxResourceOptions } from '@angular/core/rxjs-interop';

export interface SafeResourceRef<T> {
  safeValue: Signal<T | undefined>;
  resource: ResourceRef<T | undefined>;
}

export function safeHttpResource<T>(
  url: () => string | undefined,
  options?: HttpResourceOptions<T, unknown> | undefined,
): SafeResourceRef<T> {
  const resource = httpResource<T>(url, options);
  const safeValue = computed(() => {
    if (!resource.hasValue()) {
      return undefined;
    }
    return resource.value();
  });
  return { safeValue, resource: resource as HttpResourceRef<T | undefined> };
}

export function safeRxResource<T, A = unknown>(options: RxResourceOptions<T, A>): SafeResourceRef<T> {
  const resource = rxResource<T, A>(options);
  const safeValue = computed(() => {
    if (!resource.hasValue()) {
      return undefined;
    }
    return resource.value();
  });
  return { safeValue, resource: resource as ResourceRef<T | undefined> };
}
