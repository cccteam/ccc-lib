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
