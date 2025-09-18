import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { isDate } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { isNumber } from 'lodash-es';
import { ConfigElement, ResourceValidatorFn } from '../types';
import { createResourceValidator } from './resources-helpers';

export const maxConfigElementRecursionDepth = 240;
export const maxLayoutNestingDepth = 48;

/** Returns a flat array of nested elements by recursively traversing
 * through the elements graph */
export const flattenElements: (elements: ConfigElement[], depth?: number) => ConfigElement[] = (
  elements: ConfigElement[],
  depth = 0,
) => {
  depth++;
  if (!elements || elements.length === 0 || depth > maxConfigElementRecursionDepth) {
    return [];
  }
  return elements.reduce((acc, element) => {
    if (element.type === 'section') {
      return acc.concat(element, flattenElements(element.children, depth));
    }
    return acc.concat(element);
  }, [] as ConfigElement[]);
};

export const civildateCoercion = (value: string): Date => {
  if (value === undefined || value === '') {
    return new Date(value);
  }
  return new Date(formatInTimeZone(new Date(value), 'UTC', 'yyyy-MM-dd HH:mm:ss'));
};

const currentOrFutureDateValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null; // Let "REQUIRED" validator handle empty values
  }

  if (!isDate(control.value)) {
    return { errorMsg: 'Value must be a valid date' };
  }

  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate >= today) {
    return null;
  }

  return { errorMsg: 'Date must be greater than or equal to the current date' };
};

const positiveNumberValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value && control.value !== 0) {
    return null; // Let "REQUIRED" validator handle "empty" values
  }

  if (isNumber(control.value) && control.value > 0) {
    return null;
  }

  return { errorMsg: 'Value must be a positive number' };
};

/**
 * This object stores every possible validator used across the application
 * Add all validators that are used in configs to this object
 *
 * Available validators that may be added: min, max, required, requiredTrue,
 *    email, minLength, maxLength, pattern, nullValidator
 */
export const resourceValidators = Object.freeze({
  REQUIRED: createResourceValidator(Validators.required),
  EMAIL: createResourceValidator(Validators.email),
  CURRENT_OR_FUTURE_DATE: createResourceValidator(currentOrFutureDateValidator),
  POSITIVE_NUMBER: createResourceValidator(positiveNumberValidator),

  // Add any additional validators here. They may be defined in
  // a different file if they are too large. E.g.:
  // MIN_LENGTH_3: createResourceValidator(Validators.minLength(3)),
});

export const validatorsPresent = (control: AbstractControl, validatorResources: ResourceValidatorFn[]): boolean => {
  return validatorResources.every((validator) => control.hasValidator(validator));
};
