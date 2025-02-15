import { FormArray, FormGroup } from '@angular/forms';
import { isEqual } from 'lodash-es';

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
