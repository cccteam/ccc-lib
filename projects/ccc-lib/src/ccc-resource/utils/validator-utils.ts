import { ValidatorFn } from '@angular/forms';
import { ResourceValidatorFn } from '@cccteam/ccc-lib/src/types';

export function createResourceValidator(validator: ValidatorFn): ResourceValidatorFn {
  return validator as ResourceValidatorFn;
}