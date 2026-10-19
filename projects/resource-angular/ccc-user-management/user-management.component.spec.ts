import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ApiDescriptor,
  CapabilitiesProperty,
  createClient,
  Domain,
  RoleRow,
  TransportRequest,
  TransportResponse,
} from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';

import { ManagedUser, UserManagementComponent } from './user-management.component';

// The component configures itself from the descriptor's userSurfaces block: the surface
// `auth` names (the first by default) and the partition `domain` selects, reading the
// users with their capability envelope and the roles a seat may take. Every control
// follows a capability, the digest's or the row's; each action goes to the partition's
// route with the body the surface takes, a refusal is shown in place, and the page is
// read again after every write.

const sectors = { segment: 'sectors', param: 'sectorID' };

const resourceEntry = (
  resource: string,
  route: string,
  scope: 'global' | 'domain',
  keys: string[],
  operations: string[],
  patchable?: string[],
) => ({
  resource,
  property: resource[0].toLowerCase() + resource.slice(1),
  route,
  scope,
  consolidated: false,
  keys,
  operations,
  page: { default: 50 },
  ...(patchable ? { patchable } : {}),
});
const methodEntry = (method: string, route: string, scope: 'global' | 'domain') => ({
  method,
  property: method[0].toLowerCase() + method.slice(1),
  route,
  scope,
});

const userOps = ['list', 'read', 'create', 'patch', 'remove'];
const seatOps = ['list', 'read', 'create', 'remove'];
const readOps = ['list', 'read'];

/** Crew: a password method and a role-syncing Google registration, with a tenant partition; Members: an invited directory alone, global only. */
const descriptor = {
  domainRoute: sectors,
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
  resources: {
    CrewUsers: resourceEntry('CrewUsers', 'crew-users', 'global', ['id'], userOps, ['username', 'disabled']),
    CrewSeats: resourceEntry('CrewSeats', 'crew-seats', 'global', ['user', 'role'], seatOps),
    CrewRoles: resourceEntry('CrewRoles', 'crew-roles', 'global', ['name'], readOps),
    CrewSectorUsers: resourceEntry('CrewSectorUsers', 'crew-sector-users', 'domain', ['id'], userOps, ['username', 'disabled']),
    CrewSectorSeats: resourceEntry('CrewSectorSeats', 'crew-sector-seats', 'domain', ['user', 'role'], seatOps),
    CrewSectorRoles: resourceEntry('CrewSectorRoles', 'crew-sector-roles', 'domain', ['name'], readOps),
    MembersUsers: resourceEntry('MembersUsers', 'members-users', 'global', ['id'], userOps, ['username', 'disabled']),
    MembersSeats: resourceEntry('MembersSeats', 'members-seats', 'global', ['user', 'role'], seatOps),
    MembersRoles: resourceEntry('MembersRoles', 'members-roles', 'global', ['name'], readOps),
  },
  methods: {
    SetCrewUserPassword: methodEntry('SetCrewUserPassword', 'set-crew-user-password', 'global'),
    UnlinkCrewUserIdentity: methodEntry('UnlinkCrewUserIdentity', 'unlink-crew-user-identity', 'global'),
    SetCrewSectorUserPassword: methodEntry('SetCrewSectorUserPassword', 'set-crew-sector-user-password', 'domain'),
    UnlinkCrewSectorUserIdentity: methodEntry('UnlinkCrewSectorUserIdentity', 'unlink-crew-sector-user-identity', 'domain'),
    UnlinkMembersUserIdentity: methodEntry('UnlinkMembersUserIdentity', 'unlink-members-user-identity', 'global'),
  },
  userSurfaces: [
    {
      auth: 'Crew',
      label: 'Crew',
      password: true,
      registrations: [{ name: 'google', kind: 'google', label: 'Fleet directory', invited: false, syncsRoles: true }],
      partitions: [
        {
          scope: 'global',
          users: 'CrewUsers',
          seats: 'CrewSeats',
          roles: 'CrewRoles',
          setPassword: 'SetCrewUserPassword',
          unlinkIdentity: 'UnlinkCrewUserIdentity',
        },
        {
          scope: 'domain',
          users: 'CrewSectorUsers',
          seats: 'CrewSectorSeats',
          roles: 'CrewSectorRoles',
          setPassword: 'SetCrewSectorUserPassword',
          unlinkIdentity: 'UnlinkCrewSectorUserIdentity',
        },
      ],
    },
    {
      auth: 'Members',
      label: 'Members',
      password: false,
      registrations: [{ name: 'directory', kind: 'azure', label: 'Company directory', invited: true, syncsRoles: false }],
      partitions: [
        {
          scope: 'global',
          users: 'MembersUsers',
          seats: 'MembersSeats',
          roles: 'MembersRoles',
          unlinkIdentity: 'UnlinkMembersUserIdentity',
        },
      ],
    },
  ],
} as unknown as ApiDescriptor;

/** A descriptor from a generator that predates the surfaces. */
const withoutSurfaces = Object.fromEntries(
  Object.entries(descriptor).filter(([key]) => key !== 'userSurfaces'),
) as ApiDescriptor;

const everything = { Update: ['username', 'disabled'], Delete: true, Execute: ['SetCrewUserPassword', 'UnlinkCrewUserIdentity'] };

function user(overrides: Partial<ManagedUser> & { id: string; username: string }): ManagedUser {
  return {
    disabled: false,
    hasPassword: true,
    passwordChangeRequired: false,
    createdAt: '2026-10-01T09:00:00Z',
    lastSignInAt: '2026-10-18T07:30:00Z',
    organization: null,
    identities: [],
    roles: [],
    everywhereRoles: [],
    rolesSynced: false,
    [CapabilitiesProperty]: everything,
    ...overrides,
  };
}

/** Hollis signs in with a password and the directory, which writes her seats; Nova is the caller, whose own row withholds the disable, the delete and the password reset; Pip has a password alone and no seat yet. */
const rows = (): ManagedUser[] => [
  user({
    id: 'u-hollis',
    username: 'hollis',
    roles: ['Harbormaster', 'SectorCrew'],
    rolesSynced: true,
    identities: [
      {
        id: 'i-1',
        method: 'google',
        connection: 'google',
        subject: '1001',
        organization: 'fleet.example',
        email: 'hollis@fleet.example',
        linkedAt: '2026-10-02T09:00:00Z',
        lastUsedAt: '2026-10-18T07:30:00Z',
      },
    ],
  }),
  user({
    id: 'u-nova',
    username: 'nova',
    roles: ['Headquarters'],
    passwordChangeRequired: true,
    [CapabilitiesProperty]: { Update: ['username'], Delete: false, Execute: ['UnlinkCrewUserIdentity'] },
  }),
  user({ id: 'u-pip', username: 'pip', lastSignInAt: null, disabled: true }),
];

const roleRows = (): RoleRow[] => [
  { name: 'Harbormaster', kind: 'domain' },
  { name: 'Headquarters', kind: 'global' },
  { name: 'SectorCrew', kind: 'domain' },
];

interface Server {
  rows: ManagedUser[];
  roles: RoleRow[];
  /** The digest, the same in every scope. */
  digest: Record<string, Record<string, string>>;
  /** What each write answers; a spec changes one to script a refusal. */
  answer: (request: TransportRequest) => TransportResponse | undefined;
}

const grantedAll: Record<string, Record<string, string>> = {
  CrewUsers: { List: 'granted', Create: 'granted', Update: 'granted', Delete: 'granted' },
  CrewSeats: { List: 'granted', Create: 'conditional', Delete: 'granted' },
  CrewRoles: { List: 'granted' },
  CrewSectorUsers: { List: 'granted', Create: 'granted', Update: 'granted', Delete: 'granted' },
  CrewSectorSeats: { List: 'granted', Create: 'granted', Delete: 'granted' },
  CrewSectorRoles: { List: 'granted' },
  MembersUsers: { List: 'granted', Create: 'granted', Update: 'granted', Delete: 'granted' },
  MembersSeats: { List: 'granted', Create: 'granted', Delete: 'granted' },
  MembersRoles: { List: 'granted' },
  SetCrewUserPassword: { Execute: 'granted' },
  UnlinkCrewUserIdentity: { Execute: 'granted' },
  SetCrewSectorUserPassword: { Execute: 'granted' },
  UnlinkCrewSectorUserIdentity: { Execute: 'granted' },
  UnlinkMembersUserIdentity: { Execute: 'granted' },
};

function server(overrides: Partial<Server> = {}): Server {
  return { rows: rows(), roles: roleRows(), digest: grantedAll, answer: () => undefined, ...overrides };
}

function transportOf(state: Server): ScriptedTransport {
  return scriptedTransport((request: TransportRequest) => {
    const path = request.url.replace(/\?.*$/, '');
    const scripted = state.answer(request);
    if (scripted) {
      return scripted;
    }
    if (path.endsWith('permission-digest')) {
      return { status: 200, body: state.digest };
    }
    if (path.endsWith('user-domains')) {
      return { status: 200, body: [] };
    }
    if (request.method === 'GET' && /-users$/.test(path)) {
      return { status: 200, body: state.rows };
    }
    if (request.method === 'GET' && /-roles$/.test(path)) {
      return { status: 200, body: state.roles };
    }
    if (request.method === 'PATCH' && /-users$/.test(path)) {
      return { status: 200, body: { iDs: ['u-new'] } };
    }
    if (request.method === 'PATCH' && /-seats$/.test(path)) {
      return { status: 200, body: {} };
    }
    if (request.method === 'POST' && /^\/api\/(sectors\/[^/]+\/)?(set-|unlink-)/.test(path)) {
      return { status: 200, body: undefined };
    }
    return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
  });
}

interface Page {
  fixture: ComponentFixture<UserManagementComponent>;
  component: UserManagementComponent;
  transport: ScriptedTransport;
  element: HTMLElement;
  settle(): Promise<void>;
}

async function pageOver(
  state: Server,
  inputs: Record<string, unknown> = {},
  api: ApiDescriptor = descriptor,
): Promise<Page> {
  const transport = transportOf(state);
  await TestBed.configureTestingModule({
    imports: [UserManagementComponent],
    providers: [provideResourceTesting({ transport, client: (t) => createClient(api, { baseUrl: '/api', transport: t }) })],
  }).compileComponents();
  // The digest decides what the page may do; the application loads it at sign-in, and the tenant's when a tenant is selected.
  const client = TestBed.inject(RESOURCE_CLIENT);
  await client.permissions.loadDigest();
  if (typeof inputs['domain'] === 'string') {
    await client.permissions.loadDigest(inputs['domain'] as Domain);
  }
  transport.requests.length = 0;
  const fixture = TestBed.createComponent(UserManagementComponent);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
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

const sent = (transport: ScriptedTransport): string[] =>
  transport.requests.map((r) => `${r.method} ${decodeURIComponent(r.url)}`);
const textOf = (element: Element | null): string => element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const rowsOf = (page: Page): HTMLElement[] => Array.from(page.element.querySelectorAll<HTMLElement>('tr.ccc-user'));
const cell = (row: HTMLElement, name: string): string => textOf(row.querySelector(`.ccc-user-${name}`));
const buttons = (page: Page, selector: string): HTMLButtonElement[] =>
  Array.from(page.element.querySelectorAll<HTMLButtonElement>(selector));
const open = async (page: Page, username: string): Promise<HTMLElement> => {
  const row = page.component.rows().find((r) => r.username === username);
  if (!row) {
    throw new Error(`no row for ${username}`);
  }
  page.component.toggle(row);
  await page.settle();
  const details = page.element.querySelector<HTMLElement>('tr.ccc-user-details');
  if (!details) {
    throw new Error(`no details open for ${username}`);
  }
  return details;
};
/** The one PATCH the action sent: its route and its operations. */
const patchSent = (page: Page): { url: string; body: unknown } => {
  const patch = page.transport.requests.find((r) => r.method === 'PATCH');
  if (!patch) {
    throw new Error(`no PATCH among ${sent(page.transport).join(', ')}`);
  }
  return { url: patch.url, body: patch.body };
};

describe('UserManagementComponent reads the partition', () => {
  it("lists the first surface's global partition: each user with status, sign-in means, roles and last sign-in, read with the capability envelope, and the roles a seat may take", async () => {
    const page = await pageOver(server());
    expect(textOf(page.element.querySelector('.ccc-users-heading'))).toBe('Crew users');
    const requests = sent(page.transport);
    expect(requests[0]).toMatch(/^GET \/api\/crew-users\?/);
    expect(requests[0]).toContain('capabilities=Update,Delete,Execute');
    expect(requests[1]).toMatch(/^GET \/api\/crew-roles\?.*limit=all/);
    const table = rowsOf(page);
    expect(table.map((row) => cell(row, 'username'))).toEqual(['hollis', 'nova', 'pip']);
    expect(table.map((row) => cell(row, 'status'))).toEqual(['Active', 'Active · password change pending', 'Disabled']);
    expect(table.map((row) => cell(row, 'means'))).toEqual(['Password, Fleet directory', 'Password', 'Password']);
    expect(cell(table[0], 'roles')).toBe('Harbormaster, SectorCrew · from the directory');
    expect(cell(table[2], 'last')).toBe('Never');
    expect(cell(table[0], 'last')).not.toBe('Never');
    expect(page.component.roles().map((role) => role.name)).toEqual(['Harbormaster', 'Headquarters', 'SectorCrew']);
  });

  const selections: { name: string; inputs: Record<string, unknown>; api?: ApiDescriptor; wantHeading?: string; wantUnserved?: string; wantRoute?: string }[] = [
    { name: 'auth names the surface', inputs: { auth: 'Members' }, wantHeading: 'Members users', wantRoute: 'GET /api/members-users?' },
    { name: 'an Auth the descriptor does not carry', inputs: { auth: 'Kiosk' }, wantUnserved: 'This application has no Kiosk sign-in.' },
    {
      name: 'a domain binds the tenant partition under the domain segment',
      inputs: { domain: 'sector-7' },
      wantHeading: 'Crew users of sector-7',
      wantRoute: 'GET /api/sectors/sector-7/crew-sector-users?',
    },
    {
      name: 'a domain on a surface without a tenant partition',
      inputs: { auth: 'Members', domain: 'sector-7' },
      wantUnserved: 'The Members users are not partitioned by tenant.',
    },
    {
      name: 'a descriptor from a generator that predates the surfaces',
      inputs: {},
      api: withoutSurfaces,
      wantUnserved: 'This application serves no user management.',
    },
  ];
  for (const tt of selections) {
    it(tt.name, async () => {
      const page = await pageOver(server(), tt.inputs, tt.api);
      if (tt.wantUnserved) {
        expect(textOf(page.element.querySelector('.ccc-users-unserved'))).toBe(tt.wantUnserved);
        expect(sent(page.transport)).toEqual([]);
        expect(page.element.querySelector('table')).toBeNull();
        return;
      }
      expect(textOf(page.element.querySelector('.ccc-users-heading'))).toBe(tt.wantHeading);
      expect(sent(page.transport)[0].startsWith(tt.wantRoute ?? '')).toBe(true);
    });
  }

  it('a page with a next relation offers the turn, and the turn follows the relation as the server wrote it', async () => {
    const page = await pageOver(
      server({
        answer: (request) =>
          request.method === 'GET' && request.url.startsWith('/api/crew-users?') && !request.url.includes('cursor=')
            ? { status: 200, body: rows(), headers: { link: '</api/crew-users?cursor=after-pip&limit=50>; rel="next"' } }
            : undefined,
      }),
    );
    expect(buttons(page, '.ccc-users-next').map((b) => b.disabled)).toEqual([false]);
    expect(buttons(page, '.ccc-users-prev').map((b) => b.disabled)).toEqual([true]);
    page.transport.requests.length = 0;
    await page.component.next();
    await page.settle();
    expect(sent(page.transport)).toEqual(['GET /api/crew-users?cursor=after-pip&limit=50']);
    expect(page.element.querySelector('.ccc-users-paging')).toBeNull();
  });

  it('a refused list is shown in place, and a refused roles list leaves the picker empty', async () => {
    const page = await pageOver(
      server({
        answer: (request) =>
          request.method === 'GET' && /-(users|roles)\?/.test(request.url)
            ? { status: 403, body: { message: 'Headquarters required' } }
            : undefined,
      }),
    );
    expect(textOf(page.element.querySelector('.ccc-users-error'))).toBe('Headquarters required');
    expect(page.component.roles()).toEqual([]);
    expect(page.element.querySelector('table')).toBeNull();
  });
});

describe('UserManagementComponent creates a user', () => {
  it('the form takes a username, a temporary password where the Auth has a password method and the disabled flag, posts them and reads the page again', async () => {
    const page = await pageOver(server());
    page.component.toggleCreate();
    await page.settle();
    const fields = Array.from(page.element.querySelectorAll<HTMLInputElement>('.ccc-users-create input')).map((i) => i.name);
    expect(fields).toEqual(['username', 'password', 'disabled']);
    expect(page.element.querySelector('.ccc-users-create mat-select')).toBeNull();
    page.transport.requests.length = 0;
    page.component.newUser = { username: 'quill', password: 'anvil-run-9', disabled: true, role: '' };
    await page.component.create();
    await page.settle();
    const { url, body } = patchSent(page);
    expect(url).toBe('/api/crew-users');
    expect(body).toEqual([{ op: 'add', path: '/', value: { username: 'quill', password: 'anvil-run-9', disabled: true } }]);
    expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
    expect(page.component.creating()).toBe(false);
    expect(page.component.newUser.username).toBe('');
  });

  it('a surface without a password method asks for no password; the tenant partition asks for the role that seats the user', async () => {
    const members = await pageOver(server(), { auth: 'Members' });
    members.component.toggleCreate();
    await members.settle();
    expect(Array.from(members.element.querySelectorAll<HTMLInputElement>('.ccc-users-create input')).map((i) => i.name)).toEqual([
      'username',
      'disabled',
    ]);
    TestBed.resetTestingModule();
    const tenant = await pageOver(server(), { domain: 'sector-7' });
    tenant.component.toggleCreate();
    await tenant.settle();
    expect(tenant.element.querySelector('.ccc-users-create mat-select')).not.toBeNull();
    tenant.transport.requests.length = 0;
    tenant.component.newUser = { username: 'quill', password: '', disabled: false, role: 'SectorCrew' };
    await tenant.component.create();
    const { url, body } = patchSent(tenant);
    expect(url).toBe('/api/sectors/sector-7/crew-sector-users');
    expect(body).toEqual([{ op: 'add', path: '/', value: { username: 'quill', role: 'SectorCrew' } }]);
  });

  it('without Create on the users resource there is no new-user button', async () => {
    const digest = { ...grantedAll, CrewUsers: { List: 'granted', Update: 'granted', Delete: 'granted' } };
    const page = await pageOver(server({ digest }));
    expect(page.element.querySelector('.ccc-users-new')).toBeNull();
    expect(page.component.canCreate()).toBe(false);
  });
});

describe('UserManagementComponent acts on a row', () => {
  it("the controls follow the row's envelope: one's own row keeps the rename and the unlink alone, and a row the directory seats shows its roles read-only", async () => {
    const page = await pageOver(server());
    const hollis = await open(page, 'hollis');
    expect(hollis.querySelector('.ccc-user-unseat')).toBeNull();
    expect(hollis.querySelector('.ccc-user-seat-form')).toBeNull();
    expect(hollis.querySelector('.ccc-user-unlink')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-set-password')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-disable')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-delete')).not.toBeNull();
    const nova = await open(page, 'nova');
    expect(nova.querySelector('.ccc-user-rename')).not.toBeNull();
    expect(nova.querySelector('.ccc-user-disable')).toBeNull();
    expect(nova.querySelector('.ccc-user-delete')).toBeNull();
    expect(nova.querySelector('.ccc-user-set-password')).toBeNull();
    expect(nova.querySelector('.ccc-user-unseat')).not.toBeNull();
    expect(nova.querySelector('.ccc-user-seat-form')).not.toBeNull();
    expect(page.component.seatable(page.component.rows()[1]).map((role) => role.name)).toEqual(['Harbormaster', 'SectorCrew']);
  });

  const writes: {
    name: string;
    act: (page: Page, row: ManagedUser) => Promise<void>;
    want: { method: string; url: string; body: unknown };
  }[] = [
    {
      name: 'rename patches the username',
      act: (page, row) => {
        page.component.rename = 'pippa';
        return page.component.saveRename(row);
      },
      want: { method: 'PATCH', url: '/api/crew-users', body: [{ op: 'patch', path: '/u-pip', value: { username: 'pippa' } }] },
    },
    {
      name: 'enable patches the disabled flag',
      act: (page, row) => page.component.setDisabled(row, false),
      want: { method: 'PATCH', url: '/api/crew-users', body: [{ op: 'patch', path: '/u-pip', value: { disabled: false } }] },
    },
    {
      name: 'set password posts the temporary password to the method',
      act: (page, row) => {
        page.component.temporaryPassword = 'anvil-run-9';
        return page.component.setPassword(row);
      },
      want: { method: 'POST', url: '/api/set-crew-user-password', body: { user: 'u-pip', password: 'anvil-run-9' } },
    },
    {
      name: 'seat creates the seat',
      act: (page, row) => {
        page.component.seatRole = 'SectorCrew';
        return page.component.seat(row);
      },
      want: { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'add', path: '/u-pip/SectorCrew', value: {} }] },
    },
    {
      name: 'unseat removes the seat',
      act: (page, row) => page.component.unseat(row, 'Harbormaster'),
      want: { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'remove', path: '/u-pip/Harbormaster' }] },
    },
    {
      name: 'delete asks first, then removes the user',
      act: async (page, row) => {
        await page.component.remove(row);
        expect(page.component.confirmingDelete()).toBe('u-pip');
        expect(page.transport.requests).toEqual([]);
        await page.component.remove(row);
      },
      want: { method: 'PATCH', url: '/api/crew-users', body: [{ op: 'remove', path: '/u-pip' }] },
    },
  ];
  for (const tt of writes) {
    it(`${tt.name}, then reads the page again`, async () => {
      const page = await pageOver(server());
      const row = page.component.rows().find((r) => r.username === 'pip');
      if (!row) {
        throw new Error('no pip');
      }
      page.component.toggle(row);
      await page.settle();
      page.transport.requests.length = 0;
      await tt.act(page, row);
      await page.settle();
      const first = page.transport.requests[0];
      expect(`${first.method} ${first.url}`).toBe(`${tt.want.method} ${tt.want.url}`);
      expect(first.body).toEqual(tt.want.body);
      expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
      expect(page.component.notice()).toBeUndefined();
      expect(page.component.busy()).toBe(false);
    });
  }

  it('unlink posts the identity to the unlink method; a refusal is shown in place in the server\'s words and the page is read again', async () => {
    const state = server();
    const page = await pageOver(state);
    const hollis = page.component.rows()[0];
    page.component.toggle(hollis);
    await page.settle();
    page.transport.requests.length = 0;
    await page.component.unlink(hollis, hollis.identities[0]);
    await page.settle();
    const first = page.transport.requests[0];
    expect(`${first.method} ${first.url}`).toBe('POST /api/unlink-crew-user-identity');
    expect(first.body).toEqual({ user: 'u-hollis', identity: 'i-1' });
    expect(page.component.notice()).toBeUndefined();

    state.answer = (request) =>
      request.method === 'POST' ? { status: 409, body: { message: 'The last way to sign in stays linked' } } : undefined;
    page.transport.requests.length = 0;
    await page.component.unlink(hollis, hollis.identities[0]);
    await page.settle();
    expect(textOf(page.element.querySelector('.ccc-users-notice'))).toBe('The last way to sign in stays linked');
    expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
  });

  it('in the tenant partition every action goes under the domain segment', async () => {
    const page = await pageOver(server(), { domain: 'sector-7' });
    const pip = page.component.rows()[2];
    page.component.toggle(pip);
    await page.settle();
    page.transport.requests.length = 0;
    page.component.seatRole = 'SectorCrew';
    await page.component.seat(pip);
    page.component.temporaryPassword = 'anvil-run-9';
    await page.component.setPassword(pip);
    const urls = page.transport.requests.filter((r) => r.method !== 'GET').map((r) => `${r.method} ${r.url}`);
    expect(urls).toEqual(['PATCH /api/sectors/sector-7/crew-sector-seats', 'POST /api/sectors/sector-7/set-crew-sector-user-password']);
    expect(page.transport.requests[0].body).toEqual([{ op: 'add', path: '/u-pip/SectorCrew', value: {} }]);
  });

  it('the picker labels a domain-kind role as an every-tenant seat in the global partition, and plainly in the tenant one', async () => {
    const page = await pageOver(server());
    const pip = page.component.rows()[2];
    expect(page.component.seatable(pip).map((role) => page.component.roleLabel(role))).toEqual([
      'Harbormaster (every tenant)',
      'Headquarters',
      'SectorCrew (every tenant)',
    ]);
    TestBed.resetTestingModule();
    const tenant = await pageOver(server({ roles: [{ name: 'Harbormaster' }, { name: 'SectorCrew' }] }), { domain: 'sector-7' });
    expect(tenant.component.seatable(tenant.component.rows()[2]).map((role) => tenant.component.roleLabel(role))).toEqual([
      'Harbormaster',
      'SectorCrew',
    ]);
  });

  it('a row with nothing to do for the caller has no manage button', async () => {
    const state = server();
    state.rows = [user({ id: 'u-quill', username: 'quill', [CapabilitiesProperty]: { Update: [], Delete: false, Execute: [] } })];
    state.digest = { ...grantedAll, CrewSeats: { List: 'granted' } };
    const page = await pageOver(state);
    expect(buttons(page, '.ccc-user-toggle')).toEqual([]);
  });
});
