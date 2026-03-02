import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { safeHttpResource, safeRxResource } from './safe-resource';

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
});
