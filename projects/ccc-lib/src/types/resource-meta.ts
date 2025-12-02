// Meta interfaces for resources and methods
// This file exists to break circular dependencies between types and ccc-resource

import { Resource } from './permissions';

export type ValidDisplayTypes =
  | 'boolean'
  | 'nullboolean'
  | 'number'
  | 'string'
  | 'date'
  | 'enumerated'
  | 'link'
  | 'uuid'
  | 'civildate';

export type ValidRPCTypes = ValidDisplayTypes | `${ValidDisplayTypes}[]`;

export interface RPCFieldMeta {
  fieldName: string;
  displayType: ValidRPCTypes;
  enumeratedResource?: Resource;
}

export interface MethodMeta {
  route: string;
  fields: RPCFieldMeta[];
}

export interface FieldMeta {
  fieldName: string;
  /** Indicates whether the field is required and only applies during resource creation.
   * Use the validators config parameter in all other contexts
   */
  required: boolean;
  primaryKey?: { ordinalPosition: number };
  displayType: ValidDisplayTypes;
  enumeratedResource?: Resource;
  isIndex: boolean;
}

export interface ResourceMeta {
  route: string;
  consolidatedRoute?: string;
  listDisabled?: boolean;
  readDisabled?: boolean;
  createDisabled?: boolean;
  updateDisabled?: boolean;
  deleteDisabled?: boolean;
  substringSearchParameter?: string;
  fields: FieldMeta[];
}

export type Meta = MethodMeta | ResourceMeta;
