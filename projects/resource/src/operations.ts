export type OperationType = 'add' | 'patch' | 'remove';

/**
 * One mutation on the consolidated (or per-resource) PATCH endpoint. `path` is the
 * resource route plus key segments, without API prefix: `/work-orders`,
 * `/waystations/ws-alpha/work-order-tasks/{id}/{n}`. Every operation in one request
 * commits in one transaction or not at all.
 */
export interface Operation {
  op: OperationType;
  path: string;
  value?: Record<string, unknown>;
}

/**
 * The mutation response: server-generated ids of created rows, keyed by the
 * camelCase plural resource name. Resources without a generated key contribute no
 * entry, so an empty object is a normal success.
 */
export type BatchResult = Record<string, string[]>;
