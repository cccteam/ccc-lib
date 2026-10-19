import { CreatePermission, DeletePermission, Domain, ExecutePermission, Method, Resource } from './brands';
import { ClientBase, ResourceHandle } from './client';
import { ApiDescriptor, UserPartitionDescriptor, UserSurfaceDescriptor } from './descriptor';

/**
 * The user-management surfaces: every Auth the server's router binds has its users, their
 * seats and the roles a seat may take served as resources, in a global partition and,
 * where the application has a tenant record, a tenant partition, with the set-password
 * and unlink-identity methods beside them. The descriptor's `userSurfaces` block says
 * which resources and methods make up each surface; the rows have the shapes below on
 * every application, so a component over the surface is written once.
 */

/** One external identity linked to a user: how they sign in through a registration. */
export interface UserIdentity {
  id: string;
  /** The library method behind the link (`google`, `azure`, `workos`) and the registration it was linked through. */
  method: string;
  connection: string;
  subject: string;
  /** The tenant key the registration stored on the link (the Workspace, the Entra tenant, the organization); null where it stored none. */
  organization: string | null;
  email: string | null;
  linkedAt: string;
  lastUsedAt: string;
}

/** One user of a partition: the account, its sign-in means and its seats. */
export interface UserRow {
  id: string;
  username: string;
  disabled: boolean;
  hasPassword: boolean;
  /** An operator set the password; the person changes it before anything else is served. */
  passwordChangeRequired: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  /** The tenant key the user's identity links agree on; null where they carry none or disagree. */
  organization: string | null;
  identities: UserIdentity[];
  /** The seats held in the partition's scope: the global and every-domain seats in the global partition, the tenant's in the tenant one. */
  roles: string[];
  /** The seats held in every domain, listed apart since the tenant partition shows them beside the tenant's own. */
  everywhereRoles: string[];
  /** The seats are a directory's, written at every sign-in: the surface refuses to seat or unseat the user by hand. */
  rolesSynced: boolean;
}

/**
 * What a create takes: the username, a password where the Auth has a password method
 * (required when it is the only way in, optional beside an invited-users registration),
 * whether the account starts disabled, and, in the tenant partition, the role of the seat
 * that makes the person the tenant's user.
 */
export interface UserCreate {
  username: string;
  password?: string;
  disabled?: boolean;
  role?: string;
}

/** What an update may change: the username and the disabled flag; a password is set through the method. */
export interface UserPatch {
  username?: string;
  disabled?: boolean;
}

/** One seat: a user holding a role in the partition's scope, with the flag that says the seat is held in every domain. */
export interface SeatRow {
  user: string;
  role: string;
  username: string;
  /** The global partition's flag: the seat is held in every domain rather than globally. */
  everyDomain?: boolean;
  /** The tenant partition's flag: the seat is held in every domain rather than in this tenant alone. */
  everywhere?: boolean;
}

/** What seating takes: the user's id and the role; both are the seat's key. */
export interface SeatCreate {
  user: string;
  role: string;
}

/** One role a seat may take; `kind` says global or domain in the global partition and is absent in the tenant one. */
export interface RoleRow {
  name: string;
  kind?: 'global' | 'domain';
}

/** The bodies of the two methods. */
export interface SetUserPasswordRequest {
  user: string;
  password: string;
}

export interface UnlinkUserIdentityRequest {
  user: string;
  identity: string;
}

export type UsersHandle = ResourceHandle<UserRow, [string], 'list' | 'read' | 'create' | 'patch' | 'remove', UserCreate, UserPatch>;
export type SeatsHandle = ResourceHandle<SeatRow, [string, string], 'list' | 'read' | 'create' | 'remove', SeatCreate>;
export type RolesHandle = ResourceHandle<RoleRow, [string], 'list' | 'read'>;

/** The surfaces the descriptor carries; none on a descriptor from a generator that predates them. */
export function userSurfaces(descriptor: ApiDescriptor): readonly UserSurfaceDescriptor[] {
  return descriptor.userSurfaces ?? [];
}

/**
 * The handles of one partition of a surface, and the two methods, bound to a tenant for
 * the tenant partition: what a user-management page reads and writes through. The
 * handles are the client's own over the descriptor's entries, so `can`, `rowCan` and
 * the capability envelope answer for them as for every resource; the `can…` methods
 * here fold in what the Auth's methods give the partition (no create without a way to
 * sign in, no set-password without a password method, no unlink without a registration).
 */
export interface UserPartitionClient {
  readonly surface: UserSurfaceDescriptor;
  readonly partition: UserPartitionDescriptor;
  readonly domain?: Domain;
  readonly users: UsersHandle;
  readonly seats: SeatsHandle;
  readonly roles: RolesHandle;
  /** Whether the partition takes a create (the Auth has a way for the new user to sign in) and the digest grants it. */
  canCreateUsers(): boolean;
  /** Whether the digest grants seating, and unseating, in the partition. */
  canSeat(): boolean;
  canUnseat(): boolean;
  /** Whether the partition has the set-password method and the digest grants its Execute. */
  canSetPassword(): boolean;
  /** Whether the partition has the unlink method and the digest grants its Execute. */
  canUnlinkIdentity(): boolean;
  /** Sets a temporary password an operator chose: the user changes it before anything else is served. */
  setPassword(user: string, password: string): Promise<void>;
  /** Unlinks one identity from the user; the last way in is refused by the server. */
  unlinkIdentity(user: string, identity: string): Promise<void>;
}

/**
 * Binds one partition of a surface on the client: the global partition when `domain` is
 * omitted, the tenant partition in `domain` otherwise. A partition of the other kind is
 * refused, as is one whose entries the descriptor does not carry.
 */
export function userPartition(
  client: ClientBase,
  surface: UserSurfaceDescriptor,
  partition: UserPartitionDescriptor,
  domain?: Domain,
): UserPartitionClient {
  if (partition.scope === 'domain' && domain === undefined) {
    throw new Error(`the ${surface.auth} surface's tenant partition needs the tenant: pass its domain`);
  }
  if (partition.scope === 'global' && domain !== undefined) {
    throw new Error(`the ${surface.auth} surface's global partition takes no tenant: omit the domain`);
  }
  const { resources, methods } = client.descriptor;
  const entry = (name: string) => {
    const descriptor = resources[name];
    if (!descriptor) {
      throw new Error(`the ${surface.auth} surface names the resource ${name}, which the descriptor does not carry`);
    }
    return descriptor;
  };
  const users = client.define<UserRow, [string], 'list' | 'read' | 'create' | 'patch' | 'remove', UserCreate, UserPatch>(
    entry(partition.users),
    domain,
  );
  const seats = client.define<SeatRow, [string, string], 'list' | 'read' | 'create' | 'remove', SeatCreate>(
    entry(partition.seats),
    domain,
  );
  const roles = client.define<RoleRow, [string], 'list' | 'read'>(entry(partition.roles), domain);
  const methodPath = (name: string): string => {
    const descriptor = methods[name];
    if (!descriptor) {
      throw new Error(`the ${surface.auth} surface names the method ${name}, which the descriptor does not carry`);
    }
    const { domainRoute } = client.descriptor;
    return domain !== undefined && domainRoute
      ? `${domainRoute.segment}/${encodeURIComponent(domain)}/${descriptor.route}`
      : descriptor.route;
  };
  const canExecute = (name: string | undefined): boolean =>
    name !== undefined && client.can(ExecutePermission, name as Method, domain);

  return {
    surface,
    partition,
    ...(domain !== undefined ? { domain } : {}),
    users,
    seats,
    roles,
    canCreateUsers: () => entry(partition.users).operations.includes('create') && users.can(CreatePermission),
    canSeat: () => seats.can(CreatePermission),
    canUnseat: () => seats.can(DeletePermission),
    canSetPassword: () => canExecute(partition.setPassword),
    canUnlinkIdentity: () => canExecute(partition.unlinkIdentity),
    setPassword: async (user, password) => {
      if (!partition.setPassword) {
        throw new Error(`the ${surface.auth} surface has no password method: nothing sets a password`);
      }
      const body: SetUserPasswordRequest = { user, password };
      await client.request('POST', methodPath(partition.setPassword), { body });
    },
    unlinkIdentity: async (user, identity) => {
      if (!partition.unlinkIdentity) {
        throw new Error(`the ${surface.auth} surface has no external registration: nothing unlinks an identity`);
      }
      const body: UnlinkUserIdentityRequest = { user, identity };
      await client.request('POST', methodPath(partition.unlinkIdentity), { body });
    },
  };
}

/** The resource names of a surface, for a page that asks the digest about them. */
export function surfaceResources(surface: UserSurfaceDescriptor): Resource[] {
  return surface.partitions.flatMap((p) => [p.users, p.seats, p.roles] as Resource[]);
}
