import { ModelSignal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ConfigElement,
  DataType,
  FieldElement,
  MethodMeta,
  RecordData,
  Resource,
  ResourceMeta,
  RPCRecordData,
  ViewConfig,
} from '@cccteam/ccc-lib/types';
import { format, isValid } from 'date-fns';
import { civildateCoercion, flattenElements } from './gui-constants';

export interface Link {
  id: string;
  resource: Resource;
  text: string;
}

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
  console.debug(formDataState);

  return {
    formGroup: fg,
    pristineFormValues: pristineValues,
  };
};

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

export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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
