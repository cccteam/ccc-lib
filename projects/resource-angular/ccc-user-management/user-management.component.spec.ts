import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
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

import {
  assignedByDirectory,
  assignedForEveryTenant,
  cannotChangeRole,
  ManagedInvitation,
  ManagedUser,
  UserManagementComponent,
} from './user-management.component';

// The component configures itself from the descriptor's userSurfaces block: the surface
// `auth` names (the first by default) and the partition `domain` selects, reading the
// users with their capability envelope, the roles a seat may take and the invitations
// standing into the partition. The table lists each user's roles by title with where they
// reach; a pencil opens the access panel, whose Save applies the difference between its
// rows and the user's seats; a menu button opens the account panel with the rest. Every
// control follows a capability, the digest's or the row's; each action goes to the
// partition's route with the body the surface takes, a refusal is shown in place, and the
// lists are read again after every write.

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

/** Crew: a password method and a role-syncing Google registration, with a tenant partition and invitations; Members: an invited directory alone, global only, no invitations; Kiosk: a password method whose username is the address. */
const descriptor = {
  domainRoute: sectors,
  permissionDigestRoute: 'permission-digest',
  userDomainsRoute: 'user-domains',
  features: { route: 'features' },
  resources: {
    CrewUsers: resourceEntry('CrewUsers', 'crew-users', 'global', ['id'], userOps, ['username', 'disabled']),
    CrewSeats: resourceEntry('CrewSeats', 'crew-seats', 'global', ['user', 'role'], seatOps),
    CrewRoles: resourceEntry('CrewRoles', 'crew-roles', 'global', ['name'], readOps),
    CrewSectorUsers: resourceEntry('CrewSectorUsers', 'crew-sector-users', 'domain', ['id'], userOps, [
      'username',
      'disabled',
    ]),
    CrewSectorSeats: resourceEntry('CrewSectorSeats', 'crew-sector-seats', 'domain', ['user', 'role'], seatOps),
    CrewSectorRoles: resourceEntry('CrewSectorRoles', 'crew-sector-roles', 'domain', ['name'], readOps),
    CrewInvitations: resourceEntry('CrewInvitations', 'crew-invitations', 'global', ['id'], seatOps),
    CrewSectorInvitations: resourceEntry('CrewSectorInvitations', 'crew-sector-invitations', 'domain', ['id'], seatOps),
    KioskUsers: resourceEntry('KioskUsers', 'kiosk-users', 'global', ['id'], userOps, ['disabled']),
    KioskSeats: resourceEntry('KioskSeats', 'kiosk-seats', 'global', ['user', 'role'], seatOps),
    KioskRoles: resourceEntry('KioskRoles', 'kiosk-roles', 'global', ['name'], readOps),
    MembersUsers: resourceEntry('MembersUsers', 'members-users', 'global', ['id'], userOps, ['username', 'disabled']),
    MembersSeats: resourceEntry('MembersSeats', 'members-seats', 'global', ['user', 'role'], seatOps),
    MembersRoles: resourceEntry('MembersRoles', 'members-roles', 'global', ['name'], readOps),
  },
  methods: {
    SetCrewUserPassword: methodEntry('SetCrewUserPassword', 'set-crew-user-password', 'global'),
    UnlinkCrewUserIdentity: methodEntry('UnlinkCrewUserIdentity', 'unlink-crew-user-identity', 'global'),
    SetCrewSectorUserPassword: methodEntry('SetCrewSectorUserPassword', 'set-crew-sector-user-password', 'domain'),
    UnlinkCrewSectorUserIdentity: methodEntry(
      'UnlinkCrewSectorUserIdentity',
      'unlink-crew-sector-user-identity',
      'domain',
    ),
    UnlinkMembersUserIdentity: methodEntry('UnlinkMembersUserIdentity', 'unlink-members-user-identity', 'global'),
    SetKioskUserPassword: methodEntry('SetKioskUserPassword', 'set-kiosk-user-password', 'global'),
  },
  userSurfaces: [
    {
      auth: 'Crew',
      label: 'Crew',
      password: true,
      usernameIsEmail: false,
      openSignUp: false,
      registrations: [{ name: 'google', kind: 'google', label: 'Fleet directory', invited: false, syncsRoles: true }],
      partitions: [
        {
          scope: 'global',
          users: 'CrewUsers',
          seats: 'CrewSeats',
          roles: 'CrewRoles',
          invitations: 'CrewInvitations',
          setPassword: 'SetCrewUserPassword',
          unlinkIdentity: 'UnlinkCrewUserIdentity',
        },
        {
          scope: 'domain',
          users: 'CrewSectorUsers',
          seats: 'CrewSectorSeats',
          roles: 'CrewSectorRoles',
          invitations: 'CrewSectorInvitations',
          setPassword: 'SetCrewSectorUserPassword',
          unlinkIdentity: 'UnlinkCrewSectorUserIdentity',
        },
      ],
    },
    {
      auth: 'Kiosk',
      label: 'Kiosk',
      password: true,
      usernameIsEmail: true,
      openSignUp: true,
      registrations: [],
      partitions: [
        {
          scope: 'global',
          users: 'KioskUsers',
          seats: 'KioskSeats',
          roles: 'KioskRoles',
          setPassword: 'SetKioskUserPassword',
        },
      ],
    },
    {
      auth: 'Members',
      label: 'Members',
      password: false,
      registrations: [
        { name: 'directory', kind: 'azure', label: 'Company directory', invited: true, syncsRoles: false },
      ],
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

const everything = {
  Update: ['username', 'disabled', 'email'],
  Delete: true,
  Execute: ['SetCrewUserPassword', 'UnlinkCrewUserIdentity'],
};

function user(overrides: Partial<ManagedUser> & { id: string; username: string }): ManagedUser {
  return {
    disabled: false,
    hasPassword: true,
    passwordChangeRequired: false,
    createdAt: '2026-10-01T09:00:00Z',
    lastSignInAt: '2026-10-18T07:30:00Z',
    organization: null,
    email: null,
    emailVerifiedAt: null,
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
    email: 'hollis@fleet.example',
    emailVerifiedAt: '2026-10-02T09:00:00Z',
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
  user({ id: 'u-pip', username: 'pip', lastSignInAt: null, disabled: true, email: 'pip@fleet.example' }),
];

/** Two invitations stand: one the caller may revoke (nova sent it), one not, whose sender is unknown. */
const invitationRows = (): ManagedInvitation[] => [
  {
    id: 'inv-1',
    email: 'cass@fleet.example',
    roles: ['Harbormaster'],
    invitedBy: 'nova',
    createdAt: '2026-10-20T09:00:00Z',
    expiresAt: '2026-10-27T09:00:00Z',
    [CapabilitiesProperty]: { Delete: true },
  },
  {
    id: 'inv-2',
    email: 'quill@fleet.example',
    roles: ['SectorCrew', 'Harbormaster'],
    invitedBy: null,
    createdAt: '2026-10-21T09:00:00Z',
    expiresAt: '2026-10-28T09:00:00Z',
    [CapabilitiesProperty]: { Delete: false },
  },
];

/** The roles with their kinds and descriptions; SectorCrew comes from a role file that gives it none. */
const roleRows = (): RoleRow[] => [
  { name: 'Harbormaster', kind: 'domain', description: 'Runs a sector: its berths and its manifests.' },
  { name: 'Headquarters', kind: 'global', description: 'Runs the whole fleet.' },
  { name: 'SectorCrew', kind: 'domain' },
];

interface Server {
  rows: ManagedUser[];
  roles: RoleRow[];
  invitations: ManagedInvitation[];
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
  CrewInvitations: { List: 'granted', Create: 'granted', Delete: 'granted' },
  CrewSectorInvitations: { List: 'granted', Create: 'conditional', Delete: 'granted' },
  KioskUsers: { List: 'granted', Create: 'granted', Update: 'granted', Delete: 'granted' },
  KioskSeats: { List: 'granted', Create: 'granted', Delete: 'granted' },
  KioskRoles: { List: 'granted' },
  SetKioskUserPassword: { Execute: 'granted' },
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
  return {
    rows: rows(),
    roles: roleRows(),
    invitations: invitationRows(),
    digest: grantedAll,
    answer: () => undefined,
    ...overrides,
  };
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
    if (request.method === 'GET' && /-invitations$/.test(path)) {
      return { status: 200, body: state.invitations };
    }
    if (request.method === 'PATCH' && /-users$/.test(path)) {
      return { status: 200, body: { ids: ['u-new'] } };
    }
    if (request.method === 'PATCH' && /-(seats|invitations)$/.test(path)) {
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
    providers: [
      provideResourceTesting({ transport, client: (t) => createClient(api, { baseUrl: '/api', transport: t }) }),
      provideNoopAnimations(),
    ],
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
    // The side panel renders in the overlay, outside the fixture, and closes on a microtask: a tick each side of the wait.
    settle: async () => {
      for (let i = 0; i < 2; i++) {
        TestBed.tick();
        await TestBed.inject(ApplicationRef).whenStable();
        await new Promise((resolve) => setTimeout(resolve, 0));
        TestBed.tick();
      }
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
/** The roles cell as lines of [title, where it reaches]. */
const roleLines = (row: HTMLElement): string[][] =>
  Array.from(row.querySelectorAll('.ccc-user-role')).map((line) => [
    textOf(line.querySelector('.ccc-user-role-title')),
    textOf(line.querySelector('.ccc-user-role-kind')),
  ]);
const buttons = (page: Page, selector: string): HTMLButtonElement[] =>
  Array.from(page.element.querySelectorAll<HTMLButtonElement>(selector));
const rowOf = (page: Page, username: string): ManagedUser => {
  const row = page.component.rows().find((r) => r.username === username);
  if (!row) {
    throw new Error(`no row for ${username}`);
  }
  return row;
};
/** The open side panel, in the overlay. */
const panelOf = (): HTMLElement => {
  const panel = document.body.querySelector<HTMLElement>('.ccc-users-panel .ccc-panel');
  if (!panel) {
    throw new Error('no panel open');
  }
  return panel;
};
const panelOpen = (): boolean => document.body.querySelector('.ccc-users-panel .ccc-panel') !== null;
const click = async (page: Page, element: Element | null): Promise<void> => {
  if (!(element instanceof HTMLElement)) {
    throw new Error('nothing to click');
  }
  element.click();
  await page.settle();
};
/** Opens a row's access panel by its pencil. */
const openAccess = async (page: Page, username: string): Promise<HTMLElement> => {
  await click(page, page.element.querySelector(`button[aria-label="Edit access for ${username}"]`));
  return panelOf();
};
/** Opens a row's account panel by its menu button. */
const openAccount = async (page: Page, username: string): Promise<HTMLElement> => {
  await click(page, page.element.querySelector(`button[aria-label="Manage ${username}"]`));
  return panelOf();
};
/** The roles rows of the open panel: the picker's text, the words under it, and whether it can be changed. */
const roleRowsOf = (panel: HTMLElement): { text: string; words: string; disabled: boolean; removable: boolean }[] =>
  Array.from(panel.querySelectorAll<HTMLElement>('.ccc-role-row')).map((row) => {
    const input = row.querySelector<HTMLInputElement>('input');
    return {
      text: input?.value ?? '',
      words: textOf(row.querySelector('.ccc-role-row-words')),
      disabled: input?.disabled ?? true,
      removable: row.querySelector('.ccc-role-remove') !== null,
    };
  });
const pickerInputs = (panel: HTMLElement): HTMLInputElement[] =>
  Array.from(panel.querySelectorAll<HTMLInputElement>('.ccc-role-row input'));
/** Types into a picker the way a person does: the input event the picker and the model listen to. */
const typeInto = async (page: Page, input: HTMLInputElement, text: string): Promise<void> => {
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await page.settle();
};
/** The options the picker of an input shows, each as its title, where it reaches and its description; none while its list is closed. */
const optionsShown = (input: HTMLInputElement): string[][] => {
  const id = input.getAttribute('aria-controls');
  const list = id === null ? null : document.getElementById(id);
  return Array.from(list?.querySelectorAll<HTMLElement>('.ccc-role-option') ?? []).map((option) => [
    textOf(option.querySelector('.ccc-role-option-title')),
    textOf(option.querySelector('.ccc-role-option-kind')),
    textOf(option.querySelector('.ccc-role-option-description')),
  ]);
};
/** How each option of the picker lays out its three lines: the computed display of the title, the kind and the description. */
const optionLinesShown = (input: HTMLInputElement): string[][] => {
  const id = input.getAttribute('aria-controls');
  const list = id === null ? null : document.getElementById(id);
  return Array.from(list?.querySelectorAll<HTMLElement>('.ccc-role-option') ?? []).map((option) =>
    ['title', 'kind', 'description'].map((part) => {
      const span = option.querySelector<HTMLElement>(`.ccc-role-option-${part}`);
      return span ? getComputedStyle(span).display : '';
    }),
  );
};
/** The one PATCH the action sent: its route and its operations. */
const patchSent = (page: Page): { url: string; body: unknown } => {
  const patch = page.transport.requests.find((r) => r.method === 'PATCH');
  if (!patch) {
    throw new Error(`no PATCH among ${sent(page.transport).join(', ')}`);
  }
  return { url: patch.url, body: patch.body };
};
/** The writes sent, each as its method, route and operations. */
const writesSent = (page: Page): { method: string; url: string; body: unknown }[] =>
  page.transport.requests
    .filter((r) => r.method !== 'GET')
    .map((r) => ({ method: r.method, url: r.url, body: r.body }));

describe('UserManagementComponent reads the partition', () => {
  it("lists the first surface's global partition: each user with address, status, sign-in means, roles by title with where they reach, and last sign-in, read with the capability envelope, the roles a seat may take, and the invitations with theirs", async () => {
    const page = await pageOver(server());
    expect(textOf(page.element.querySelector('.ccc-users-heading'))).toBe('Crew users');
    const requests = sent(page.transport);
    expect(requests[0]).toMatch(/^GET \/api\/crew-users\?/);
    expect(requests[0]).toContain('capabilities=Update,Delete,Execute');
    expect(requests[1]).toMatch(/^GET \/api\/crew-roles\?.*limit=all/);
    expect(requests[2]).toMatch(/^GET \/api\/crew-invitations\?.*capabilities=Delete/);
    expect(requests[2]).toContain('limit=all');
    const table = rowsOf(page);
    expect(table.map((row) => cell(row, 'username'))).toEqual(['hollis', 'nova', 'pip']);
    expect(table.map((row) => cell(row, 'email'))).toEqual([
      'hollis@fleet.example',
      'None',
      'pip@fleet.example · unconfirmed',
    ]);
    expect(table.map((row) => cell(row, 'status'))).toEqual(['Active', 'Active · password change pending', 'Disabled']);
    expect(table.map((row) => cell(row, 'means'))).toEqual(['Password, Fleet directory', 'Password', 'Password']);
    expect(roleLines(table[0])).toEqual([
      ['Harbormaster', 'Every tenant'],
      ['Sector Crew', 'Every tenant'],
    ]);
    expect(textOf(table[0].querySelector('.ccc-user-synced'))).toBe('From the directory');
    expect(roleLines(table[1])).toEqual([['Headquarters', 'Everywhere']]);
    expect(table[1].querySelector('.ccc-user-synced')).toBeNull();
    expect(cell(table[2], 'roles')).toBe('No roles');
    expect(cell(table[2], 'last')).toBe('Never');
    expect(cell(table[0], 'last')).not.toBe('Never');
    expect(page.component.roles().map((role) => role.name)).toEqual(['Harbormaster', 'Headquarters', 'SectorCrew']);
    expect(buttons(page, '.ccc-user-edit-access').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Edit access for hollis',
      'Edit access for nova',
      'Edit access for pip',
    ]);
    expect(buttons(page, '.ccc-user-manage-account').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Manage hollis',
      'Manage nova',
      'Manage pip',
    ]);
  });

  const selections: {
    name: string;
    inputs: Record<string, unknown>;
    api?: ApiDescriptor;
    wantHeading?: string;
    wantUnserved?: string;
    wantRoute?: string;
  }[] = [
    {
      name: 'auth names the surface',
      inputs: { auth: 'Members' },
      wantHeading: 'Members users',
      wantRoute: 'GET /api/members-users?',
    },
    {
      name: 'an Auth the descriptor does not carry',
      inputs: { auth: 'Vendors' },
      wantUnserved: 'This application has no Vendors sign-in.',
    },
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

  const reaches: { name: string; inputs: Record<string, unknown>; row: ManagedUser; want: string[][] }[] = [
    {
      name: "the tenant partition names the tenant under its own seats and says 'Every tenant' under an everywhere seat",
      inputs: { domain: 'sector-7' },
      row: user({ id: 'u-ash', username: 'ash', roles: ['SectorCrew'], everywhereRoles: ['Harbormaster'] }),
      want: [
        ['Sector Crew', 'sector-7'],
        ['Harbormaster', 'Every tenant'],
      ],
    },
    {
      name: "the global page lists a seat held in every tenant as 'Every tenant' after the global seats, once where the global list names it too",
      inputs: {},
      row: user({
        id: 'u-ash',
        username: 'ash',
        roles: ['Headquarters', 'Harbormaster'],
        everywhereRoles: ['Harbormaster', 'Archivist'],
      }),
      want: [
        ['Headquarters', 'Everywhere'],
        ['Harbormaster', 'Every tenant'],
        ['Archivist', 'Every tenant'],
      ],
    },
    {
      name: 'an application without tenants says nothing about where a role reaches',
      inputs: { auth: 'Members' },
      row: user({ id: 'u-ash', username: 'ash', roles: ['Headquarters', 'Harbormaster'] }),
      want: [
        ['Headquarters', ''],
        ['Harbormaster', ''],
      ],
    },
    {
      name: 'a role the roles list does not carry shows its title alone',
      inputs: {},
      row: user({ id: 'u-ash', username: 'ash', roles: ['DockMaster'] }),
      want: [['Dock Master', '']],
    },
  ];
  for (const tt of reaches) {
    it(tt.name, async () => {
      const page = await pageOver(server({ rows: [tt.row] }), tt.inputs);
      expect(roleLines(rowsOf(page)[0])).toEqual(tt.want);
    });
  }

  it('a page with a next relation offers the turn, and the turn follows the relation as the server wrote it', async () => {
    const page = await pageOver(
      server({
        answer: (request) =>
          request.method === 'GET' && request.url.startsWith('/api/crew-users?') && !request.url.includes('cursor=')
            ? {
                status: 200,
                body: rows(),
                headers: { link: '</api/crew-users?cursor=after-pip&limit=50>; rel="next"' },
              }
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
    expect(page.element.querySelector('tr.ccc-user')).toBeNull();
  });
});

describe('UserManagementComponent creates a user', () => {
  it('the new-user panel takes a username, an address, a temporary password where the Auth has a password method, the disabled flag and the roles, posts the account and reads the page again', async () => {
    const page = await pageOver(server());
    await click(page, page.element.querySelector('.ccc-users-new'));
    const panel = panelOf();
    expect(textOf(panel.querySelector('.ccc-panel-heading'))).toBe('New user');
    const fields = Array.from(panel.querySelectorAll<HTMLInputElement>('.ccc-users-create input')).map((i) => i.name);
    expect(fields.slice(0, 4)).toEqual(['username', 'email', 'password', 'disabled']);
    expect(fields[4]).toMatch(/^new-role-\d+$/);
    expect(textOf(panel.querySelector('mat-checkbox'))).toBe('The account starts disabled');
    expect(textOf(panel.querySelector('.ccc-role-add'))).toBe('Add another role');
    page.transport.requests.length = 0;
    page.component.newUser = {
      username: 'quill',
      password: 'anvil-run-9',
      disabled: true,
      email: 'quill@fleet.example',
    };
    await page.component.create();
    await page.settle();
    expect(writesSent(page)).toEqual([
      {
        method: 'PATCH',
        url: '/api/crew-users',
        body: [
          {
            op: 'add',
            path: '/',
            value: { username: 'quill', password: 'anvil-run-9', disabled: true, email: 'quill@fleet.example' },
          },
        ],
      },
    ]);
    expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
    expect(panelOpen()).toBe(false);
    expect(page.component.panel()).toBeUndefined();
    expect(page.component.newUser.username).toBe('');
  });

  it('the roles chosen for a new user are seated once the server has said the new id, one seat per role, in the global partition too', async () => {
    const page = await pageOver(server());
    page.component.openNew();
    await page.settle();
    const [first] = page.component.newRoles();
    page.component.typed(first, 'Headquarters', page.component.newRoles());
    page.component.addRole(page.component.newRoles);
    page.component.typed(page.component.newRoles()[1], 'Harbormaster', page.component.newRoles());
    page.transport.requests.length = 0;
    page.component.newUser = { username: 'quill', password: '', disabled: false, email: '' };
    await page.component.create();
    await page.settle();
    expect(writesSent(page)).toEqual([
      { method: 'PATCH', url: '/api/crew-users', body: [{ op: 'add', path: '/', value: { username: 'quill' } }] },
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'add', path: '/u-new/Headquarters', value: {} }] },
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'add', path: '/u-new/Harbormaster', value: {} }] },
    ]);
    expect(page.component.notice()).toBeUndefined();
    expect(panelOpen()).toBe(false);
  });

  it('a seat the server refuses after the create leaves the user created, says which role could not be assigned, and keeps the panel open', async () => {
    const state = server();
    const page = await pageOver(state);
    page.component.openNew();
    await page.settle();
    page.component.typed(page.component.newRoles()[0], 'Harbormaster', page.component.newRoles());
    state.answer = (request) =>
      request.method === 'PATCH' && request.url.endsWith('crew-seats')
        ? { status: 403, body: { message: 'Harbormaster required' } }
        : undefined;
    page.transport.requests.length = 0;
    page.component.newUser = { username: 'quill', password: '', disabled: false, email: '' };
    await page.component.create();
    await page.settle();
    expect(writesSent(page).map((w) => w.url)).toEqual(['/api/crew-users', '/api/crew-seats']);
    expect(page.component.notice()).toBe(
      'quill was created, but the Harbormaster role could not be assigned: Harbormaster required',
    );
    expect(textOf(panelOf().querySelector('.ccc-panel-notice'))).toBe(
      'quill was created, but the Harbormaster role could not be assigned: Harbormaster required',
    );
    expect(sent(page.transport)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
  });

  it('a surface without a password method asks for no password; the tenant partition requires the role that seats the user, which rides the create, and seats any further role under the tenant', async () => {
    const members = await pageOver(server(), { auth: 'Members' });
    members.component.openNew();
    await members.settle();
    expect(
      Array.from(panelOf().querySelectorAll<HTMLInputElement>('.ccc-users-create input'))
        .map((i) => i.name)
        .filter((name) => !name.startsWith('new-role-')),
    ).toEqual(['username', 'email', 'disabled']);
    TestBed.resetTestingModule();
    const tenant = await pageOver(server(), { domain: 'sector-7' });
    tenant.component.openNew();
    await tenant.settle();
    expect(pickerInputs(panelOf()).map((input) => input.required)).toEqual([true]);
    tenant.transport.requests.length = 0;
    tenant.component.newUser = { username: 'quill', password: '', disabled: false, email: '' };
    await tenant.component.create();
    await tenant.settle();
    expect(tenant.component.notice()).toBe('Choose a role for the new user.');
    expect(tenant.transport.requests).toEqual([]);
    tenant.component.typed(tenant.component.newRoles()[0], 'Sector Crew', tenant.component.newRoles());
    tenant.component.addRole(tenant.component.newRoles);
    tenant.component.typed(tenant.component.newRoles()[1], 'Harbormaster', tenant.component.newRoles());
    await tenant.component.create();
    await tenant.settle();
    expect(writesSent(tenant)).toEqual([
      {
        method: 'PATCH',
        url: '/api/sectors/sector-7/crew-sector-users',
        body: [{ op: 'add', path: '/', value: { username: 'quill', role: 'SectorCrew' } }],
      },
      {
        method: 'PATCH',
        url: '/api/sectors/sector-7/crew-sector-seats',
        body: [{ op: 'add', path: '/u-new/Harbormaster', value: {} }],
      },
    ]);
  });

  it('without Create on the users resource there is no new-user button', async () => {
    const digest = { ...grantedAll, CrewUsers: { List: 'granted', Update: 'granted', Delete: 'granted' } };
    const page = await pageOver(server({ digest }));
    expect(page.element.querySelector('.ccc-users-new')).toBeNull();
    expect(page.component.canCreate()).toBe(false);
  });

  it('where the username is the address, the panel asks for the address as the username and for no address apart, and the table has no address column', async () => {
    const page = await pageOver(
      server({ rows: [user({ id: 'u-kay', username: 'kay@fleet.example', email: 'kay@fleet.example' })] }),
      {
        auth: 'Kiosk',
      },
    );
    expect(Array.from(page.element.querySelectorAll('th')).map((th) => textOf(th))).toEqual([
      'Email address',
      'Status',
      'Signs in with',
      'Roles',
      'Last sign-in',
      'Manage',
    ]);
    expect(cell(rowsOf(page)[0], 'username')).toBe('kay@fleet.example · unconfirmed');
    expect(rowsOf(page)[0].querySelector('.ccc-user-email')).toBeNull();
    page.component.openNew();
    await page.settle();
    const inputs = Array.from(panelOf().querySelectorAll<HTMLInputElement>('.ccc-users-create input')).filter(
      (i) => !i.name.startsWith('new-role-'),
    );
    expect(inputs.map((i) => i.name)).toEqual(['username', 'password', 'disabled']);
    expect(inputs[0].type).toBe('email');
    expect(textOf(panelOf().querySelector('.ccc-users-create mat-label'))).toBe('Email address');
    page.transport.requests.length = 0;
    page.component.newUser = {
      username: 'lee@fleet.example',
      password: '',
      disabled: false,
      email: 'ignored@fleet.example',
    };
    await page.component.create();
    expect(patchSent(page).body).toEqual([{ op: 'add', path: '/', value: { username: 'lee@fleet.example' } }]);
  });
});

describe('UserManagementComponent edits access', () => {
  it('the pencil opens the access panel with one row per seat: the title in the picker, where it reaches and the description under it, a remove button, and a button for another role', async () => {
    const page = await pageOver(server());
    const panel = await openAccess(page, 'nova');
    expect(textOf(panel.querySelector('.ccc-panel-heading'))).toBe('Edit access for nova');
    expect(textOf(panel.querySelector('.ccc-panel-subheading'))).toBe('Assign roles');
    expect(roleRowsOf(panel)).toEqual([
      { text: 'Headquarters', words: 'Everywhere · Runs the whole fleet.', disabled: false, removable: true },
    ]);
    expect(textOf(panel.querySelector('.ccc-role-add'))).toBe('Add another role');
    expect(textOf(panel.querySelector('.ccc-access-save'))).toBe('Save');
    expect(textOf(panel.querySelector('.ccc-panel-cancel'))).toBe('Cancel');
    expect(rowsOf(page)[1].classList.contains('ccc-user-open')).toBe(true);
  });

  it('Save applies the difference between the rows and the seats, unseats first, then seats, one call per change in order, reads the page again and closes the panel', async () => {
    const page = await pageOver(server());
    const panel = await openAccess(page, 'nova');
    await click(page, panel.querySelector('.ccc-role-remove'));
    await click(page, panel.querySelector('.ccc-role-add'));
    await click(page, panel.querySelector('.ccc-role-add'));
    const [first, second] = pickerInputs(panelOf());
    await typeInto(page, first, 'Harbormaster');
    await typeInto(page, second, 'Sector Crew');
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-access-save'));
    expect(writesSent(page)).toEqual([
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'remove', path: '/u-nova/Headquarters' }] },
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'add', path: '/u-nova/Harbormaster', value: {} }] },
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'add', path: '/u-nova/SectorCrew', value: {} }] },
    ]);
    expect(sent(page.transport).slice(3)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
    expect(page.component.notice()).toBeUndefined();
    expect(panelOpen()).toBe(false);
    expect(page.component.busy()).toBe(false);
  });

  it('a call that fails stops the rest, says which role and what the server said, reads the page again and rebuilds the rows from what the server lists', async () => {
    const state = server();
    const page = await pageOver(state);
    const panel = await openAccess(page, 'nova');
    await click(page, panel.querySelector('.ccc-role-remove'));
    await click(page, panel.querySelector('.ccc-role-add'));
    await click(page, panel.querySelector('.ccc-role-add'));
    const [first, second] = pickerInputs(panelOf());
    await typeInto(page, first, 'Harbormaster');
    await typeInto(page, second, 'Sector Crew');
    state.answer = (request) =>
      request.method === 'PATCH' &&
      request.url.endsWith('crew-seats') &&
      JSON.stringify(request.body).includes('Harbormaster')
        ? { status: 403, body: { message: 'Harbormaster required' } }
        : undefined;
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-access-save'));
    expect(writesSent(page).map((w) => `${w.url} ${JSON.stringify(w.body)}`)).toEqual([
      '/api/crew-seats [{"op":"remove","path":"/u-nova/Headquarters"}]',
      '/api/crew-seats [{"op":"add","path":"/u-nova/Harbormaster","value":{}}]',
    ]);
    expect(sent(page.transport).slice(2)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
    expect(page.component.notice()).toBe('Could not add the Harbormaster role to nova: Harbormaster required');
    expect(textOf(panelOf().querySelector('.ccc-panel-notice'))).toBe(
      'Could not add the Harbormaster role to nova: Harbormaster required',
    );
    expect(roleRowsOf(panelOf()).map((row) => row.text)).toEqual(['Headquarters']);
    expect(page.component.busy()).toBe(false);
  });

  it('Cancel discards the rows without a request, and a Save with nothing changed sends none', async () => {
    const page = await pageOver(server());
    const panel = await openAccess(page, 'nova');
    await click(page, panel.querySelector('.ccc-role-remove'));
    expect(roleRowsOf(panelOf())).toEqual([]);
    expect(textOf(panelOf().querySelector('.ccc-access-none'))).toBe('nova has no roles here.');
    expect(textOf(panelOf().querySelector('.ccc-role-add'))).toBe('Add a role');
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-panel-cancel'));
    expect(panelOpen()).toBe(false);
    expect(page.transport.requests).toEqual([]);
    const again = await openAccess(page, 'nova');
    expect(roleRowsOf(again).map((row) => row.text)).toEqual(['Headquarters']);
    await click(page, again.querySelector('.ccc-access-save'));
    expect(panelOpen()).toBe(false);
    expect(page.transport.requests).toEqual([]);
  });

  it('the picker narrows the roles by what is typed, over the title, the name and the description, leaves out the roles other rows hold, and shows each option with its title, where it reaches and its description', async () => {
    const page = await pageOver(server());
    const panel = await openAccess(page, 'nova');
    await click(page, panel.querySelector('.ccc-role-add'));
    const [, picker] = pickerInputs(panelOf());
    const [, row] = page.component.accessRows();
    const rows = page.component.accessRows();
    const names = () => page.component.optionsFor(row, rows).map((role) => role.name);
    expect(names()).toEqual(['Harbormaster', 'SectorCrew']);
    await typeInto(page, picker, 'harbor');
    expect(names()).toEqual(['Harbormaster']);
    expect(optionsShown(picker)).toEqual([
      ['Harbormaster', 'Every tenant', 'Runs a sector: its berths and its manifests.'],
    ]);
    expect(optionLinesShown(picker)).toEqual([['block', 'block', 'block']]);
    await typeInto(page, picker, 'berths');
    expect(names()).toEqual(['Harbormaster']);
    await typeInto(page, picker, 'sector');
    expect(names()).toEqual(['Harbormaster', 'SectorCrew']);
    expect(optionsShown(picker)).toEqual([
      ['Harbormaster', 'Every tenant', 'Runs a sector: its berths and its manifests.'],
      ['Sector Crew', 'Every tenant', ''],
    ]);
    await typeInto(page, picker, 'sector crew');
    expect(row.role).toBe('SectorCrew');
    expect(textOf(panelOf().querySelectorAll('.ccc-role-row-words')[1])).toBe('Every tenant');
    await typeInto(page, picker, 'nobody');
    expect(row.role).toBe('');
    expect(names()).toEqual([]);
  });

  it('choosing an option sets the row to the role and shows its title in the picker', async () => {
    const page = await pageOver(server());
    const panel = await openAccess(page, 'pip');
    await click(page, panel.querySelector('.ccc-role-add'));
    const [picker] = pickerInputs(panelOf());
    await typeInto(page, picker, 'crew');
    expect(optionsShown(picker)).toEqual([['Sector Crew', 'Every tenant', '']]);
    const option =
      document
        .getElementById(picker.getAttribute('aria-controls') ?? '')
        ?.querySelector<HTMLElement>('.ccc-role-option') ?? null;
    await click(page, option);
    expect(page.component.accessRows()[0].role).toBe('SectorCrew');
    expect(pickerInputs(panelOf())[0].value).toBe('Sector Crew');
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-access-save'));
    expect(writesSent(page)).toEqual([
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'add', path: '/u-pip/SectorCrew', value: {} }] },
    ]);
  });

  it('on the global page a seat held in every tenant is a row like the others: listed, not offered again, and removed through the global seats resource on Save', async () => {
    const page = await pageOver(
      server({
        rows: [user({ id: 'u-ash', username: 'ash', roles: ['Headquarters'], everywhereRoles: ['Harbormaster'] })],
      }),
    );
    expect(roleLines(rowsOf(page)[0])).toEqual([
      ['Headquarters', 'Everywhere'],
      ['Harbormaster', 'Every tenant'],
    ]);
    const panel = await openAccess(page, 'ash');
    expect(roleRowsOf(panel)).toEqual([
      { text: 'Headquarters', words: 'Everywhere · Runs the whole fleet.', disabled: false, removable: true },
      {
        text: 'Harbormaster',
        words: 'Every tenant · Runs a sector: its berths and its manifests.',
        disabled: false,
        removable: true,
      },
    ]);
    expect(page.component.seatable(rowOf(page, 'ash')).map((role) => role.name)).toEqual(['SectorCrew']);
    await click(page, panel.querySelector('.ccc-role-add'));
    const [, , added] = page.component.accessRows();
    expect(page.component.optionsFor(added, page.component.accessRows()).map((role) => role.name)).toEqual([
      'SectorCrew',
    ]);
    await click(page, panelOf().querySelectorAll('.ccc-role-remove')[1]);
    expect(roleRowsOf(panelOf()).map((row) => row.text)).toEqual(['Headquarters', '']);
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-access-save'));
    expect(writesSent(page)).toEqual([
      { method: 'PATCH', url: '/api/crew-seats', body: [{ op: 'remove', path: '/u-ash/Harbormaster' }] },
    ]);
    expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
    expect(panelOpen()).toBe(false);
  });

  const readOnly: {
    name: string;
    row: ManagedUser;
    digest?: Record<string, Record<string, string>>;
    wantWords: string;
    wantAdd: boolean;
  }[] = [
    {
      name: 'the seats a directory writes are shown with the reason, cannot be edited or removed, and no role can be added',
      row: user({
        id: 'u-hollis',
        username: 'hollis',
        roles: ['Harbormaster'],
        everywhereRoles: ['SectorCrew'],
        rolesSynced: true,
      }),
      wantWords: assignedByDirectory,
      wantAdd: false,
    },
    {
      name: 'a caller who may not unseat sees the reason under each role, and may still add one',
      row: user({ id: 'u-hollis', username: 'hollis', roles: ['Harbormaster'] }),
      digest: { ...grantedAll, CrewSeats: { List: 'granted', Create: 'granted' } },
      wantWords: cannotChangeRole,
      wantAdd: true,
    },
    {
      name: 'a caller who may neither seat nor unseat sees the roles and the reasons alone',
      row: user({ id: 'u-hollis', username: 'hollis', roles: ['Harbormaster'] }),
      digest: { ...grantedAll, CrewSeats: { List: 'granted' } },
      wantWords: cannotChangeRole,
      wantAdd: false,
    },
  ];
  for (const tt of readOnly) {
    it(tt.name, async () => {
      const page = await pageOver(server({ rows: [tt.row], ...(tt.digest ? { digest: tt.digest } : {}) }));
      const panel = await openAccess(page, 'hollis');
      const shown = roleRowsOf(panel);
      expect(shown.map((row) => row.text)).toEqual(
        [...tt.row.roles, ...tt.row.everywhereRoles].map((role) => (role === 'SectorCrew' ? 'Sector Crew' : role)),
      );
      expect(shown.every((row) => row.words === tt.wantWords && row.disabled && !row.removable)).toBe(true);
      expect(panel.querySelector('.ccc-role-add') !== null).toBe(tt.wantAdd);
      page.transport.requests.length = 0;
      await click(page, panel.querySelector('.ccc-access-save'));
      expect(page.transport.requests).toEqual([]);
      expect(panelOpen()).toBe(false);
    });
  }

  it("in the tenant partition the tenant's seats carry its name, an everywhere seat is shown with the reason it cannot be changed here and is not offered again, and a change goes under the domain segment", async () => {
    const page = await pageOver(
      server({
        rows: [user({ id: 'u-ash', username: 'ash', roles: ['SectorCrew'], everywhereRoles: ['Harbormaster'] })],
        roles: [
          { name: 'DockHand' },
          { name: 'Harbormaster' },
          { name: 'SectorCrew', description: 'Works the berths.' },
        ],
      }),
      { domain: 'sector-7' },
    );
    const panel = await openAccess(page, 'ash');
    expect(roleRowsOf(panel)).toEqual([
      { text: 'Sector Crew', words: 'sector-7 · Works the berths.', disabled: false, removable: true },
      { text: 'Harbormaster', words: assignedForEveryTenant, disabled: true, removable: false },
    ]);
    await click(page, panel.querySelector('.ccc-role-add'));
    const [, , picker] = pickerInputs(panelOf());
    const [, , added] = page.component.accessRows();
    expect(page.component.optionsFor(added, page.component.accessRows()).map((role) => role.name)).toEqual([
      'DockHand',
    ]);
    await typeInto(page, picker, 'Harbormaster');
    expect(optionsShown(picker)).toEqual([]);
    await typeInto(page, picker, 'dock');
    expect(optionsShown(picker)).toEqual([['Dock Hand', 'sector-7', '']]);
    await typeInto(page, picker, 'Dock Hand');
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-access-save'));
    expect(writesSent(page)).toEqual([
      {
        method: 'PATCH',
        url: '/api/sectors/sector-7/crew-sector-seats',
        body: [{ op: 'add', path: '/u-ash/DockHand', value: {} }],
      },
    ]);
  });

  it('a list of roles labels each with its title and where it reaches, plainly where the application has no tenants', async () => {
    const page = await pageOver(server());
    expect(page.component.roles().map((role) => page.component.roleLabel(role))).toEqual([
      'Harbormaster · Every tenant',
      'Headquarters · Everywhere',
      'Sector Crew · Every tenant',
    ]);
    TestBed.resetTestingModule();
    const members = await pageOver(server(), { auth: 'Members' });
    expect(members.component.roles().map((role) => members.component.roleLabel(role))).toEqual([
      'Harbormaster',
      'Headquarters',
      'Sector Crew',
    ]);
  });
});

describe('UserManagementComponent manages an account', () => {
  it("the menu button opens the account panel, whose actions follow the row's envelope: one's own row keeps the rename and the unlink alone", async () => {
    const page = await pageOver(server());
    const hollis = await openAccount(page, 'hollis');
    expect(textOf(hollis.querySelector('.ccc-panel-heading'))).toBe('Manage hollis');
    expect(hollis.querySelector('.ccc-user-rename')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-set-email')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-unlink')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-set-password')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-disable')).not.toBeNull();
    expect(hollis.querySelector('.ccc-user-delete')).not.toBeNull();
    expect(hollis.querySelector('.ccc-role-row')).toBeNull();
    expect(textOf(hollis.querySelector('.ccc-user-identities .ccc-panel-subheading'))).toBe('Signs in with');
    expect(textOf(hollis.querySelector('.ccc-user-identity-words'))).toBe('Fleet directory · hollis@fleet.example');
    expect(textOf(hollis.querySelector('.ccc-user-action-words'))).toBe('hollis is active.');
    await click(page, hollis.querySelector('.ccc-panel-cancel'));
    expect(panelOpen()).toBe(false);
    const nova = await openAccount(page, 'nova');
    expect(textOf(nova.querySelector('.ccc-panel-heading'))).toBe('Manage nova');
    expect(nova.querySelector('.ccc-user-rename')).not.toBeNull();
    expect(nova.querySelector('.ccc-user-set-email')).toBeNull();
    expect(nova.querySelector('.ccc-user-disable')).toBeNull();
    expect(nova.querySelector('.ccc-user-delete')).toBeNull();
    expect(nova.querySelector('.ccc-user-set-password')).toBeNull();
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
      want: {
        method: 'PATCH',
        url: '/api/crew-users',
        body: [{ op: 'patch', path: '/u-pip', value: { username: 'pippa' } }],
      },
    },
    {
      name: 'enable patches the disabled flag',
      act: (page, row) => page.component.setDisabled(row, false),
      want: {
        method: 'PATCH',
        url: '/api/crew-users',
        body: [{ op: 'patch', path: '/u-pip', value: { disabled: false } }],
      },
    },
    {
      name: 'set address patches the address, unverified',
      act: (page, row) => {
        page.component.address = 'pippa@fleet.example';
        return page.component.saveEmail(row);
      },
      want: {
        method: 'PATCH',
        url: '/api/crew-users',
        body: [{ op: 'patch', path: '/u-pip', value: { email: 'pippa@fleet.example' } }],
      },
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
      name: 'delete asks first, then removes the user',
      act: async (page, row) => {
        await page.component.remove(row);
        await page.settle();
        expect(page.component.confirmingDelete()).toBe('u-pip');
        expect(textOf(panelOf().querySelector('.ccc-user-confirm'))).toBe('Delete pip? This cannot be undone.');
        expect(page.transport.requests).toEqual([]);
        await page.component.remove(row);
      },
      want: { method: 'PATCH', url: '/api/crew-users', body: [{ op: 'remove', path: '/u-pip' }] },
    },
  ];
  for (const tt of writes) {
    it(`${tt.name}, then reads the page again`, async () => {
      const page = await pageOver(server());
      await openAccount(page, 'pip');
      const row = rowOf(page, 'pip');
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

  it('the panel stays open after a field is saved and follows the row as the server now lists it; a delete closes it', async () => {
    const state = server();
    const page = await pageOver(state);
    const panel = await openAccount(page, 'pip');
    state.rows = rows().map((row) => (row.id === 'u-pip' ? { ...row, disabled: false } : row));
    await click(page, panel.querySelector('.ccc-user-disable'));
    expect(panelOpen()).toBe(true);
    expect(textOf(panelOf().querySelector('.ccc-user-action-words'))).toBe('pip is active.');
    expect(textOf(panelOf().querySelector('.ccc-user-disable'))).toBe('Disable');
    await click(page, panelOf().querySelector('.ccc-user-delete'));
    await click(page, panelOf().querySelector('.ccc-user-delete-cancel'));
    expect(panelOf().querySelector('.ccc-user-confirm')).toBeNull();
    await click(page, panelOf().querySelector('.ccc-user-delete'));
    await click(page, panelOf().querySelector('.ccc-user-delete-confirm'));
    expect(panelOpen()).toBe(false);
    expect(writesSent(page).map((w) => JSON.stringify(w.body))).toEqual([
      '[{"op":"patch","path":"/u-pip","value":{"disabled":false}}]',
      '[{"op":"remove","path":"/u-pip"}]',
    ]);
  });

  it("unlink asks first, then posts the identity to the unlink method; a refusal is shown in the panel in the server's words and the page is read again", async () => {
    const state = server();
    const page = await pageOver(state);
    const panel = await openAccount(page, 'hollis');
    await click(page, panel.querySelector('.ccc-user-unlink'));
    expect(textOf(panelOf().querySelector('.ccc-user-confirm'))).toBe('Unlink Fleet directory from hollis?');
    expect(page.transport.requests.filter((r) => r.method === 'POST')).toEqual([]);
    await click(page, panelOf().querySelector('.ccc-user-unlink-cancel'));
    expect(panelOf().querySelector('.ccc-user-confirm')).toBeNull();
    await click(page, panelOf().querySelector('.ccc-user-unlink'));
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-user-unlink-confirm'));
    const first = page.transport.requests[0];
    expect(`${first.method} ${first.url}`).toBe('POST /api/unlink-crew-user-identity');
    expect(first.body).toEqual({ user: 'u-hollis', identity: 'i-1' });
    expect(page.component.notice()).toBeUndefined();

    state.answer = (request) =>
      request.method === 'POST'
        ? { status: 409, body: { message: 'The last way to sign in stays linked' } }
        : undefined;
    await click(page, panelOf().querySelector('.ccc-user-unlink'));
    page.transport.requests.length = 0;
    await click(page, panelOf().querySelector('.ccc-user-unlink-confirm'));
    expect(textOf(panelOf().querySelector('.ccc-panel-notice'))).toBe('The last way to sign in stays linked');
    expect(textOf(page.element.querySelector('.ccc-users-notice'))).toBe('The last way to sign in stays linked');
    expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-users\?/));
  });

  it('in the tenant partition every action goes under the domain segment', async () => {
    const page = await pageOver(server(), { domain: 'sector-7' });
    await openAccount(page, 'pip');
    const pip = rowOf(page, 'pip');
    page.transport.requests.length = 0;
    page.component.temporaryPassword = 'anvil-run-9';
    await page.component.setPassword(pip);
    page.component.rename = 'pippa';
    await page.component.saveRename(pip);
    expect(writesSent(page).map((w) => `${w.method} ${w.url}`)).toEqual([
      'POST /api/sectors/sector-7/set-crew-sector-user-password',
      'PATCH /api/sectors/sector-7/crew-sector-users',
    ]);
  });

  it('a row with no account action for the caller has no menu button, and keeps its pencil', async () => {
    const state = server();
    state.rows = [
      user({ id: 'u-quill', username: 'quill', [CapabilitiesProperty]: { Update: [], Delete: false, Execute: [] } }),
    ];
    state.digest = { ...grantedAll, CrewSeats: { List: 'granted' } };
    const page = await pageOver(state);
    expect(buttons(page, '.ccc-user-manage-account')).toEqual([]);
    expect(buttons(page, '.ccc-user-edit-access')).toHaveLength(1);
  });

  it("the address field follows the row's envelope, and is never offered where the username is the address", async () => {
    const page = await pageOver(server());
    const pip = await openAccount(page, 'pip');
    expect(pip.querySelector('.ccc-user-set-email')).not.toBeNull();
    expect(page.component.address).toBe('pip@fleet.example');
    await click(page, pip.querySelector('.ccc-panel-cancel'));
    const nova = await openAccount(page, 'nova');
    expect(nova.querySelector('.ccc-user-set-email')).toBeNull();
    TestBed.resetTestingModule();
    const kiosk = await pageOver(
      server({
        rows: [
          user({
            id: 'u-kay',
            username: 'kay@fleet.example',
            [CapabilitiesProperty]: { Update: ['email', 'disabled'], Delete: true, Execute: [] },
          }),
        ],
      }),
      { auth: 'Kiosk' },
    );
    const kay = await openAccount(kiosk, 'kay@fleet.example');
    expect(kay.querySelector('.ccc-user-set-email')).toBeNull();
  });
});

describe('UserManagementComponent manages the invitations', () => {
  const invitationRowsOf = (page: Page): HTMLElement[] =>
    Array.from(page.element.querySelectorAll<HTMLElement>('tr.ccc-invitation'));
  const invitationCell = (row: HTMLElement, name: string): string =>
    textOf(row.querySelector(`.ccc-invitation-${name}`));

  it('lists the standing invitations with the address, the roles by title, the inviter when the page lists them, and a revoke where the envelope allows one', async () => {
    const page = await pageOver(server());
    expect(textOf(page.element.querySelector('.ccc-invitations-heading'))).toBe('Invitations');
    const table = invitationRowsOf(page);
    expect(table.map((row) => invitationCell(row, 'email'))).toEqual(['cass@fleet.example', 'quill@fleet.example']);
    expect(table.map((row) => invitationCell(row, 'roles'))).toEqual(['Harbormaster', 'Sector Crew, Harbormaster']);
    expect(table.map((row) => invitationCell(row, 'by'))).toEqual(['nova', '']);
    expect(table.map((row) => row.querySelector('.ccc-invitation-revoke') !== null)).toEqual([true, false]);
  });

  it('the form takes an address and the roles, posts them to the invitations resource and reads the invitations again', async () => {
    const page = await pageOver(server());
    expect(page.element.querySelector('.ccc-invitations-new')).not.toBeNull();
    page.component.toggleInvite();
    await page.settle();
    expect(page.element.querySelector<HTMLInputElement>('input[name="inviteEmail"]')).not.toBeNull();
    expect(page.element.querySelector('mat-select[name="inviteRoles"]')).not.toBeNull();
    page.transport.requests.length = 0;
    page.component.newInvitation = { email: 'cass@fleet.example', roles: ['Harbormaster', 'SectorCrew'] };
    await page.component.invite();
    await page.settle();
    const { url, body } = patchSent(page);
    expect(url).toBe('/api/crew-invitations');
    expect(body).toEqual([
      { op: 'add', path: '/', value: { email: 'cass@fleet.example', roles: ['Harbormaster', 'SectorCrew'] } },
    ]);
    expect(sent(page.transport).slice(1)).toContainEqual(expect.stringMatching(/^GET \/api\/crew-invitations\?/));
    expect(page.component.inviting()).toBe(false);
    expect(page.component.newInvitation.email).toBe('');
  });

  it('revoke removes the invitation by id, under the domain segment in the tenant partition', async () => {
    const page = await pageOver(server(), { domain: 'sector-7' });
    page.transport.requests.length = 0;
    await page.component.revoke(page.component.invitations()[0]);
    await page.settle();
    const first = page.transport.requests[0];
    expect(`${first.method} ${first.url}`).toBe('PATCH /api/sectors/sector-7/crew-sector-invitations');
    expect(first.body).toEqual([{ op: 'remove', path: '/inv-1' }]);
    expect(sent(page.transport).slice(1)).toContainEqual(
      expect.stringMatching(/^GET \/api\/sectors\/sector-7\/crew-sector-invitations\?/),
    );
  });

  it("a refused invitation is shown in place in the server's words", async () => {
    const state = server();
    const page = await pageOver(state);
    page.component.toggleInvite();
    await page.settle();
    state.answer = (request) =>
      request.method === 'PATCH' && request.url.endsWith('crew-invitations')
        ? { status: 403, body: { message: 'SectorMarshal invites into every role but its own' } }
        : undefined;
    page.component.newInvitation = { email: 'cass@fleet.example', roles: ['SectorMarshal'] };
    await page.component.invite();
    await page.settle();
    expect(textOf(page.element.querySelector('.ccc-users-notice'))).toBe(
      'SectorMarshal invites into every role but its own',
    );
    expect(page.component.inviting()).toBe(true);
  });

  it('without Create on the invitations resource there is no invite button, and without List the block shows what the caller may do alone', async () => {
    const listOnly = await pageOver(server({ digest: { ...grantedAll, CrewInvitations: { List: 'granted' } } }));
    expect(listOnly.element.querySelector('.ccc-invitations')).not.toBeNull();
    expect(listOnly.element.querySelector('.ccc-invitations-new')).toBeNull();
    expect(invitationRowsOf(listOnly)).toHaveLength(2);
    TestBed.resetTestingModule();
    const createOnly = await pageOver(server({ digest: { ...grantedAll, CrewInvitations: { Create: 'granted' } } }));
    expect(createOnly.element.querySelector('.ccc-invitations-new')).not.toBeNull();
    expect(sent(createOnly.transport)).not.toContainEqual(expect.stringMatching(/crew-invitations/));
    expect(textOf(createOnly.element.querySelector('.ccc-invitations .ccc-users-note'))).toBe(
      'No invitations are waiting.',
    );
    TestBed.resetTestingModule();
    const neither = await pageOver(server({ digest: { ...grantedAll, CrewInvitations: {} } }));
    expect(neither.element.querySelector('.ccc-invitations')).toBeNull();
  });

  it('a partition whose descriptor names no invitations has no block', async () => {
    const page = await pageOver(server(), { auth: 'Members' });
    expect(page.element.querySelector('.ccc-invitations')).toBeNull();
    expect(sent(page.transport)).not.toContainEqual(expect.stringMatching(/invitations/));
  });
});
