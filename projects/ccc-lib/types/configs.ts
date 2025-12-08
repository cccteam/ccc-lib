import { Directive, input, Type } from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { FieldName, Method, Resource } from './permissions';
import { ResourceMeta } from './resource-meta';
import { ConcatFn, defaultEmptyFieldValue, NullBoolean } from './resource-types';
import { ResourceValidatorFn } from './validators';

export type ResourceMap = Record<Resource, ResourceMeta>;

export interface FieldPointer {
  field: FieldName;
}

export interface MenuItem {
  label: string;
  route?: string[];
  children?: MenuItem[];
}

export interface RouteResourceData {
  config: RootConfig;
}

export type DataType = string | number | number[] | string[] | boolean | undefined | Date;
export type RecordData = Record<string, DataType | null>;

export type RPCDataType = string | number | string[] | number[] | boolean | Date;
export type RPCRecordData = Record<string, RPCDataType>;
export type RpcMethod = Record<string, DataType>;

export type ParentResourceConfig = ListViewConfig | ViewConfig | ArrayConfig;
export type ChildResourceConfig = ListViewConfig | ViewConfig | ComponentConfig | ArrayConfig;

export type ActionType = 'function' | 'link';

export type ListConcatFn =
  | 'space-concat'
  | 'hyphen-concat'
  | 'space-hyphen-concat'
  | 'hyphen-space-concat'
  | 'no-space-concat';
export type ConfigType = ChildResourceConfig;
export type FormatType = 'simpleSlashDateFormat';
export type RPCPlacement = 'inline' | 'end';

export type ColumnConfig = SingleColumnConfig | MultiColumnConfig;

export interface ActionButtonConfig {
  label: string;
  icon: string;
  action?: (resource: { id: string }) => void;
  viewRoute?: string;
  actionType?: ActionType;
  color?: string;
  disabledLabel?: string;
}
export interface ActionButtonConfigOptions {
  label: string;
  icon: string;
  action?: (resource: { id: string }) => void;
  viewRoute?: string;
  actionType?: ActionType;
  color?: string;
  disabledLabel?: string;
}

export function actionButtonConfig(config: ActionButtonConfigOptions): ActionButtonConfig {
  return {
    ...actionButtonConfigDefaults,
    ...config,
  } satisfies ActionButtonConfig;
}

export const actionButtonConfigDefaults = {
  label: '',
  icon: '',
  actionType: 'function' as ActionType,
  color: '',
  disabledLabel: '',
} satisfies ActionButtonConfig;

export interface SingleColumnConfig {
  id: FieldName;
  header?: string;
  width?: number;
  resizable?: boolean;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  valueGetter?: (data: any) => string;
  valueFormatter?: (data: any) => string;
  tooltipPosition?: TooltipPosition;
  viewRoute?: Resource;
  buttonConfig?: ActionButtonConfig;
  actionType?: ActionType;
  formatType?: FormatType | string;
  hidden?: boolean;
  emptyDataValue?: DataType;
  filterable?: boolean;
  hideHeader?: boolean;
}
export interface SingleColumnConfigOptions {
  id: FieldName;
  header?: string;
  width?: number;
  resizable?: boolean;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  valueGetter?: (data: any) => string;
  valueFormatter?: (data: any) => string;
  tooltipPosition?: TooltipPosition;
  viewRoute?: Resource;
  buttonConfig?: ActionButtonConfig;
  actionType?: ActionType;
  formatType?: FormatType | string;
  hidden?: boolean;
  emptyDataValue?: DataType;
  filterable?: boolean;
  hideHeader?: boolean;
}

export function singleColumnConfig(config: SingleColumnConfigOptions): SingleColumnConfig {
  return {
    ...singleColumnConfigDefaults,
    ...config,
  } satisfies SingleColumnConfig;
}

export const singleColumnConfigDefaults = {
  id: '' as FieldName,
  header: '',
  resizable: true,
  actionType: 'function' as ActionType,
  hidden: false,
  filterable: true,
  hideHeader: false,
} satisfies SingleColumnConfig;

export interface MultiColumnConfig extends SingleColumnConfig {
  // todo: additionalIds name is not clear. the id provided is fetched from a different resource, such as a typeId
  additionalIds: AdditionalResourceConfig[];
  concatFn: ListConcatFn;
}
export interface MultiColumnConfigOptions extends SingleColumnConfigOptions {
  additionalIds: AdditionalResourceConfig[];
  concatFn: ListConcatFn;
}

export function multiColumnConfig(config: MultiColumnConfigOptions): MultiColumnConfig {
  return {
    ...multiColumnConfigDefaults,
    ...config,
  } satisfies MultiColumnConfig;
}

export const multiColumnConfigDefaults = {
  ...singleColumnConfigDefaults,
  additionalIds: [] as AdditionalResourceConfig[],
  concatFn: 'hyphen-concat' as ListConcatFn,
} satisfies MultiColumnConfig;

export interface AdditionalResourceConfig {
  resource?: Resource;
  id: FieldName;
  field?: FieldName;
  hidden?: boolean;
}
export interface AdditionalResourceConfigOptions {
  id: FieldName;
  resource?: Resource;
  field?: FieldName;
  hidden?: boolean;
}

export function additionalResourceConfig(config: AdditionalResourceConfigOptions): AdditionalResourceConfig {
  return {
    ...additionalResourceConfigDefaults,
    ...config,
  } satisfies AdditionalResourceConfig;
}

export const additionalResourceConfigDefaults = {
  id: '' as FieldName,
  resource: '' as Resource,
  field: '' as FieldName,
  hidden: false,
} satisfies AdditionalResourceConfig;

export interface FieldSort {
  field: FieldName;
  direction: 'asc' | 'desc';
}
export interface FieldSortOptions {
  field: FieldName;
  direction?: 'asc' | 'desc';
}

export function fieldSort(config: FieldSortOptions): FieldSort {
  return {
    ...fieldSortDefaults,
    ...config,
  } satisfies FieldSort;
}

export const fieldSortDefaults = {
  field: '' as FieldName,
  direction: 'asc' as 'asc' | 'desc',
} satisfies FieldSort;

export interface EnumeratedConfigOptions {
  // primaryResource comes from the metadata
  overrideResource?: Resource;
  /* A function to filter the list of enumerated options.
   * The `parentResource` argument contains the data of the resource that this enumerated field is part of.
   * It will be an object with the current form values, which can be empty during resource creation.
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  filter?: (resource: any) => string;
  /**
   * Set disableCacheForFilterPii to `true` to promote the GET to a POST when PII is used in the filter
   * POST requests cannot be cached
   */
  disableCacheForFilterPii?: boolean;
  /**
   * Specifies which resource data to pass to the filter function:
   * - 'rootResource': Pass in the root resource data
   * - 'parentResource': Pass in the parent resource data
   * @default 'parentResource'
   */
  filterType?: FilterType;
  sorts?: FieldSort[];
  listDisplay?: FieldName[];
  viewDisplay: FieldName[];
  viewConcatFn?: ConcatFn;
  listConcatFn?: ConcatFn;
  viewDetails?: boolean;
  searchable?: boolean;
}

type FilterType = 'parentResource' | 'rootResource';
export interface EnumeratedConfig {
  overrideResource: Resource;
  filter: (resource: any) => string;
  disableCacheForFilterPii: boolean;
  filterType: FilterType;
  sorts: FieldSort[];
  listDisplay: FieldName[];
  viewDisplay: FieldName[];
  viewConcatFn: ConcatFn;
  listConcatFn: ConcatFn;
  viewDetails: boolean;
  searchable: boolean;
}
export function enumeratedConfig(config: EnumeratedConfigOptions): EnumeratedConfig {
  return {
    ...enumeratedConfigDefaults,
    ...config,
  } satisfies EnumeratedConfig;
}
export const enumeratedConfigDefaults = {
  overrideResource: '' as Resource,
  filter: (): string => '',
  disableCacheForFilterPii: false,
  filterType: 'parentResource' as FilterType,
  sorts: [] as FieldSort[],
  listDisplay: [] as FieldName[],
  viewDisplay: [] as FieldName[],
  viewConcatFn: 'hyphen-concat' as ConcatFn,
  listConcatFn: 'hyphen-concat' as ConcatFn,
  viewDetails: false,
  searchable: false,
};

export type FieldDefault = ForeignKeyDefault | StaticDefault | null;

export interface NullBooleanConfigOptions {
  displayValues?: Record<'null' | 'true' | 'false', { label: string; value: NullBoolean }>;
}
export interface NullBooleanConfig {
  /** This property maps the three possible values for this
   * nullboolean field with the display values users will see
   * on the screen for each
   */
  displayValues: Record<'null' | 'true' | 'false', { label: string; value: NullBoolean }>;
}
export function nullBooleanConfig(config: NullBooleanConfigOptions): NullBooleanConfig {
  return {
    ...nullBooleanConfigDefaults,
    ...config,
  } satisfies NullBooleanConfig;
}
const defaultBooleanDisplay = Object.freeze({
  null: {
    label: defaultEmptyFieldValue,
    value: null,
  },
  true: {
    label: 'Yes',
    value: true,
  },
  false: {
    label: 'No',
    value: false,
  },
});

export const nullBooleanConfigDefaults = {
  displayValues: defaultBooleanDisplay,
};

export interface ForeignKeyDefaultOptions {
  parentId: FieldName;
}
export interface ForeignKeyDefault {
  type: 'foreignKey';
  parentId: FieldName;
}
export function foreignKeyDefault(config: ForeignKeyDefaultOptions): ForeignKeyDefault {
  return {
    ...foreignKeyDefaultDefaults,
    ...config,
  } satisfies ForeignKeyDefault;
}
export const foreignKeyDefaultDefaults = {
  type: 'foreignKey',
  parentId: '' as FieldName,
} satisfies ForeignKeyDefault;

export interface StaticDefault {
  type: 'static';
  value: string | boolean;
}
export interface staticDefaultOptions {
  value: string | boolean;
}
export function staticDefault(config: staticDefaultOptions): StaticDefault {
  return {
    ...staticDefaultDefaults,
    ...config,
  } satisfies StaticDefault;
}
export const staticDefaultDefaults = {
  type: 'static',
  value: '',
} satisfies StaticDefault;

export type Affix = string | remoteData | parentData;

interface remoteData {
  resource: Resource;
  id: FieldName;
  field: FieldName;
}

interface parentData {
  field: FieldName;
}

export type ConfigElement = FieldElement | SectionElement | ComputedDisplayFieldElement | PaddingElement;

export type ColSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ComputedDisplayFieldElementOptions {
  label?: string;
  class?: string;
  cols?: ColSize;
  calculatedValue?: (data: any) => string;
  shouldRender?: ((data: any) => boolean) | boolean;
}
export interface ComputedDisplayFieldElement {
  type: 'computedDisplayField';
  label: string;
  class: string;
  cols: ColSize;
  calculatedValue: (data: any) => string;
  shouldRender: ((data: any) => boolean) | boolean;
}
export function computedDisplayField(config: ComputedDisplayFieldElementOptions): ComputedDisplayFieldElement {
  return {
    ...computedDisplayFieldElementDefaults,
    ...config,
  } satisfies ComputedDisplayFieldElement;
}
export const computedDisplayFieldElementDefaults = {
  type: 'computedDisplayField',
  label: '',
  class: '',
  cols: 6,
  calculatedValue: (): string => '',
  shouldRender: true,
} satisfies ComputedDisplayFieldElement;

export interface PaddingElementOptions {
  cols?: ColSize;
  shouldRender?: ((data: any) => boolean) | boolean;
}
export interface PaddingElement {
  type: 'padding';
  cols: ColSize;
  /** Determines whether the padding is shown
   */
  shouldRender: ((data: any) => boolean) | boolean;
}
export function padding(config?: PaddingElementOptions): PaddingElement {
  return {
    ...paddingElementDefaults,
    ...config,
  } satisfies PaddingElement;
}
export const paddingElementDefaults = {
  type: 'padding',
  cols: 12,
  shouldRender: true,
} satisfies PaddingElement;

export interface SectionElementOptions {
  label?: string;
  class?: string;
  cols?: ColSize;
  shouldRender?: ((data: any) => boolean) | boolean;
  nullAllChildrenIfConditionallyHidden?: boolean;
  children?: ConfigElement[];
}
export interface SectionElement {
  type: 'section';
  label: string;
  class: string;
  cols: ColSize;
  /**
   * shouldRender is used to determine if the section should be
   * displayed to users.
   * When assigning shouldRender a function, the first argument
   * is the current state of the resource being displayed
   * Hides the layout AND all of its children
   */
  shouldRender: ((data: any) => boolean) | boolean;
  /** If shouldRender is NOT a function, this property does nothing
   * If shouldRender is a function, this property
   * sets children's values to null if shouldRender hides it (returns false)
   * within the resource-layout.component
   */
  nullAllChildrenIfConditionallyHidden: boolean;
  children: ConfigElement[];
}
export function section(config: SectionElementOptions): SectionElement {
  return {
    ...sectionElementDefaults,
    ...config,
  } satisfies SectionElement;
}
export const sectionElementDefaults = {
  type: 'section',
  label: '',
  class: '',
  cols: 12,
  shouldRender: true,
  nullAllChildrenIfConditionallyHidden: false,
  children: [],
} satisfies SectionElement;

export interface FieldElementOptions {
  name: FieldName;
  label?: string;
  cols?: ColSize;
  class?: string;
  enumeratedConfig?: EnumeratedConfig;
  default?: FieldDefault;
  nullBooleanConfig?: NullBooleanConfig;
  validators?: ((data: any) => ResourceValidatorFn[]) | ResourceValidatorFn[];
  readOnly?: boolean;
  prefixes?: Affix[];
  suffixes?: Affix[];
  shouldRender?: ((data: any) => boolean) | boolean;
  nullIfConditionallyHidden?: boolean;
}
export interface FieldElement {
  type: 'field';
  name: string;
  label: string;
  cols: ColSize;
  class: string;
  enumeratedConfig: EnumeratedConfig;
  default: FieldDefault;
  nullBooleanConfig: NullBooleanConfig;
  /**
   * A list of validators that must pass to allow a field to be submitted.
   * Utilize existing validators in the resourceValidators object, and
   * add any new or custom validators to it
   */
  validators: ((data: any) => ResourceValidatorFn[]) | ResourceValidatorFn[];
  readOnly: boolean;
  prefixes: Affix[];
  suffixes: Affix[];
  /**
   * shouldRender is used to determine if the element should be
   * displayed to users.
   * When assigning shouldRender a function, the first argument
   * is the current state of the resource being displayed
   */
  shouldRender: ((data: any) => boolean) | boolean;
  /** If shouldRender is NOT a function, this property does nothing
   * If shouldRender is a function, this property
   * determines whether the form control associated
   * with this config element should have its value
   * set to null if shouldRender hides it (returns false)
   */
  nullIfConditionallyHidden: boolean;
}

export function field(config: FieldElementOptions): FieldElement {
  return {
    ...fieldElementDefaults,
    ...config,
  } satisfies FieldElement;
}
export const fieldElementDefaults = {
  type: 'field',
  name: '',
  label: '',
  cols: 6,
  class: '',
  enumeratedConfig: { ...enumeratedConfigDefaults },
  default: null,
  validators: [],
  nullBooleanConfig: { ...nullBooleanConfigDefaults },
  readOnly: false,
  prefixes: [],
  suffixes: [],
  shouldRender: true,
  nullIfConditionallyHidden: false,
} satisfies FieldElement;

/**
 * RouteData is used to define the route for a config
 * route: the route for the config
 * hasViewRoute: when true, a route will be created for route/:uuid
 */
export interface RootRouteData {
  route?: string;
  hasViewRoute?: boolean;
}

export interface RPCConfigOptions {
  label: string;
  afterMethodRedirect?: string;
  conditions: {
    field: FieldName;
    matchValues: string[];
  }[];
  methodBodyTemplate?: any;
  successMessage?: string;
  elements?: ConfigElement[];
  placement?: RPCPlacement;
  method: Method;
  customComponent?: ComponentConfig;
  refreshResources?: Resource[];
  defaultModalWidth?: string;
  shouldRender?: () => boolean;
}
export interface RPCConfig {
  label: string;
  afterMethodRedirect: string | string[];
  conditions: {
    field: FieldName;
    matchValues: string[];
  }[];
  methodBodyTemplate: any;
  method: Method;
  successMessage: string;
  elements: ConfigElement[];
  placement: RPCPlacement;
  customComponent: ComponentConfig;
  refreshResources: Resource[];
  defaultModalWidth: string;
  shouldRender: () => boolean;
}
export function rpcConfig(config: RPCConfigOptions): RPCConfig {
  return {
    ...rpcConfigDefaults,
    ...config,
  } satisfies RPCConfig;
}
export const rpcConfigDefaults = {
  label: '',
  afterMethodRedirect: '',
  conditions: [] as {
    field: FieldName;
    matchValues: string[];
  }[],
  methodBodyTemplate: {} as any,
  successMessage: '',
  elements: [] as ConfigElement[],
  placement: 'end' as RPCPlacement,
  method: '' as Method,
  customComponent: {} as ComponentConfig,
  refreshResources: [] as Resource[],
  defaultModalWidth: '',
  shouldRender: (): boolean => true,
} satisfies RPCConfig;

export interface RPCBaseFormData {
  elements: FieldElement[];
  label: string;
  method: Method;
}

// Config is the base type that all configurations should start with
export interface RootConfigOptions {
  routeData?: RootRouteData;
  nav?: {
    navItem: MenuItem;
    group?: string;
  };
  parentConfig: ParentResourceConfig;
  relatedConfigs?: ChildResourceConfig[];
  rpcConfigs?: RPCConfig[];
}
export interface RootConfig {
  routeData: RootRouteData;
  nav: {
    navItem: MenuItem;
    group?: string;
  };
  parentConfig: ParentResourceConfig;
  relatedConfigs: ChildResourceConfig[];
  rpcConfigs?: RPCConfig[];
}
export const rootConfigDefaults = {
  routeData: {} as RootRouteData,
  nav: {
    navItem: {} as MenuItem,
  },
  parentConfig: {} as ParentResourceConfig,
  relatedConfigs: [] as ChildResourceConfig[],
  rpcConfigs: [] as RPCConfig[],
} satisfies RootConfig;

export function rootConfig(config: RootConfigOptions): RootConfig {
  return {
    ...rootConfigDefaults,
    ...config,
  } satisfies RootConfig;
}

// Base type config is the base type for all resource configurations
export interface BaseConfigOptions {
  title?: string;
  createTitle?: string;
  createButtonLabel?: string;
  primaryResource: Resource;
  parentClass?: string;
  fieldClass?: string;
  elements: ConfigElement[];
  createConfig?: ConfigType;
  parentRelation?: {
    parentKey: FieldName;
    childKey: FieldName;
  };
  showBackButton?: boolean;
  createNavigation?: string[];
}
export interface BaseConfig {
  title: string;
  createTitle: string;
  createButtonLabel: string;
  primaryResource: Resource;
  parentClass: string;
  fieldClass: string;
  elements: ConfigElement[];
  createConfig: ConfigType;
  parentRelation: {
    parentKey: FieldName;
    childKey: FieldName;
  };
  showBackButton: boolean;
  createNavigation: string[];
}

@Directive()
export abstract class CustomConfigComponent {
  uuid = input<string>();
  parentData = input<RecordData>();
  config = input<ComponentConfig>();
}

// Available param types for a component config
export type ConfigParam = SwitchConfigParam;

// Custom component config renders a custom component and supplies params to it
export interface ComponentConfigOptions {
  // todo: it's weird that we have a primary resource here. Would be nice to remove but this adds a null check to all other configs
  primaryResource: Resource;
  component: Type<CustomConfigComponent> | 'SwitchResolver';
  params?: ConfigParam;
  relatedConfig?: ParentResourceConfig[];
  shouldRenderActions?: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}
export interface ComponentConfig {
  type: 'Component';
  primaryResource: Resource;
  component: Type<CustomConfigComponent> | 'SwitchResolver';
  params: ConfigParam;
  relatedConfig: ParentResourceConfig[];
  shouldRenderActions: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}
export function componentConfig(config: ComponentConfigOptions): ComponentConfig {
  return {
    ...componentConfigDefaults,
    ...config,
  } satisfies ComponentConfig;
}
export const componentConfigDefaults = {
  type: 'Component',
  primaryResource: '' as Resource,
  component: 'SwitchResolver',
  params: {
    cases: [],
  } satisfies ConfigParam,
  relatedConfig: [] as ParentResourceConfig[],
  shouldRenderActions: {
    create: (): boolean => true,
    edit: (): boolean => true,
    delete: (): boolean => true,
  },
} satisfies ComponentConfig;

// A switch is a component type that allows for conditional rendering of child components based on the value of a parent field
// When parentData[c.parentField] equals c.caseId render the caseConfig with parentData[c.childId] as the uuid
export interface switchCase {
  caseId: string;
  parentField: string;
  childId: string;
  config: ChildResourceConfig;
}
export interface SwitchConfigParamOptions {
  cases: switchCase[];
}
export interface SwitchConfigParam {
  cases: switchCase[];
}
export function switchParams(config: SwitchConfigParamOptions): SwitchConfigParam {
  return {
    ...switchParamsDefaults,
    ...config,
  } satisfies SwitchConfigParam;
}
export const switchParamsDefaults = {
  cases: [] as switchCase[],
} satisfies SwitchConfigParam;

export interface ListViewConfigOptions extends BaseConfigOptions {
  showViewButton?: boolean;
  loadCreatedResource?: boolean;
  collapsible?: boolean;
  overrideResource?: Resource;
  searchable?: boolean;
  enableRowExpansion?: boolean;
  rowExpansionConfig?: ChildResourceConfig;
  requireSearchToDisplayResults?: boolean;
  listColumns: ColumnConfig[];
  relatedConfigs?: ChildResourceConfig[];
  viewResource?: Resource | string;
  actionType?: ActionType;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  filter?: (parentResource: any) => string;
  disableCacheForFilterPii?: boolean;
  rpcConfigs?: RPCConfig[];
  sorts?: FieldSort[];
  shouldRenderActions?: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}
export interface ListViewConfig extends BaseConfig {
  type: 'ListView';
  showViewButton: boolean;
  loadCreatedResource: boolean;
  collapsible: boolean;
  overrideResource: Resource;
  searchable: boolean;
  enableRowExpansion: boolean;
  rowExpansionConfig: ChildResourceConfig;
  requireSearchToDisplayResults: boolean;
  listColumns: ColumnConfig[];
  relatedConfigs: ChildResourceConfig[];
  viewResource: Resource | string;
  actionType: ActionType;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  filter: (parentResource: any) => string;
  disableCacheForFilterPii: boolean;
  rpcConfigs?: RPCConfig[];
  sorts: FieldSort[];
  shouldRenderActions: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}

export function listViewConfig(config: ListViewConfigOptions): ListViewConfig {
  return {
    ...listViewConfigDefaults,
    ...config,
  } satisfies ListViewConfig;
}
export const listViewConfigDefaults = {
  title: '',
  primaryResource: '' as Resource,
  type: 'ListView',
  createTitle: '',
  createButtonLabel: 'Create',
  loadCreatedResource: false,
  showViewButton: true,
  collapsible: false,
  listColumns: [],
  elements: [],
  parentClass: '',
  fieldClass: '',
  createConfig: {} as ListViewConfig,
  createNavigation: [],
  relatedConfigs: [],
  parentRelation: {
    parentKey: '' as FieldName,
    childKey: '' as FieldName,
  },
  overrideResource: '' as Resource,
  searchable: false,
  enableRowExpansion: false,
  rowExpansionConfig: {} as ChildResourceConfig,
  requireSearchToDisplayResults: false,
  showBackButton: true,
  filter: (): string => '',
  disableCacheForFilterPii: false,
  sorts: [] as FieldSort[],
  viewResource: '' as Resource,
  actionType: 'function' as ActionType,
  rpcConfigs: [],
  shouldRenderActions: {
    create: (): boolean => true,
    edit: (): boolean => true,
    delete: (): boolean => true,
  },
} satisfies ListViewConfig;

export type ViewType = 'OneToOne' | 'OneToMany';

export interface ViewConfigOptions extends BaseConfigOptions {
  collapsible?: boolean;
  connectorResource?: Resource;
  relatedConfigs?: ChildResourceConfig[];
  rpcConfigs?: RPCConfig[];
  shouldRenderActions?: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}
export interface ViewConfig extends BaseConfig {
  type: 'View';
  collapsible: boolean;
  // todo: remove this comment once full documentation has been added. Populate this value when a database view resource is used to connect the ViewConfig's parent resource to its primary resource
  connectorResource: Resource;
  rpcConfigs?: RPCConfig[];
  relatedConfigs: ChildResourceConfig[];
  /** A set of functions that allows for
   * conditional display of non-RPC
   * actions based on the pristine state of the resource
   * (if such a state is applicable. Creation for example won't
   * have such data)
   * This is separate from ABAC control which takes
   * precedence and is based on a user's attributes
   */
  shouldRenderActions: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}

export function viewConfig(config: ViewConfigOptions): ViewConfig {
  return {
    ...viewConfigDefaults,
    ...config,
  } satisfies ViewConfig;
}
export const viewConfigDefaults = {
  title: '',
  primaryResource: '' as Resource,
  type: 'View',
  createTitle: '',
  createButtonLabel: 'Create',
  parentClass: '',
  fieldClass: '',
  elements: [],
  collapsible: true,
  connectorResource: '' as Resource,
  relatedConfigs: [],
  createConfig: {} as ViewConfig,
  shouldRenderActions: {
    create: (): boolean => true,
    edit: (): boolean => true,
    delete: (): boolean => true,
  },
  createNavigation: [],
  parentRelation: {
    parentKey: '' as FieldName,
    childKey: '' as FieldName,
  },
  showBackButton: true,
  rpcConfigs: [],
} satisfies ViewConfig;

export interface arrayConfigOptions {
  iteratedConfig: ChildResourceConfig;
  viewType?: ViewType;
  collapsible?: boolean;
  createConfig?: ConfigType;
  connectorResource?: Resource;
  connectorField?: FieldName;
  primaryResource: Resource;
  listFilter: (parentResource: any) => string;
  disableCacheForFilterPii?: boolean;
  sorts?: FieldSort[];
  title?: string;
  createButtonLabel?: string;
  limit?: number;
  shouldRenderActions?: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
}
export interface ArrayConfig {
  type: 'Array';
  iteratedConfig: ChildResourceConfig;
  viewType: ViewType;
  collapsible: boolean;
  createConfig: ConfigType;
  connectorResource: Resource;
  connectorField: FieldName;
  primaryResource: Resource;
  listFilter: (parentResource: any) => string;
  disableCacheForFilterPii: boolean;
  sorts: FieldSort[];
  title: string;
  createButtonLabel: string;
  shouldRenderActions: Record<'edit' | 'delete' | 'create', (data: any) => boolean>;
  limit: number;
}
export function arrayConfig(config: arrayConfigOptions): ArrayConfig {
  return {
    ...arrayConfigDefaults,
    ...config,
  } satisfies ArrayConfig;
}
export const arrayConfigDefaults = {
  type: 'Array',
  iteratedConfig: {} as ChildResourceConfig,
  viewType: 'OneToMany' as ViewType,
  collapsible: true,
  createConfig: {} as ViewConfig,
  connectorResource: '' as Resource,
  connectorField: '' as FieldName,
  primaryResource: '' as Resource,
  listFilter: (): string => '',
  disableCacheForFilterPii: false,
  sorts: [] as FieldSort[],
  title: '',
  createButtonLabel: 'Create',
  limit: Infinity,
  shouldRenderActions: {
    create: (): boolean => true,
    edit: (): boolean => true,
    delete: (): boolean => true,
  },
} satisfies ArrayConfig;
