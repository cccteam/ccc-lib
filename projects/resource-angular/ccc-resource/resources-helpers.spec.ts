import { FormControl } from '@angular/forms';
import { FieldMeta } from '@cccteam/resource';

import { maxLengthValidator } from './resources-helpers';

describe('maxLengthValidator', () => {
  const field = (overrides: Partial<FieldMeta>): FieldMeta => ({
    fieldName: 'registry',
    displayType: 'string',
    required: true,
    isIndex: false,
    ...overrides,
  });

  it('adds nothing for a field without a limit', () => {
    expect(maxLengthValidator(field({}))).toBeUndefined();
  });

  it('adds nothing for a string array, whose limit is per element', () => {
    expect(maxLengthValidator(field({ displayType: 'string[]', maxLength: 4 }))).toBeUndefined();
  });

  it('refuses a value over the limit and names the lengths', () => {
    const validator = maxLengthValidator(field({ maxLength: 16 }));
    expect(validator).toBeDefined();

    const control = new FormControl('LS-REGISTRY-00017');
    expect(validator!(control)).toEqual({ maxlength: { requiredLength: 16, actualLength: 17 } });
  });

  it('accepts a value at the limit', () => {
    const validator = maxLengthValidator(field({ maxLength: 16 }));

    expect(validator!(new FormControl('LS-REGISTRY-0016'))).toBeNull();
  });

  it('accepts an empty value, leaving required to say whether one is needed', () => {
    const validator = maxLengthValidator(field({ maxLength: 16 }));

    expect(validator!(new FormControl(''))).toBeNull();
    expect(validator!(new FormControl(null))).toBeNull();
  });

  it('applies to a picker over a sized key column', () => {
    const validator = maxLengthValidator(field({ displayType: 'enumerated', maxLength: 64 }));

    expect(validator).toBeDefined();
    expect(validator!(new FormControl('courier'))).toBeNull();
  });
});
