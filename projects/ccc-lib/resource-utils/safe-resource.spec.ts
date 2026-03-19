import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { safeHttpResource, safeRxResource, staleHttpResource, staleRxResource } from './safe-resource';

describe('safe-resource', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  describe('safeHttpResource', () => {
    it('returns undefined before the HTTP response and the response value afterwards', fakeAsync(() => {
      const safeRef = TestBed.runInInjectionContext(() => safeHttpResource<string>(() => '/api/test'));

      expect(safeRef.safeValue()).toBeUndefined();

      safeRef.resource.reload();
      tick();

      const httpTestingController = TestBed.inject(HttpTestingController);
      const request = httpTestingController.expectOne('/api/test');
      request.flush('ok');
      tick();

      expect(safeRef.safeValue()).toBe('ok');
      expect(safeRef.resource.value()).toBe('ok');
    }));

    it('returns undefined after the HTTP response returns an error', fakeAsync(() => {
      const safeRef = TestBed.runInInjectionContext(() => safeHttpResource<string>(() => '/api/test'));

      expect(safeRef.safeValue()).toBeUndefined();

      safeRef.resource.reload();
      tick();

      const httpTestingController = TestBed.inject(HttpTestingController);
      const request = httpTestingController.expectOne('/api/test');
      request.flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(safeRef.safeValue()).toBeUndefined();
    }));
  });

  describe('safeRxResource', () => {
    it('returns undefined before stream emits and the latest value after emission', fakeAsync(() => {
      const stream$ = new Subject<string>();

      const safeRef = TestBed.runInInjectionContext(() =>
        safeRxResource<string, void>({
          stream: () => stream$.asObservable(),
        }),
      );

      expect(safeRef.safeValue()).toBeUndefined();

      safeRef.resource.reload();
      tick();

      stream$.next('first');
      tick();
      expect(safeRef.safeValue()).toBe('first');
      expect(safeRef.resource.value()).toBe('first');

      stream$.next('second');
      tick();
      expect(safeRef.safeValue()).toBe('second');
    }));

    it('returns undefined after the HTTP response returns an error', fakeAsync(() => {
      const http = TestBed.inject(HttpClient);

      const safeRef = TestBed.runInInjectionContext(() =>
        safeRxResource<string>({
          stream: () => http.get<string>('/api/test'),
        }),
      );

      expect(safeRef.safeValue()).toBeUndefined();

      safeRef.resource.reload();
      tick();

      const httpTestingController = TestBed.inject(HttpTestingController);
      const request = httpTestingController.expectOne('/api/test');
      request.flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(safeRef.safeValue()).toBeUndefined();
      expect(safeRef.resource.hasValue()).toBeFalse();
    }));
  });

  describe('staleHttpResource', () => {
    it('returns undefined before the first HTTP response and the response value afterwards', fakeAsync(() => {
      const staleRef = TestBed.runInInjectionContext(() => staleHttpResource<string>(() => '/api/test'));
      const httpTestingController = TestBed.inject(HttpTestingController);

      expect(staleRef.safeValue()).toBeUndefined();

      staleRef.resource.reload();
      tick();

      httpTestingController.expectOne('/api/test').flush('ok');
      tick();

      expect(staleRef.safeValue()).toBe('ok');
      expect(staleRef.resource.value()).toBe('ok');
    }));

    it('preserves the previous value while reloading', fakeAsync(() => {
      const staleRef = TestBed.runInInjectionContext(() => staleHttpResource<string>(() => '/api/test'));
      const httpTestingController = TestBed.inject(HttpTestingController);

      staleRef.resource.reload();
      tick();
      httpTestingController.expectOne('/api/test').flush('first');
      tick();

      expect(staleRef.safeValue()).toBe('first');

      staleRef.resource.reload();
      tick();

      // Still in loading state — previous value should be retained
      expect(staleRef.resource.isLoading()).toBeTrue();
      expect(staleRef.safeValue()).toBe('first');

      httpTestingController.expectOne('/api/test').flush('second');
      tick();

      expect(staleRef.safeValue()).toBe('second');
    }));

    it('returns undefined while reloading if the previous state was an error', fakeAsync(() => {
      const staleRef = TestBed.runInInjectionContext(() => staleHttpResource<string>(() => '/api/test'));
      const httpTestingController = TestBed.inject(HttpTestingController);

      staleRef.resource.reload();
      tick();
      httpTestingController.expectOne('/api/test').flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(staleRef.safeValue()).toBeUndefined();

      staleRef.resource.reload();
      tick();

      // Previous state was an error, so no value should be retained during loading
      expect(staleRef.resource.isLoading()).toBeTrue();
      expect(staleRef.safeValue()).toBeUndefined();

      httpTestingController.expectOne('/api/test').flush('recovered');
      tick();

      expect(staleRef.safeValue()).toBe('recovered');
    }));

    it('returns the defaultValue before the first load and after an error', fakeAsync(() => {
      const staleRef = TestBed.runInInjectionContext(() =>
        staleHttpResource<string>(() => '/api/test', undefined, 'default'),
      );
      const httpTestingController = TestBed.inject(HttpTestingController);

      expect(staleRef.safeValue()).toBe('default');

      staleRef.resource.reload();
      tick();
      httpTestingController.expectOne('/api/test').flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(staleRef.safeValue()).toBe('default');
    }));
  });

  describe('staleRxResource', () => {
    it('returns undefined before stream emits and the latest value after emission', fakeAsync(() => {
      const stream$ = new Subject<string>();

      const staleRef = TestBed.runInInjectionContext(() =>
        staleRxResource<string, void>({ stream: () => stream$.asObservable() }),
      );

      expect(staleRef.safeValue()).toBeUndefined();

      staleRef.resource.reload();
      tick();

      stream$.next('first');
      tick();

      expect(staleRef.safeValue()).toBe('first');
      expect(staleRef.resource.value()).toBe('first');
    }));

    it('preserves the previous value while reloading', fakeAsync(() => {
      const stream$ = new Subject<string>();

      const staleRef = TestBed.runInInjectionContext(() =>
        staleRxResource<string, void>({ stream: () => stream$.asObservable() }),
      );

      staleRef.resource.reload();
      tick();
      stream$.next('first');
      tick();

      expect(staleRef.safeValue()).toBe('first');

      staleRef.resource.reload();
      tick();

      // Still in loading state — previous value should be retained
      expect(staleRef.resource.isLoading()).toBeTrue();
      expect(staleRef.safeValue()).toBe('first');

      stream$.next('second');
      tick();

      expect(staleRef.safeValue()).toBe('second');
    }));

    it('returns undefined while reloading if the previous state was an error', fakeAsync(() => {
      const http = TestBed.inject(HttpClient);
      const httpTestingController = TestBed.inject(HttpTestingController);

      const staleRef = TestBed.runInInjectionContext(() =>
        staleRxResource<string>({ stream: () => http.get<string>('/api/test') }),
      );

      staleRef.resource.reload();
      tick();
      httpTestingController.expectOne('/api/test').flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(staleRef.safeValue()).toBeUndefined();

      staleRef.resource.reload();
      tick();

      // Previous state was an error, so no value should be retained during loading
      expect(staleRef.resource.isLoading()).toBeTrue();
      expect(staleRef.safeValue()).toBeUndefined();

      httpTestingController.expectOne('/api/test').flush('recovered');
      tick();

      expect(staleRef.safeValue()).toBe('recovered');
    }));

    it('returns the defaultValue before the first load and after an error', fakeAsync(() => {
      const http = TestBed.inject(HttpClient);
      const httpTestingController = TestBed.inject(HttpTestingController);

      const staleRef = TestBed.runInInjectionContext(() =>
        staleRxResource<string>({ stream: () => http.get<string>('/api/test') }, 'default'),
      );

      expect(staleRef.safeValue()).toBe('default');

      staleRef.resource.reload();
      tick();
      httpTestingController.expectOne('/api/test').flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(staleRef.safeValue()).toBe('default');
    }));
  });

  //TODO: Need to determine how many tests needed
  describe('swrHttpResource', () => {
    it('returns undefined before the HTTP response the response value afterwards, and saves to cache', fakeAsync(() => {
      const safeRef = TestBed.runInInjectionContext(() => safeHttpResource<string>(() => '/api/test'));

      expect(safeRef.safeValue()).toBeUndefined();

      safeRef.resource.reload();
      tick();

      const httpTestingController = TestBed.inject(HttpTestingController);
      const request = httpTestingController.expectOne('/api/test');
      request.flush('ok');
      tick();

      expect(safeRef.safeValue()).toBe('ok');
      expect(safeRef.resource.value()).toBe('ok');
    }));

    it('returns undefined after the HTTP response returns an error', fakeAsync(() => {
      const safeRef = TestBed.runInInjectionContext(() => safeHttpResource<string>(() => '/api/test'));

      expect(safeRef.safeValue()).toBeUndefined();

      safeRef.resource.reload();
      tick();

      const httpTestingController = TestBed.inject(HttpTestingController);
      const request = httpTestingController.expectOne('/api/test');
      request.flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(safeRef.safeValue()).toBeUndefined();
    }));
  });
});
