export type PatchOperation = 'add' | 'patch' | 'remove';

export interface Operation {
  op: PatchOperation;
  value?: Record<string, unknown>;
  path: string;
}

export interface CreateOperation extends Operation {
  op: 'add';
}

export interface UpdateOperation extends Operation {
  op: 'patch';
}

export interface DeleteOperation extends Operation {
  op: 'remove';
}