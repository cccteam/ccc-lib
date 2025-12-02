import { ModelSignal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Route } from '@angular/router';
import {
  ConfigElement,
  DataType,
  FieldElement,
  MenuItem,
  MethodMeta,
  RecordData,
  Resource,
  ResourceMeta,
  RootConfig,
  RouteResourceData,
  RPCRecordData,
  ViewConfig
} from '@cccteam/ccc-lib/src/types';
import { format, isValid } from 'date-fns';
import { canDeactivateGuard } from './can-deactivate.guard';
import { civildateCoercion, flattenElements } from './gui-constants';

export const generatedNavItems = [] as MenuItem[];
export const generatedNavGroups = [] as string[];

export interface Link {
  id: string;
  resource: Resource;
  text: string;
}

export type ResourceMap = Record<Resource, ResourceMeta>;

export type PristineData = Record<string, DataType | null>;

export const createFormGroup = (
  meta: ResourceMeta,
  resourceData: RecordData,
  config: ViewConfig,
  formDataState?: ModelSignal<RecordData>,
): {
  formGroup: FormGroup;
  pristineFormValues: PristineData;
} => {
  const fg = new FormGroup({});
  const pristineValues: Record<string, DataType | null> = {};
  const allElements = flattenElements(config.elements);

  for (const field of meta.fields || []) {
    const isFieldNameRegistered = fg.get(field.fieldName) !== null;
    if (isFieldNameRegistered) {
      continue;
    }

    const findConfig = allElements.find((element) => element.type === 'field' && element.name === field.fieldName);
    const fieldConfig = findConfig as FieldElement | undefined;
    if (!fieldConfig) {
      continue;
    }

    let value: DataType | null = null;
    const stringValue = resourceData?.[field.fieldName] ? String(resourceData[field.fieldName]) : '';

    if (field.displayType === 'civildate' && stringValue) {
      value = civildateCoercion(stringValue);
    } else if (resourceData[field.fieldName] !== undefined) {
      value = resourceData[field.fieldName];
    }

    const control = new FormControl(value);

    if (fieldConfig.validators.length > 0) {
      control.setValidators(fieldConfig.validators);
    }

    fg.addControl(field.fieldName, control);
    pristineValues[field.fieldName] = value;
  }
  // todo: swap this with a manual subscription where the form data is subscribed to and
  // is dstroyed once the form is destroyed, similar to gui/src/app/components/Resource/resource-view/resource-view.component.ts
  // constructor effect
  console.debug(formDataState);
  // formDataState && formDataState.set(pristineValues);

  return {
    formGroup: fg,
    pristineFormValues: pristineValues,
  };
};

export const resourceRoutes = (config: RootConfig, resourceMeta: (resource: Resource) => ResourceMeta): Route => {
  const meta = resourceMeta(config.parentConfig.primaryResource as Resource);
  if (!meta) {
    return {} as Route;
  }

  if (config.nav.group) {
    if (config.routeData.route) {
      addToNavItems(config.nav, config.routeData.route);
    } else {
      addToNavItems(config.nav, meta.route);
    }
  }

  if (config.routeData.route) {
    const baseRoute: Route = {
      path: config.routeData.route,
      data: { config: config } satisfies RouteResourceData,
      children: [
        {
          path: '',
          loadComponent: () => import('./resource-list-create/resource-list-create.component').then((mod) => mod.ResourceListCreateComponent),
          canDeactivate: [canDeactivateGuard],
        },
      ],
    };
    if (config.routeData.hasViewRoute !== false) {
      baseRoute.children?.push({
        path: ':uuid',
        loadComponent: () => import('./compound-resource/compound-resource.component').then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [canDeactivateGuard],
      });
      return baseRoute;
    }
  }

  return {
    path: meta.route,
    data: { config: config } as RouteResourceData,
    children: [
      {
        path: ':uuid',
        loadComponent: () => import('./compound-resource/compound-resource.component').then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: '',
        loadComponent: () => import('./resource-list-create/resource-list-create.component').then((mod) => mod.ResourceListCreateComponent),
        canDeactivate: [canDeactivateGuard],
      },
    ],
  } satisfies Route;
};

function addToNavItems(
  nav: {
    navItem: MenuItem;
    group?: string;
  },
  route: string,
): void {
  nav.navItem.route = [route];

  if (!nav.group) {
    generatedNavItems.push(nav.navItem);
    return;
  }

  if (!generatedNavGroups.includes(nav.group)) {
    generatedNavGroups.push(nav.group);
  }

  let groupItem = generatedNavItems.find((item) => item.label === nav.group);

  if (!groupItem) {
    groupItem = { label: nav.group, children: [] };
    generatedNavItems.push(groupItem);
  }

  groupItem.children = groupItem.children || [];
  groupItem.children.push(nav.navItem);

  generatedNavItems.sort((a, b) => (a.label > b.label ? -1 : 1));
}

/**
 * Recursive function to extract nested field names from a config.
 * @param elements - The elements to extract field names from.
 * @returns - An array of field names.
 */
export function extractFieldNames(elements: ConfigElement[]): string[] {
  const fields: string[] = [];
  for (const element of elements) {
    if (element.type === 'section') {
      fields.push(...extractFieldNames(element.children));
    } else if (element.type === 'field') {
      fields.push(element.name as string);
    }
  }
  return fields;
}

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

/**
 * Checks if a string is a valid UUID (versions 1-5) according to RFC 4122.
 *
 * @param str - The string to validate.
 * @returns `true` if the string is a valid UUID, otherwise `false`.
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Coerces metadata types in a record according to the metadata.
 *
 * @param record - The record to coerce.
 * @param meta - The metadata (resource or method).
 * @returns The coerced record.
 */
export function metadataTypeCoercion(record: RecordData, meta: ResourceMeta): RecordData;
export function metadataTypeCoercion(record: RPCRecordData, meta: MethodMeta): RPCRecordData;
export function metadataTypeCoercion(
  record: RecordData | RPCRecordData,
  meta: ResourceMeta | MethodMeta,
): RecordData | RPCRecordData {
  if (!meta?.fields) return record;

  const displayTypeByField = new Map(meta.fields.map((f) => [f.fieldName, f.displayType]));

  for (const [key, value] of Object.entries(record)) {
    const displayType = displayTypeByField.get(key);
    if (displayType === 'civildate' && value && isValid(value)) {
      const date = value as Date;
      record[key] = format(date, 'yyyy-MM-dd');
    }
  }

  return record;
}
