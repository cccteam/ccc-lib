import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { isEqual } from 'lodash-es';

/**
 * Compares two objects and returns a sparse object containing only the differing key-value pairs
 * @param data - object to compare
 * @param compareData - object to compare against
 * @returns Partial<T>
 * @example sparseData<UserCreate>(this.user, initUser)
 */
export function sparseData<T extends Record<string, unknown>>(data: T, compareData: T): Partial<T> {
  const sparseData: Partial<T> = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (!isEqual(data[key], compareData[key])) {
        sparseData[key] = data[key];
      }
    }
  }

  return sparseData;
}

/**
 * Iterates through a form group's controls and returns a sparse object with only the changed values.
 * @param form - The form group to iterate through
 * @param compareData - The object to compare the form's values to
 * @returns - A sparse object with only the changed values
 * @example sparseFormData<UserCreate>(this.userForm, initUser)
 */
export function sparseFormData<T>(form: FormGroup, compareData: T): T {
  const sparseFormData: T = {} as T;
  for (const key in form.controls) {
    if (Object.prototype.hasOwnProperty.call(form.controls, key)) {
      const control = form.controls[key];
      const controlValue = control.value;
      const compareValue = compareData[key as keyof T];
      if (controlValue !== compareValue) {
        sparseFormData[key as keyof T] = controlValue as T[keyof T];
      }
    }
  }
  return sparseFormData;
}

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
