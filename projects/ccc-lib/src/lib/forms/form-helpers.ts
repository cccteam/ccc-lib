import { FormArray, FormGroup } from '@angular/forms';

/**
 * Accepts a FormGroup and compares it to an object to return the dirty form values
 * @param form - FormGroup
 * @param compareData - object to compare form values against
 * @returns Partial<T>
 * @example dirtyFormData<UserCreate>(this.userForm, initUser)
 */
export function dirtyFormData<T>(form: FormGroup, compareData: T): T {
  const dirtyFormData: T = {} as T;

  for (const [key, control] of Object.entries(form.controls)) {
    const controlValue = control.value;
    const compareValue = compareData[key as keyof T];

    if (Array.isArray(controlValue)) {
      if (!Array.isArray(compareValue)) {
        dirtyFormData[key as keyof T] = controlValue as T[keyof T];
        continue;
      }

      const diff = controlValue.filter((value) => !compareValue.includes(value));
      if (diff.length > 0) {
        dirtyFormData[key as keyof T] = controlValue as T[keyof T];
      }
      continue;
    }

    if (controlValue !== compareValue) {
      dirtyFormData[key as keyof T] = controlValue as T[keyof T];
    }
  }

  return dirtyFormData;
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
