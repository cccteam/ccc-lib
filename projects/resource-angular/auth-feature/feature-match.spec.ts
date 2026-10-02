import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ApiDescriptor, createClient } from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';

import { featureMatch } from './feature-match';

// A route behind featureMatch is matched only while its flag is on; off, the router
// passes over it and the URL falls to the wildcard. A deep link before the set has
// loaded loads it first, and a load the server refuses answers off. An API that serves
// no feature flags answers off without asking.

const descriptor: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
};

@Component({ template: 'the debriefs page' })
class DebriefsPageComponent {}

@Component({ template: 'not found' })
class NotFoundComponent {}

function appOver(transport: ScriptedTransport, api: ApiDescriptor = descriptor): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: RESOURCE_CLIENT, useValue: createClient(api, { baseUrl: '/api', transport }) },
      provideRouter([
        { path: 'debriefs', canMatch: [featureMatch('debriefs')], component: DebriefsPageComponent },
        { path: '**', component: NotFoundComponent },
      ]),
    ],
  });
}

const featuresAnswer = (status: number, enabled: string[]): ScriptedTransport =>
  scriptedTransport((request) =>
    request.url === '/api/features'
      ? { status, body: status === 200 ? { enabled } : { message: 'sign in first' } }
      : { status: 404, body: { message: `unscripted ${request.url}` } },
  );

describe('featureMatch', () => {
  const cases: { name: string; status: number; enabled: string[]; preload: boolean; want: 'page' | 'wildcard'; wantLoads: number }[] = [
    { name: 'the set holds the flag: the route matches', status: 200, enabled: ['debriefs'], preload: true, want: 'page', wantLoads: 1 },
    { name: 'the set does not hold the flag: the URL falls to the wildcard', status: 200, enabled: [], preload: true, want: 'wildcard', wantLoads: 1 },
    { name: 'a deep link before the set loaded loads it first, then matches', status: 200, enabled: ['debriefs'], preload: false, want: 'page', wantLoads: 1 },
    { name: 'a load the server refuses answers off: the URL falls to the wildcard', status: 401, enabled: [], preload: false, want: 'wildcard', wantLoads: 1 },
  ];

  for (const tt of cases) {
    it(tt.name, async () => {
      const transport = featuresAnswer(tt.status, tt.enabled);
      appOver(transport);
      if (tt.preload) {
        await TestBed.inject(RESOURCE_CLIENT).features.refresh();
      }
      const harness = await RouterTestingHarness.create();
      const activated = await harness.navigateByUrl('/debriefs');
      expect(activated).toBeInstanceOf(tt.want === 'page' ? DebriefsPageComponent : NotFoundComponent);
      expect(transport.requests.filter((r) => r.url === '/api/features')).toHaveLength(tt.wantLoads);
    });
  }

  it('an API that serves no feature flags: the URL falls to the wildcard and nothing is asked', async () => {
    const transport = featuresAnswer(200, ['debriefs']);
    appOver(transport, { ...descriptor, features: undefined });
    const harness = await RouterTestingHarness.create();
    const activated = await harness.navigateByUrl('/debriefs');
    expect(activated).toBeInstanceOf(NotFoundComponent);
    expect(transport.requests).toHaveLength(0);
  });

  it('an unrelated URL is not affected and asks for nothing', async () => {
    const transport = featuresAnswer(200, []);
    appOver(transport);
    const harness = await RouterTestingHarness.create();
    const activated = await harness.navigateByUrl('/elsewhere');
    expect(activated).toBeInstanceOf(NotFoundComponent);
    expect(transport.requests).toHaveLength(0);
  });
});
