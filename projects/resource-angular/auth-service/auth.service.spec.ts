import { TestBed } from '@angular/core/testing';
import { ApiDescriptor, createClient } from '@cccteam/resource';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { LOGIN_REDIRECT_URL } from '@cccteam/resource-angular/types';

import { AuthService } from './auth.service';

const descriptor: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
};

describe('AuthService', () => {
  it('fails at startup without RESOURCE_CLIENT, naming the way in', () => {
    TestBed.configureTestingModule({});
    expect(() => TestBed.inject(AuthService)).toThrowError(/RESOURCE_CLIENT[\s\S]*provideResourceClient/);
  });

  it('redirectUrl is the LOGIN_REDIRECT_URL signal the client hook writes', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: RESOURCE_CLIENT, useValue: createClient(descriptor, { baseUrl: '/api' }) }],
    });
    const auth = TestBed.inject(AuthService);
    TestBed.inject(LOGIN_REDIRECT_URL).set('/deck');
    expect(auth.redirectUrl()).toBe('/deck');
    auth.redirectUrl.set('');
    expect(TestBed.inject(LOGIN_REDIRECT_URL)()).toBe('');
  });
});
