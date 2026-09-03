import { Document } from '@contentful/rich-text-types';
import { Resource } from './brands';

export type ValidDisplayTypes =
  | 'boolean'
  | 'nullboolean'
  | 'number'
  | 'string'
  | 'date'
  | 'enumerated'
  | 'link'
  | 'uuid'
  | 'civildate'
  | 'string[]'
  | 'customtypes.attachment[]'
  | 'customtypes.contentfuldocument';

export type ValidRPCTypes = ValidDisplayTypes | `${Exclude<ValidDisplayTypes, 'string[]'>}[]`;

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
  /**
   * The server never accepts this field from clients — it is server-owned
   * (output-only, an @state column, or the tenant key) — so forms render it read-only
   * in every mode. Emitted by the ccc TypeScript generator.
   */
  readOnly?: boolean;
}

export interface ResourceMeta {
  route: string;
  consolidatedRoute?: string;
  listDisabled?: boolean;
  readDisabled?: boolean;
  createDisabled?: boolean;
  updateDisabled?: boolean;
  deleteDisabled?: boolean;
  fields: FieldMeta[];
}

export type Meta = MethodMeta | ResourceMeta;

export type ResourceMap = Record<Resource, ResourceMeta>;

export type NullBoolean = null | true | false;

export namespace CustomTypes {
  export interface Attachment {
    title: string;
    url: string;
    contentType: string;
  }
  export type ContentfulDocument = Document;
}
