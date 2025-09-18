import { inject, ModelSignal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { Route } from '@angular/router';
import { format, isValid } from 'date-fns';
import type { Resource } from '../internal-types';
import { RESOURCE_META } from '../internal-types';
import {
  ConfigElement,
  DataType,
  FieldElement,
  MenuItem,
  MethodMeta,
  PristineData,
  RecordData,
  ResourceMeta,
  RootConfig,
  RouteResourceData,
  RPCRecordData,
  ViewConfig,
} from '../types';
import { dirtyFormDeactivateGuard } from './can-deactivate.guard';
import { civildateCoercion, flattenElements } from './gui-constants';
import { ResourceBaseComponent } from './resource-base/resource-base.component';

/**
 * Recursively cleans a FormGroup or FormArray, removing controls with empty string values.
 * Similar to sparseFormData, but doesn't compare to an initial state
 * @param control - The FormGroup or FormArray to clean.
 * @returns A cleaned object with non-empty values.
 */
export function cleanStringForm<T>(control: AbstractControl): T | undefined {
  if (control instanceof FormGroup) {
    const cleanedGroup: Record<string, unknown> = {};
    for (const key of Object.keys(control.controls)) {
      const childControl = control.get(key);
      if (childControl) {
        const cleanedValue = cleanStringForm(childControl);
        if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '') {
          cleanedGroup[key] = cleanedValue;
        }
      }
    }
    return cleanedGroup as T;
  } else if (control instanceof FormArray) {
    const cleanedArray = control.controls
      .map((childControl) => cleanStringForm(childControl))
      .filter((item) => item !== undefined && item !== null && item !== '');
    return cleanedArray as unknown as T;
  } else {
    return control.value !== '' ? control.value : undefined;
  }
}

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
  console.log(formDataState);
  // formDataState && formDataState.set(pristineValues);

  return {
    formGroup: fg,
    pristineFormValues: pristineValues,
  };
};

export const resourceRoutes = (config: RootConfig): Route => {
  const resourceMeta = inject(RESOURCE_META);
  const meta = resourceMeta(config.parentConfig.primaryResource as Resource);
  if (!meta) {
    return {} as Route;
  }

  if (config.nav) {
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
      component: ResourceBaseComponent,
      children: [
        {
          path: '',
          loadComponent: () =>
            import(`./resource-list-create/resource-list-create.component`).then(
              (mod) => mod.ResourceListCreateComponent,
            ),
          canDeactivate: [dirtyFormDeactivateGuard],
        },
      ],
    };
    if (config.routeData.hasViewRoute !== false) {
      baseRoute.children?.push({
        path: ':uuid',
        loadComponent: () =>
          import(`./compound-resource/compound-resource.component`).then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [dirtyFormDeactivateGuard],
      });
      return baseRoute;
    }
  }

  return {
    path: meta.route,
    data: { config: config } as RouteResourceData,
    component: ResourceBaseComponent,
    children: [
      {
        path: ':uuid',
        loadComponent: () =>
          import(`./compound-resource/compound-resource.component`).then((mod) => mod.CompoundResourceComponent),
        canDeactivate: [dirtyFormDeactivateGuard],
      },
      {
        path: '',
        loadComponent: () =>
          import(`./resource-list-create/resource-list-create.component`).then(
            (mod) => mod.ResourceListCreateComponent,
          ),
        canDeactivate: [dirtyFormDeactivateGuard],
      },
    ],
  } satisfies Route;
};

export const generatedNavItems = [] as MenuItem[];
export const generatedNavGroups = [] as string[];

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
