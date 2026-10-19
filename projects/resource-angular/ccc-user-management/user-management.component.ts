import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, PendingTasks, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Capability,
  Domain,
  Method,
  Page,
  RoleRow,
  UserIdentity,
  UserPartitionClient,
  userPartition,
  UserRow,
  UserSurfaceDescriptor,
  userSurfaces,
  WithCapabilities,
} from '@cccteam/resource';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';

/** A user row as the component reads it: with the capability envelope the list asked for. */
export type ManagedUser = WithCapabilities<UserRow>;

/** The capabilities the list asks the server to evaluate per row: what each row's controls follow. */
const askedCapabilities: Capability[] = ['Update', 'Delete', 'Execute'];

/** The form a new user is entered on. */
interface NewUser {
  username: string;
  password: string;
  disabled: boolean;
  role: string;
}

const emptyNewUser = (): NewUser => ({ username: '', password: '', disabled: false, role: '' });

/**
 * The user-management page over one partition of an Auth's surface. The component
 * configures itself from the descriptor's `userSurfaces` block: `auth` names the surface
 * (the first one by default) and `domain` binds the tenant partition, the global one when
 * it is omitted. Nothing about the application is named here; what the page offers
 * follows from the surface's shape and the caller's grants. A password method gives the
 * create form a password field and every row a set-password action; an external
 * registration gives the rows their identity links and an unlink action; the tenant
 * partition's create asks for the role that seats the new user in the tenant.
 *
 * Every control follows a capability: the digest decides whether users are created and
 * seats written, and the row's capability envelope, asked for on every read, decides the
 * rename, the disable, the delete and the methods per row, so one's own row loses its
 * disable and delete and a user seated outside the tenant loses the account-level
 * actions without the page knowing why. A row whose seats a directory writes
 * (`rolesSynced`) shows them read-only. A refusal, by the server or by the network, is
 * shown in place in the server's words, and the list is read again after every write so
 * the rows say what the server says.
 *
 *     <ccc-user-management />
 *     <ccc-user-management auth="Members" />
 *     <ccc-user-management [domain]="tenant()" />
 */
@Component({
  selector: 'ccc-user-management',
  imports: [DatePipe, FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {
  private client = inject(RESOURCE_CLIENT);
  /** Every request is registered as pending work, so the application is stable only once it has answered. */
  private pendingTasks = inject(PendingTasks);

  /** The Auth whose surface the page serves, by name; the descriptor's first surface when omitted. */
  auth = input<string | undefined>(undefined);
  /** The tenant whose partition the page serves; the global partition when omitted. */
  domain = input<Domain | undefined>(undefined);

  /** The surface `auth` names, or the first; undefined when the descriptor carries none, or no such Auth. */
  surface = computed<UserSurfaceDescriptor | undefined>(() => {
    const surfaces = userSurfaces(this.client.descriptor);
    const name = this.auth();
    return name === undefined ? surfaces[0] : surfaces.find((surface) => surface.auth === name);
  });
  /** The partition `domain` selects on the surface; undefined when the surface has none of that kind. */
  partition = computed(() => {
    const scope = this.domain() === undefined ? 'global' : 'domain';
    return this.surface()?.partitions.find((partition) => partition.scope === scope);
  });
  /** Why the page serves nothing: no surface, no such Auth, or no tenant partition. */
  unserved = computed<string | undefined>(() => {
    const name = this.auth();
    if (userSurfaces(this.client.descriptor).length === 0) {
      return 'This application serves no user management.';
    }
    if (!this.surface()) {
      return `This application has no ${name} sign-in.`;
    }
    if (!this.partition()) {
      return `The ${this.surface()?.label} users are not partitioned by tenant.`;
    }
    return undefined;
  });
  /** The partition's handles and methods, bound to the tenant where there is one. */
  users = computed<UserPartitionClient | undefined>(() => {
    const surface = this.surface();
    const partition = this.partition();
    return surface && partition ? userPartition(this.client, surface, partition, this.domain()) : undefined;
  });

  /** The page of users on screen, with each row's capability envelope. */
  page = signal<Page<ManagedUser> | undefined>(undefined);
  rows = computed<readonly ManagedUser[]>(() => this.page()?.rows ?? []);
  /** The roles a seat may take in the partition; empty when the caller may not list them. */
  roles = signal<readonly RoleRow[]>([]);
  /** True until the first read of a partition answers. */
  loading = signal(true);
  /** The refusal of the list itself, in the server's words. */
  error = signal<string | undefined>(undefined);
  /** The refusal of the last action, in the server's words; cleared by the next action. */
  notice = signal<string | undefined>(undefined);
  /** An action is in flight; the controls are disabled meanwhile. */
  busy = signal(false);
  /** The id of the row whose details are open. */
  open = signal<string | undefined>(undefined);
  /** The create form is shown. */
  creating = signal(false);
  /** The id of the row whose delete awaits confirmation. */
  confirmingDelete = signal<string | undefined>(undefined);

  newUser: NewUser = emptyNewUser();
  /** The open row's rename, temporary password and seat-to-add fields. */
  rename = '';
  temporaryPassword = '';
  seatRole = '';

  constructor() {
    effect(() => {
      const partition = this.users();
      untracked(() => void this.tracked(() => this.load(partition)));
    });
  }

  /** The words for the partition: the surface's label, and the tenant where there is one. */
  heading(): string {
    const label = this.surface()?.label ?? '';
    const domain = this.domain();
    return domain === undefined ? `${label} users` : `${label} users of ${domain}`;
  }

  /** The words for how a user signs in: the password and each linked identity's registration. */
  signsInWith(row: UserRow): string {
    const means = row.identities.map((identity) => this.registrationLabel(identity));
    if (row.hasPassword) {
      means.unshift('Password');
    }
    return means.length === 0 ? 'No way to sign in' : means.join(', ');
  }

  /** The registration's label for an identity, else the connection it was linked through. */
  registrationLabel(identity: UserIdentity): string {
    return this.surface()?.registrations.find((reg) => reg.name === identity.connection)?.label ?? identity.connection;
  }

  /** The roles the open row does not hold yet, for the seat picker. */
  seatable(row: UserRow): RoleRow[] {
    return this.roles().filter((role) => !row.roles.includes(role.name));
  }

  /**
   * The words for a role in the picker. The global partition's roles list carries each
   * role's kind, and seating a domain-kind role there seats the user in every tenant,
   * which the label says; the tenant partition's list carries domain roles alone.
   */
  roleLabel(role: RoleRow): string {
    return role.kind === 'domain' && this.partition()?.scope === 'global' ? `${role.name} (every tenant)` : role.name;
  }

  canCreate(): boolean {
    return this.users()?.canCreateUsers() ?? false;
  }

  /** Whether the create form asks for a password: the Auth has a password method. */
  asksPassword(): boolean {
    return this.surface()?.password ?? false;
  }

  /** Whether the create form asks for a role: the tenant partition seats the new user in the tenant. */
  asksRole(): boolean {
    return this.partition()?.scope === 'domain';
  }

  canRename(row: ManagedUser): boolean {
    return this.users()?.users.fieldEditable(row, 'username') ?? false;
  }

  canDisable(row: ManagedUser): boolean {
    return this.users()?.users.fieldEditable(row, 'disabled') ?? false;
  }

  canDelete(row: ManagedUser): boolean {
    return this.users()?.users.rowCan(row, 'Delete') ?? false;
  }

  canSetPassword(row: ManagedUser): boolean {
    const method = this.partition()?.setPassword;
    return method !== undefined && (this.users()?.users.rowCan(row, 'Execute', method as Method) ?? false);
  }

  canUnlink(row: ManagedUser): boolean {
    const method = this.partition()?.unlinkIdentity;
    return (
      method !== undefined &&
      row.identities.length > 0 &&
      (this.users()?.users.rowCan(row, 'Execute', method as Method) ?? false)
    );
  }

  canSeat(row: ManagedUser): boolean {
    return !row.rolesSynced && (this.users()?.canSeat() ?? false) && this.seatable(row).length > 0;
  }

  canUnseat(row: ManagedUser): boolean {
    return !row.rolesSynced && (this.users()?.canUnseat() ?? false);
  }

  /** Whether the row has any action for the caller, so a details button is worth showing. */
  manageable(row: ManagedUser): boolean {
    return (
      this.canRename(row) ||
      this.canDisable(row) ||
      this.canDelete(row) ||
      this.canSetPassword(row) ||
      this.canUnlink(row) ||
      this.canSeat(row) ||
      this.canUnseat(row)
    );
  }

  /** Opens one row's details, or closes them when they are open. */
  toggle(row: UserRow): void {
    if (this.open() === row.id) {
      this.open.set(undefined);
      return;
    }
    this.open.set(row.id);
    this.rename = row.username;
    this.temporaryPassword = '';
    this.seatRole = '';
    this.confirmingDelete.set(undefined);
    this.notice.set(undefined);
  }

  /** Shows the create form, or hides it. */
  toggleCreate(): void {
    this.creating.update((shown) => !shown);
    this.newUser = emptyNewUser();
    this.notice.set(undefined);
  }

  /** Creates the user the form describes: a password where one was typed, the role in the tenant partition. */
  create(): Promise<void> {
    const partition = this.users();
    if (!partition || !this.creating()) {
      return Promise.resolve();
    }
    const form = this.newUser;
    return this.act(async () => {
      await partition.users.create({
        username: form.username,
        ...(this.asksPassword() && form.password !== '' ? { password: form.password } : {}),
        ...(form.disabled ? { disabled: true } : {}),
        ...(this.asksRole() ? { role: form.role } : {}),
      });
      this.newUser = emptyNewUser();
      this.creating.set(false);
    });
  }

  /** Renames the open row to what the rename field says. */
  saveRename(row: UserRow): Promise<void> {
    const partition = this.users();
    if (!partition || this.rename === row.username) {
      return Promise.resolve();
    }
    const username = this.rename;
    return this.act(() => partition.users.patch([row.id], { username }));
  }

  setDisabled(row: UserRow, disabled: boolean): Promise<void> {
    const partition = this.users();
    if (!partition) {
      return Promise.resolve();
    }
    return this.act(() => partition.users.patch([row.id], { disabled }));
  }

  /** Asks before the row goes; the second click deletes. */
  remove(row: UserRow): Promise<void> {
    const partition = this.users();
    if (!partition) {
      return Promise.resolve();
    }
    if (this.confirmingDelete() !== row.id) {
      this.confirmingDelete.set(row.id);
      return Promise.resolve();
    }
    return this.act(async () => {
      await partition.users.remove([row.id]);
      this.confirmingDelete.set(undefined);
      this.open.set(undefined);
    });
  }

  cancelDelete(): void {
    this.confirmingDelete.set(undefined);
  }

  /** Sets the temporary password typed for the row; the person changes it at their next sign-in. */
  setPassword(row: UserRow): Promise<void> {
    const partition = this.users();
    if (!partition || this.temporaryPassword === '') {
      return Promise.resolve();
    }
    const password = this.temporaryPassword;
    return this.act(async () => {
      await partition.setPassword(row.id, password);
      this.temporaryPassword = '';
    });
  }

  /** Seats the row in the role the picker holds. */
  seat(row: UserRow): Promise<void> {
    const partition = this.users();
    if (!partition || this.seatRole === '') {
      return Promise.resolve();
    }
    const role = this.seatRole;
    return this.act(async () => {
      await partition.seats.create({ user: row.id, role });
      this.seatRole = '';
    });
  }

  unseat(row: UserRow, role: string): Promise<void> {
    const partition = this.users();
    if (!partition) {
      return Promise.resolve();
    }
    return this.act(() => partition.seats.remove([row.id, role]));
  }

  unlink(row: UserRow, identity: UserIdentity): Promise<void> {
    const partition = this.users();
    if (!partition) {
      return Promise.resolve();
    }
    return this.act(() => partition.unlinkIdentity(row.id, identity.id));
  }

  /** The same page again, after a write or on request. */
  reload(): Promise<void> {
    return this.act(() => Promise.resolve());
  }

  next(): Promise<void> {
    return this.turn(this.page()?.next);
  }

  previous(): Promise<void> {
    return this.turn(this.page()?.prev);
  }

  /** Runs one action as pending work, busy meanwhile, then reads the page again whatever happened. */
  private act(work: () => Promise<void>): Promise<void> {
    if (this.busy()) {
      return Promise.resolve();
    }
    return this.tracked(async () => {
      this.busy.set(true);
      this.notice.set(undefined);
      try {
        await work();
      } catch (error) {
        this.notice.set(messageOf(error));
      } finally {
        await this.refresh();
        this.busy.set(false);
      }
    });
  }

  /** Follows one page relation when the server named one. */
  private turn(relation: (() => Promise<Page<ManagedUser>>) | undefined): Promise<void> {
    if (!relation || this.busy()) {
      return Promise.resolve();
    }
    return this.tracked(async () => {
      this.busy.set(true);
      this.notice.set(undefined);
      try {
        this.page.set(await relation());
        this.open.set(undefined);
      } catch (error) {
        this.notice.set(messageOf(error));
      } finally {
        this.busy.set(false);
      }
    });
  }

  /** The first read of a partition: its page of users and the roles a seat may take. */
  private async load(partition: UserPartitionClient | undefined): Promise<void> {
    this.page.set(undefined);
    this.roles.set([]);
    this.open.set(undefined);
    this.error.set(undefined);
    this.notice.set(undefined);
    if (!partition) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    try {
      this.page.set(await partition.users.page({ capabilities: askedCapabilities }));
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
    try {
      this.roles.set(await partition.roles.list({ limit: 'all' }));
    } catch {
      // A caller who may not list the roles seats nobody; the picker stays empty.
      this.roles.set([]);
    }
  }

  /** The same page again, keeping its position; a failed refresh is a notice, not a blank page. */
  private async refresh(): Promise<void> {
    const current = this.page();
    const partition = this.users();
    if (!partition) {
      return;
    }
    try {
      this.page.set(current ? await current.reload() : await partition.users.page({ capabilities: askedCapabilities }));
    } catch (error) {
      this.notice.set(this.notice() ?? messageOf(error));
    }
  }

  /** Runs one piece of work as a pending task of the application, released when it settles. */
  private async tracked<T>(work: () => Promise<T>): Promise<T> {
    const release = this.pendingTasks.add();
    try {
      return await work();
    } finally {
      release();
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
