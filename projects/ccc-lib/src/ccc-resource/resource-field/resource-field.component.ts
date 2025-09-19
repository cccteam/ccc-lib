import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostBinding,
  input,
  Signal,
  untracked,
} from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataType, FieldElement, FieldMeta, Meta, RecordData, ValidDisplayTypes } from '@cccteam/ccc-lib/src/types';
import { EmptyReadonlyFieldComponent } from '../empty-readonly-field/empty-readonly-field.component';
import { validatorsPresent } from '../gui-constants';
import { BooleanFieldComponent } from './fields/boolean-field/boolean-field.component';
import { DateFieldComponent } from './fields/date-field/date-field.component';
import { EnumeratedFieldComponent } from './fields/enumerated-field/enumerated-field.component';
import { NullBooleanFieldComponent } from './fields/nullboolean-field/nullboolean-field.component';
import { NumberFieldComponent } from './fields/number-field/number-field.component';
import { TextFieldComponent } from './fields/text-field/text-field.component';

@Component({
  selector: 'ccc-resource-field',
  imports: [
    DateFieldComponent,
    BooleanFieldComponent,
    TextFieldComponent,
    NumberFieldComponent,
    EnumeratedFieldComponent,
    MatFormFieldModule,
    EmptyReadonlyFieldComponent,
    NullBooleanFieldComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './resource-field.component.html',
  styleUrl: './resource-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFieldComponent {
  fieldConfig = input.required<FieldElement>();
  meta = input.required<Meta>();
  fieldClass = input<string>();
  editMode = input<'edit' | 'view'>('edit');
  form = input.required<FormGroup>();
  formDataState = input<RecordData>();
  pristineValue = input<DataType | null>();
  data = input<RecordData>();
  previouslyNulled: boolean | null = null;

  fieldMeta: Signal<FieldMeta> = computed(() => {
    return (
      (this.meta().fields?.find((field) => field.fieldName === this.fieldConfig().name) as FieldMeta) ||
      ({} as FieldMeta)
    );
  });

  mode = computed(() => {
    if (this.fieldConfig().readOnly) {
      return 'view';
    }
    return this.editMode();
  });

  showField = computed(() => {
    const shouldRender = this.fieldConfig().shouldRender;
    const conditionallyNull = this.fieldConfig().nullIfConditionallyHidden;
    const isForeignKeyDefault = this.fieldConfig().default?.type === 'foreignKey';

    if (typeof shouldRender === 'boolean') {
      return shouldRender && !isForeignKeyDefault;
    }
    const formValues = this.formDataState();
    if (!formValues) {
      return true;
    }

    console.debug('Field: ', this.fieldConfig().name, ' | Values to be used in showField calculation ', formValues);

    try {
      const showField = shouldRender(formValues) && !isForeignKeyDefault;

      if (!conditionallyNull) {
        return showField;
      }

      const formControlName = this.fieldConfig()?.name;
      const control = this.form()?.controls[formControlName];
      const pristineFieldValue = this.data()?.[formControlName];
      const previouslyNulled = this.previouslyNulled;

      untracked(() => {
        if (!showField && !previouslyNulled) {
          this.previouslyNulled = true;
          control?.setValue(null);
        }

        if (showField && previouslyNulled) {
          this.previouslyNulled = false;
          control?.setValue(pristineFieldValue);
        }
      });

      return showField;
    } catch (e) {
      console.error('Failed to calculate value for should Render function for field: ', this.fieldConfig().name);
      console.error(e);
      return true;
    }
  });

  showEmptyField = computed(() => {
    const editMode = this.mode();
    const showField = this.showField();

    if (!showField || editMode === 'edit') {
      return false;
    }

    const form = this.form();
    const config = this.fieldConfig();
    const meta = this.fieldMeta();
    if (form === undefined || config === undefined || meta === undefined) {
      return false;
    }

    if (meta.displayType === 'nullboolean') {
      return false;
    }

    const value = form.get(config.name)?.value;
    // TODO: In phase 3 of visual updates, allow control of which
    // values can trigger the empty field display on a per field basis
    if (value === null || value === '') {
      return true;
    }

    return false;
  });

  @HostBinding('class') class = '';

  booleanEditDisplayType: Signal<BooleanDisplayTypes> = computed(() => {
    const fieldConfig = this.fieldConfig();
    const fieldMeta = this.fieldMeta();
    const form = this.form();

    if (fieldConfig === undefined || fieldMeta === undefined || form === undefined) {
      return 'boolean';
    }

    const control = form.get(fieldConfig.name);
    if (control === null) {
      console.warn("Unable to find control for field '" + fieldConfig.name + "' to determine boolean display type");
      return 'boolean';
    }

    // Frontend forcing users to make a choice displays nullboolean to
    // trigger form validation - users must interact and explicitly
    // choose a true or false value
    if (control.hasValidator(Validators.required) || fieldMeta.displayType === 'nullboolean') {
      return 'nullboolean';
    }

    return 'boolean';
  });

  constructor() {
    effect(() => {
      this.class = this.showField() ? 'col-' + this.fieldConfig()?.cols : 'hidden-field';
    });

    effect(() => {
      const getValidators = this.fieldConfig().validators;

      if (typeof getValidators !== 'function') {
        return;
      }

      const formValues = this.formDataState();

      if (!formValues) {
        return;
      }

      console.debug('Field: ', this.fieldConfig().name, ' | Values to be used in validators calculation ', formValues);

      try {
        const newValidators = getValidators(formValues);

        const formControlName = this.fieldConfig().name;
        const control = this.form().get(formControlName);

        if (control === null) {
          throw new Error(`Control with name ${this.fieldConfig().name} not found during forceRequired calculation`);
        }

        const addValidators = !validatorsPresent(control, newValidators);

        if (addValidators) {
          control.setValidators(newValidators);
          control.updateValueAndValidity();
        }
      } catch (e) {
        console.error('Failed to calculate value for forceRequired function for field: ', this.fieldConfig().name);
        console.error(e);
        return;
      }
    });
  }
}

type BooleanDisplayTypes = Extract<ValidDisplayTypes, 'boolean' | 'nullboolean'>;
