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
  | 'customtypes.contentfuldocument'
  /** A nested struct the generator mirrored: one opaque object, granted, masked, and selected whole. */
  | 'object'
  | 'object[]';

export type ValidRPCTypes = ValidDisplayTypes | `${Exclude<ValidDisplayTypes, 'string[]'>}[]`;

/** One value of a fixed enumeration: the stored id and the description shown for it. */
export interface EnumerationOption {
  id: string;
  display: string;
}

export interface RPCFieldMeta {
  fieldName: string;
  displayType: ValidRPCTypes;
  enumeratedResource?: Resource;
}

export interface MethodMeta {
  route: string;
  /** Set when the method answers with a result body; absent methods resolve with nothing. */
  answers?: true;
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
  /** The resource whose rows a picker for this key lists; absent when the values are fixed (see enumeration). */
  enumeratedResource?: Resource;
  /**
   * The fixed value set of a key into an @enumerate table, emitted by the generator from
   * the table's rows at generation time — the same rows the Go constants and the
   * TypeScript enum come from. A picker renders these without a request or a List
   * grant. Present exactly when displayType is 'enumerated' and enumeratedResource is
   * absent.
   */
  enumeration?: EnumerationOption[];
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
