import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ApiDescriptor,
  createClient,
  IssuedToken,
  TokenRow,
  TransportRequest,
  TransportResponse,
} from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';

import { noTokensSentence, TokensComponent } from './tokens.component';

// The component configures itself from the descriptor's tokens block: it lists the
// person's live tokens as served, each kind in its own words, issues an application token
// by name for an outlet (chosen among several, fixed where there is one) and shows the
// value once with a Copy button, asks before a revoke and says a device grant's pair goes
// together, renders a refusal in place, reads the list again after every write, and says
// in one sentence where the application issues no tokens.

const tokensBlock = {
  route: 'user/tokens',
  revokeRoute: 'user/tokens/revoke',
  deviceRoute: 'user/device',
  approveRoute: 'user/device/approve',
  denyRoute: 'user/device/deny',
};

const base: ApiDescriptor = {
  resources: {},
  methods: {},
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
};

/** Two outlets: the form offers the choice. */
const descriptor: ApiDescriptor = {
  ...base,
  tokens: {
    ...tokensBlock,
    outlets: [
      { name: 'machines', prefix: '/machines' },
      { name: 'exports', prefix: '/exports' },
    ],
  },
};

/** One outlet: the form names it and offers no choice. */
const oneOutlet: ApiDescriptor = {
  ...base,
  tokens: { ...tokensBlock, outlets: [{ name: 'machines', prefix: '/machines' }] },
};

const rows = (): TokenRow[] => [
  {
    id: 't-3',
    kind: 'refresh',
    outlet: 'machines',
    clientId: 'impulse on hollis-laptop',
    createdAt: '2026-10-24T10:00:00Z',
    expiresAt: '2026-11-23T10:00:00Z',
  },
  {
    id: 't-2',
    kind: 'access',
    outlet: 'machines',
    clientId: 'impulse on hollis-laptop',
    createdAt: '2026-10-24T10:00:00Z',
    expiresAt: '2026-10-24T11:00:00Z',
    lastUsedAt: '2026-10-24T10:05:00Z',
  },
  {
    id: 't-1',
    kind: 'application',
    name: 'nightly export',
    outlet: 'exports',
    createdAt: '2026-10-01T09:00:00Z',
    expiresAt: '2027-10-01T09:00:00Z',
  },
];

const issued: IssuedToken = {
  id: 't-4',
  token: 'secret-shown-once',
  name: 'build server',
  outlet: 'exports',
  expiresAt: '2027-10-25T09:00:00Z',
};

interface Server {
  rows: TokenRow[];
  issue: TransportResponse;
  revoke: TransportResponse;
}

function transportOf(state: Server): ScriptedTransport {
  return scriptedTransport((request: TransportRequest) => {
    const path = request.url.replace(/\?.*$/, '');
    switch (`${request.method} ${path}`) {
      case 'GET /api/user/tokens':
        return { status: 200, body: state.rows };
      case 'POST /api/user/tokens':
        return state.issue;
      case 'POST /api/user/tokens/revoke':
        return state.revoke;
      default:
        return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
    }
  });
}

interface Page {
  fixture: ComponentFixture<TokensComponent>;
  component: TokensComponent;
  transport: ScriptedTransport;
  element: HTMLElement;
  settle(): Promise<void>;
}

async function pageOver(state: Partial<Server> = {}, api: ApiDescriptor = descriptor): Promise<Page> {
  const transport = transportOf({
    rows: rows(),
    issue: { status: 200, body: issued },
    revoke: { status: 200, body: {} },
    ...state,
  });
  await TestBed.configureTestingModule({
    imports: [TokensComponent],
    providers: [
      provideResourceTesting({ transport, client: (t) => createClient(api, { baseUrl: '/api', transport: t }) }),
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(TokensComponent);
  const page: Page = {
    fixture,
    component: fixture.componentInstance,
    transport,
    element: fixture.nativeElement as HTMLElement,
    settle: async () => {
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();
      fixture.detectChanges();
    },
  };
  await page.settle();
  return page;
}

const sent = (transport: ScriptedTransport): string[] => transport.requests.map((r) => `${r.method} ${r.url}`);
const textOf = (element: Element | null): string => element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const rowsOf = (page: Page): HTMLElement[] => Array.from(page.element.querySelectorAll<HTMLElement>('tr.ccc-token'));
const cell = (row: HTMLElement, name: string): string => textOf(row.querySelector(`.ccc-token-${name}`));
const alertOf = (page: Page): string => textOf(page.element.querySelector('[role="alert"]'));

describe('TokensComponent lists the tokens', () => {
  it('reads the list on arrival and shows each row as served: an application token by name, a device grant by its client and each kind, the outlet, and the last use or never', async () => {
    const page = await pageOver();
    expect(sent(page.transport)).toEqual(['GET /api/user/tokens']);
    const table = rowsOf(page);
    expect(table.map((row) => cell(row, 'name'))).toEqual([
      'impulse on hollis-laptop',
      'impulse on hollis-laptop',
      'nightly export',
    ]);
    expect(table.map((row) => cell(row, 'kind'))).toEqual([
      'Refresh token of a program',
      'Access token of a program',
      'Application token',
    ]);
    expect(table.map((row) => cell(row, 'outlet'))).toEqual(['machines', 'machines', 'exports']);
    expect(table.map((row) => cell(row, 'last'))).toEqual(['Never', expect.not.stringMatching(/^Never$/), 'Never']);
    expect(cell(table[2], 'created')).not.toBe('');
    expect(cell(table[2], 'expires')).not.toBe('');
  });

  it('says so when there are none', async () => {
    const page = await pageOver({ rows: [] });
    expect(rowsOf(page)).toEqual([]);
    expect(textOf(page.element.querySelector('.ccc-tokens-note'))).toBe('You have no tokens.');
  });

  it('shows the one sentence where the descriptor carries no tokens block, and asks for nothing', async () => {
    const page = await pageOver({}, base);
    expect(textOf(page.element.querySelector('.ccc-tokens-unserved'))).toBe(noTokensSentence);
    expect(textOf(page.element.querySelector('.ccc-tokens-unserved'))).toBe(
      'This application issues no tokens for the signed-in person.',
    );
    expect(sent(page.transport)).toEqual([]);
    expect(page.element.querySelector('form')).toBeNull();
  });
});

describe('TokensComponent issues a token', () => {
  it('offers the outlets as a choice where there are several, and names the one where there is one', async () => {
    const several = await pageOver();
    expect(several.element.querySelector('mat-select[name="outlet"]')).not.toBeNull();
    expect(several.component.outlet).toBe('');
    TestBed.resetTestingModule();
    const one = await pageOver({}, oneOutlet);
    expect(one.element.querySelector('mat-select[name="outlet"]')).toBeNull();
    expect(textOf(one.element.querySelector('.ccc-tokens-outlet'))).toBe('For machines (served at /machines)');
    expect(one.component.outlet).toBe('machines');
  });

  it('posts the name and the outlet, shows the value once with the sentence, and reads the list again', async () => {
    const page = await pageOver();
    page.transport.requests.length = 0;
    page.component.name = 'build server';
    page.component.outlet = 'exports';
    await page.component.issue();
    await page.settle();
    expect(sent(page.transport)).toEqual(['POST /api/user/tokens', 'GET /api/user/tokens']);
    expect(page.transport.requests[0].body).toEqual({ name: 'build server', outlet: 'exports' });
    const field = page.element.querySelector<HTMLInputElement>('.ccc-tokens-issued input');
    expect(field?.value).toBe('secret-shown-once');
    expect(field?.readOnly).toBe(true);
    expect(textOf(page.element.querySelector('.ccc-tokens-issued-note'))).toBe(
      'The token build server for exports is ready. Copy it now; it is not shown again.',
    );
    expect(page.element.querySelector('.ccc-tokens-issue')).toBeNull();
    expect(page.component.name).toBe('');
    page.component.dismissIssued();
    await page.settle();
    expect(page.element.querySelector('.ccc-tokens-issued')).toBeNull();
    expect(page.element.querySelector('.ccc-tokens-issue')).not.toBeNull();
  });

  it('posts nothing without a name or an outlet', async () => {
    const page = await pageOver();
    page.transport.requests.length = 0;
    page.component.name = '   ';
    page.component.outlet = 'exports';
    await page.component.issue();
    page.component.name = 'build server';
    page.component.outlet = '';
    await page.component.issue();
    expect(sent(page.transport)).toEqual([]);
  });

  it("renders the server's refusal in place, and shows no value", async () => {
    const page = await pageOver({
      issue: { status: 400, body: { message: '"vault" is not a machine outlet of this application' } },
    });
    page.component.name = 'build server';
    page.component.outlet = 'exports';
    await page.component.issue();
    await page.settle();
    expect(alertOf(page)).toBe('"vault" is not a machine outlet of this application');
    expect(page.component.issued()).toBeUndefined();
    expect(page.element.querySelector('.ccc-tokens-issued')).toBeNull();
  });

  it('selects the value in the field where the browser offers no clipboard, so it can be copied by hand', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    try {
      const page = await pageOver();
      page.component.name = 'build server';
      page.component.outlet = 'exports';
      await page.component.issue();
      await page.settle();
      const field = page.element.querySelector<HTMLInputElement>('.ccc-tokens-issued input');
      if (!field) {
        throw new Error('no field holds the issued value');
      }
      await page.component.copy(field);
      await page.settle();
      expect(field.selectionStart).toBe(0);
      expect(field.selectionEnd).toBe('secret-shown-once'.length);
      expect(page.component.copied()).toBe(false);
      expect(page.element.querySelector('.ccc-tokens-copied')).toBeNull();
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('puts the value on the clipboard where the browser offers one, and says so', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    try {
      const page = await pageOver();
      page.component.name = 'build server';
      page.component.outlet = 'exports';
      await page.component.issue();
      await page.settle();
      const field = page.element.querySelector<HTMLInputElement>('.ccc-tokens-issued input');
      if (!field) {
        throw new Error('no field holds the issued value');
      }
      await page.component.copy(field);
      await page.settle();
      expect(writeText).toHaveBeenCalledWith('secret-shown-once');
      expect(textOf(page.element.querySelector('.ccc-tokens-copied'))).toBe('Copied.');
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});

describe('TokensComponent revokes a token', () => {
  it('asks first, posts the id on the second click, and reads the list again', async () => {
    const page = await pageOver();
    page.transport.requests.length = 0;
    const [, , application] = page.component.rows();
    await page.component.revoke(application);
    await page.settle();
    expect(sent(page.transport)).toEqual([]);
    const row = rowsOf(page)[2];
    expect(textOf(row.querySelector('.ccc-token-confirm'))).toBe('Revoke nightly export?');
    expect(row.querySelector('.ccc-token-revoke-confirm')).not.toBeNull();
    expect(row.querySelector('.ccc-token-revoke-cancel')).not.toBeNull();
    await page.component.revoke(application);
    await page.settle();
    expect(sent(page.transport)).toEqual(['POST /api/user/tokens/revoke', 'GET /api/user/tokens']);
    expect(page.transport.requests[0].body).toEqual({ id: 't-1' });
    expect(page.component.confirmingRevoke()).toBeUndefined();
    expect(rowsOf(page)[2].querySelector('.ccc-token-confirm')).toBeNull();
  });

  it('says a device grant goes as a pair, and cancels on request', async () => {
    const page = await pageOver();
    page.transport.requests.length = 0;
    const [refresh] = page.component.rows();
    await page.component.revoke(refresh);
    await page.settle();
    expect(textOf(rowsOf(page)[0].querySelector('.ccc-token-confirm'))).toBe(
      'Revoke the access of impulse on hollis-laptop? Its access and refresh tokens are revoked together.',
    );
    page.component.cancelRevoke();
    await page.settle();
    expect(rowsOf(page)[0].querySelector('.ccc-token-confirm')).toBeNull();
    expect(rowsOf(page)[0].querySelector('.ccc-token-revoke')).not.toBeNull();
    expect(sent(page.transport)).toEqual([]);
  });

  it("renders the server's refusal in place when no live token answers to the id", async () => {
    const page = await pageOver({ revoke: { status: 404, body: { message: 'no live token' } } });
    const [, , application] = page.component.rows();
    await page.component.revoke(application);
    await page.component.revoke(application);
    await page.settle();
    expect(alertOf(page)).toBe('no live token');
  });
});
