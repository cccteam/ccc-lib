import { Resource } from './brands';

/**
 * The display-type vocabulary: the name the ccc generator emits for every field it
 * describes, a table column, a view column, a computed field, and an RPC field alike, and
 * the name a browser chooses a control and a cell renderer by. A leaf's display type is
 * its own name on every path (a time.Time is 'date', a civil.Date 'civildate', a ccc.UUID
 * 'uuid', so a computed UUID field and a UUID column carry the same name), a nested
 * struct, an imported type, and a value with no fixed shape are 'object', a byte slice is
 * 'bytes', a nullable BOOL column is 'nullboolean', and a picker is 'enumerated'. A slice
 * of a leaf adds [], for every leaf but the two that describe one value alone:
 * 'nullboolean' is the tri-state rule for one nullable BOOL column, and a picker stores
 * one key. The list is the generator's own (resource/generation/displaytype.go) and its
 * README's table (section 12), spelled the same, and the generator refuses to emit
 * anything outside it, so the union says exactly what a generated file can carry.
 */
export type ValidDisplayTypes =
  | 'string'
  | 'number'
  | 'boolean'
  /** A nullable BOOL column: null, true, or false (NullBoolean), one tri-state control. */
  | 'nullboolean'
  /** A timestamp (time.Time): a Date in the interface. */
  | 'date'
  /** A calendar date (civil.Date): a Date in the interface, coerced to yyyy-MM-dd on the wire. */
  | 'civildate'
  /** A UUID: a string in the interface, and this name says it is an identifier, not text. */
  | 'uuid'
  /** A picker: the field holds a key into the resource or enumeration the metadata names beside it. */
  | 'enumerated'
  /** A nested struct the generator mirrored or derived, an imported type, or a value with no fixed shape: one opaque object, granted, masked, and selected whole. */
  | 'object'
  /**
   * A byte slice ([]byte, BYTES(n)): the interface says string because encoding/json
   * carries it as base64, and this name says it is not text. A grid shows its size or
   * offers a download, never the base64; a form takes no free-text control for it.
   */
  | 'bytes'
  /** A list of a leaf (an ARRAY column, a slice field): never filtered, indexed, or sorted by; a grid shows the list, a form takes no free-text control for it. */
  | 'string[]'
  | 'number[]'
  | 'boolean[]'
  | 'date[]'
  | 'civildate[]'
  | 'uuid[]'
  | 'object[]'
  | 'bytes[]';

/**
 * An RPC field carries the same vocabulary as a resource field; the name stays because
 * the generated methods file imports it.
 */
export type ValidRPCTypes = ValidDisplayTypes;

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

/**
 * How a field's masked cells meet a sort or a filter. Only the non-default behavior is
 * named: a field without it conceals.
 */
export type MaskingBehavior = 'positional';

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
   * Set when the field is declared masking:"positional" on the server: a masked cell
   * still arrives hidden (absent from the row), but the server sorts, filters, and pages
   * on the real column, so a reader who sees some values can tell where the hidden ones
   * fall between them. Absent, the field conceals: a masked cell is NULL to the sort and
   * the filter, sorting in the NULL region and matching only isnull.
   */
  masking?: MaskingBehavior;
  /**
   * The most characters the server accepts in this field, from its column's declared
   * STRING(n) length; per element for a 'string[]' field. A form adds a maxLength
   * validator from it so a value the server would refuse with 400 never leaves the
   * browser. JavaScript counts UTF-16 units and the server counts code points, so the
   * form refuses a little early on astral characters and never accepts what the server
   * refuses. Absent on an unbounded column and on every non-string field. Emitted by the
   * ccc TypeScript generator.
   */
  maxLength?: number;
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
