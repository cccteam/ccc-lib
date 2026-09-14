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
  /** The resource whose rows a picker for this field lists; absent when the values are fixed (see enumeration). */
  enumeratedResource?: Resource;
  /** The fixed values of an enumeration table the field names; the picker renders them without a request. */
  enumeration?: EnumerationOption[];
}

export interface MethodMeta {
  route: string;
  /** Set when the method answers with a result body; absent methods resolve with nothing. */
  answers?: true;
  fields: RPCFieldMeta[];
}

/** When the server accepts a filter on a field: on its own, or only beside an indexed field. */
export type FilterEligibility = 'always' | 'withIndexed';

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
   * Whether the server accepts a filter on this field, by the eligibility the query
   * decoder applies, so a table draws a filter control only where the server will
   * answer. `always`: an indexed or unique-indexed table or view field, or a computed
   * resource's `allow_filter` field (its List function filters in memory).
   * `withIndexed`: a table or view `allow_filter` field, accepted only when the same
   * filter also touches an `always` field — once one index has narrowed the rows a
   * second is rarely used, and indexes are a scarce commodity on Spanner, so
   * `allow_filter` conserves them. Absent, a filter naming the field is refused.
   */
  filterable?: FilterEligibility;
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
  /**
   * The table resource whose rows this view carries, one to one under the same key: the
   * struct-scope @rowsOf on a virtual or computed view. The view declares its backing
   * table, a create goes into the table, and the new row shows up in the view on the
   * next list because the view's SQL reads that table, so a page listing the view sends
   * its create, edit, and delete here and opens a row on this resource's page. Absent,
   * the view is a read-only list.
   */
  rowsOf?: Resource;
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
