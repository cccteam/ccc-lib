import { FormArray, FormGroup } from '@angular/forms';
import { isEqual } from 'lodash-es';

/**
 * Compares two objects and returns a sparse object containing only the differing key-value pairs
 * @param data - object to compare
 * @param compareData - object to compare against
 * @returns Partial<T>
 * @example sparseData<UserCreate>(this.user, initUser)
 */
export function sparseData<T extends Record<string, any>>(data: T,  compareData: T): Partial<T> {
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
 * Accepts a FormGroup and compares it to an object to return the dirty form values
 * as a sparse object
 * @param form - FormGroup
 * @param compareData - object to compare form values against
 * @returns Partial<T>
 * @example sparseFormData<UserCreate>(this.userForm, initUser)
 */
export function sparseFormData<T>(form: FormGroup, compareData: T): T {
  const sparseFormData: T = {} as T;

  for (const [key, control] of Object.entries(form.controls)) {
    const controlValue = control.value;
    const compareValue = compareData[key as keyof T];

    if (!isEqual(controlValue, compareValue)) {
      sparseFormData[key as keyof T] = controlValue as T[keyof T];
    }
  }

  return sparseFormData;
}

/**
 * Accepts a FormArray and removes empty strings
 * @param formArray - FormArray
 * @returns FormArray
 */
export function cleanStringFormArray(formArray: FormArray): FormArray {
  for (let i = formArray.controls.length - 1; i >= 0; i--) {
    if (formArray.at(i).value === '') {
      formArray.removeAt(i);
    }
  }
  return formArray;
}
