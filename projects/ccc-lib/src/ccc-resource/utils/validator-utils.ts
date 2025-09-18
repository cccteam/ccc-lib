import { ValidatorFn } from '@angular/forms';
import { ResourceValidatorFn } from '../../types';

export function createResourceValidator(validator: ValidatorFn): ResourceValidatorFn {
  return validator as ResourceValidatorFn;
}