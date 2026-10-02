import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiDescriptor, createClient } from '@cccteam/resource';
import { scriptedTransport } from '@cccteam/resource/testing';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';

import { FeatureDirective } from './feature.directive';

// The directive renders while the flag is on and nothing while it is off, before the
// enabled set has loaded included; it follows a refresh of the set; and no name renders.

const descriptor: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
};

@Component({
  imports: [FeatureDirective],
  template: `<p *cccFeature="feature()">Debriefs</p>`,
})
class HostComponent {
  feature = signal<string | undefined>('debriefs');
}

describe('FeatureDirective', () => {
  let enabled: string[] = [];

  async function host(): Promise<{ element: HTMLElement; component: HostComponent }> {
    const transport = scriptedTransport((request) =>
      request.url === '/api/features'
        ? { status: 200, body: { enabled } }
        : { status: 404, body: { message: `unscripted ${request.url}` } },
    );
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { element: fixture.nativeElement as HTMLElement, component: fixture.componentInstance };
  }

  const rendered = (element: HTMLElement): boolean => element.querySelector('p') !== null;

  it('renders nothing before the enabled set has loaded, and the template once the set holds the flag', async () => {
    enabled = ['debriefs'];
    const { element } = await host();
    expect(rendered(element)).toBe(false);

    await TestBed.inject(RESOURCE_CLIENT).features.refresh();
    TestBed.tick();
    expect(rendered(element)).toBe(true);
    expect(element.textContent).toContain('Debriefs');
  });

  it('renders nothing when the set does not hold the flag, and follows a refresh that turns it on and off again', async () => {
    enabled = [];
    const { element } = await host();
    const client = TestBed.inject(RESOURCE_CLIENT);
    await client.features.refresh();
    TestBed.tick();
    expect(rendered(element)).toBe(false);

    enabled = ['debriefs'];
    await client.features.refresh();
    TestBed.tick();
    expect(rendered(element)).toBe(true);

    enabled = [];
    await client.features.refresh();
    TestBed.tick();
    expect(rendered(element)).toBe(false);
  });

  it('renders unconditionally when no flag is named', async () => {
    enabled = [];
    const { element, component } = await host();
    expect(rendered(element)).toBe(false);
    component.feature.set(undefined);
    TestBed.tick();
    expect(rendered(element)).toBe(true);
  });

  it('forgets the template when the set is cleared at logout', async () => {
    enabled = ['debriefs'];
    const { element } = await host();
    const client = TestBed.inject(RESOURCE_CLIENT);
    await client.features.refresh();
    TestBed.tick();
    expect(rendered(element)).toBe(true);
    client.features.clear();
    TestBed.tick();
    expect(rendered(element)).toBe(false);
  });
});
