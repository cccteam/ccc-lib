import { FormArray, FormGroup } from '@angular/forms';
/**
 * Accepts a FormGroup and compares it to an object to return the dirty form values
 * @param form - FormGroup
 * @param compareData - object to compare form values against
 * @returns Partial<T>
 * @example dirtyFormData<UserCreate>(this.userForm, initUser)
 */
export declare function dirtyFormData<T>(form: FormGroup, compareData: T): T;
/**
 * Accepts a FormArray and removes empty strings
 * @param formArray - FormArray
 * @returns FormArray
 */
export declare function cleanStringFormArray(formArray: FormArray): FormArray;
