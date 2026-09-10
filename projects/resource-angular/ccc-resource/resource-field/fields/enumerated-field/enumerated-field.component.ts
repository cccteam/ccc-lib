import { ChangeDetectionStrategy, Component, computed, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  defaultEmptyFieldValue,
  EnumeratedConfig,
  EnumerationOption,
  FieldElement,
  Resource,
  RootConfig,
} from '@cccteam/resource-angular/types';
import { concatFunctions, hyphenConcat } from '../../../concat-fns';
import { BaseInputComponent } from '../../base-field.directive';
import { displayFromOptions, matchOptions, optionColumns, PickerOption } from './enumerated-options';

/**
 * The picker for a field that holds another resource's identifier. Which resource it
 * lists is the generated metadata's statement alone: `enumeratedResource` names the
 * resource (a field-scope @enumerate, or the schema's foreign key), or `enumeration`
 * carries a fixed value set the picker renders with no request. The configuration
 * narrows and presents those rows — `filter`, `sorts`, the display columns — and never
 * chooses another resource.
 */
@Component({
  selector: 'ccc-enumerated-field',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
    MatAutocompleteModule,
  ],
  templateUrl: './enumerated-field.component.html',
  styleUrl: './enumerated-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnumeratedFieldComponent extends BaseInputComponent {
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  reloadSignal = signal(false);

  query = signal('');

  /**
   * The fixed value set the metadata carries for a field naming an @enumerate table.
   * When present the picker renders from it and never lists a resource: the values are
   * the program's constants, so there is nothing to fetch and no List grant to hold.
   */
  enumeration = computed((): EnumerationOption[] | undefined => {
    const meta = this.fieldMeta();
    return meta && 'enumeration' in meta ? meta.enumeration : undefined;
  });

  /** The resource whose rows the picker lists, as the metadata names it; none for a fixed enumeration. */
  resource = computed(() => {
    if (this.enumeration()) {
      return undefined;
    }
    return this.fieldMeta()?.enumeratedResource as Resource;
  });

  tooltipMessage = computed(() => {
    const label = this.fieldConfig().label;
    return 'View ' + label + ' details';
  });

  route = computed(() => {
    const resource = this.resource();
    return resource ? this.resourceMeta(resource)?.route : '';
  });

  /**
   * True when the listed resource has no read handler, so a single record cannot be
   * fetched by id — a computed catalog served from Go, say. The current value's display
   * then resolves from the option list instead.
   */
  private readDisabled = computed(() => {
    const resource = this.resource();
    return resource ? this.resourceMeta(resource)?.readDisabled === true : false;
  });

  viewDetails = computed(() => {
    return this.editMode() === 'view' && this.fieldConfig().enumeratedConfig.viewDetails === true;
  });

  sorts = computed(() => {
    return this.fieldConfig().enumeratedConfig.sorts;
  });

  /** The columns the option list asks for: the id plus whatever the display concatenates. */
  private columns = computed(() => optionColumns(this.fieldConfig().enumeratedConfig));

  singleEnumResourceRef = computed(() => {
    this.editMode();
    if (this.showField() === false) {
      return undefined;
    }

    const route = this.route();
    const resource = this.resource();

    this.reloadSignal();
    const fieldValue = this.form().get(this.fieldConfig().name)?.value;

    if (fieldValue && route && resource && !this.readDisabled()) {
      return untracked(() => this.store.resourceView(signal(route), signal(fieldValue)));
    }
    return undefined;
  });

  rootResourceRef = computed(() => {
    const rootConfig = this.activatedRoute.snapshot.data['config'] as RootConfig;
    const uuid = (this.activatedRoute.snapshot.params['uuid'] || '') as string;
    const rootMeta = this.resourceMeta(rootConfig.parentConfig.primaryResource);
    return this.store.resourceView(signal(rootMeta.route), signal(uuid));
  });

  enumResourceRef = computed(() => {
    if (this.showField() === false || !this.resource()) return undefined;
    const enumeratedMeta = this.resourceMeta(this.resource() as Resource);
    const config = this.fieldConfig().enumeratedConfig;
    const filter =
      config.filterType === 'rootResource'
        ? config?.filter?.(this.rootResourceRef()?.value() || {})
        : config?.filter?.(this.relatedData() || {});
    return this.store.resourceList(
      signal(enumeratedMeta.route),
      signal(filter),
      this.columns,
      signal(config.disableCacheForFilterPii),
      this.sorts,
    );
  });

  /** Every option the listed resource answered, in the mode's display. */
  private allEnumOptions = computed((): PickerOption[] => {
    const records = this.enumResourceRef()?.value();
    if (!records || !records.length) return [];
    return records.map((record) => this.toEnumerated(record as Record<string, string>, this.fieldConfig()));
  });

  singleEnumDisplayText = computed(() => {
    const showField = this.showField();
    if (showField === false) {
      return undefined;
    }

    const form = this.form();
    const fieldConfig = this.fieldConfig();
    if (form === undefined || fieldConfig === undefined) {
      return defaultEmptyFieldValue;
    }
    const value = form.get(fieldConfig.name)?.value as string | null | undefined;
    const fixed = this.enumeration();
    if (fixed) {
      return fixed.find((option) => option.id === value)?.display ?? defaultEmptyFieldValue;
    }
    // With no read handler to fetch the record by id, the display comes from the
    // option list; a value the list does not hold shows as itself.
    if (this.readDisabled()) {
      return value ? displayFromOptions(this.allEnumOptions(), value).display : defaultEmptyFieldValue;
    }
    const singleEnumResourceRef = this.singleEnumResourceRef();
    if (singleEnumResourceRef === undefined) {
      return defaultEmptyFieldValue;
    }

    const record = singleEnumResourceRef.value();
    if (record === undefined) {
      return defaultEmptyFieldValue;
    }

    const enumeratedValues = this.toEnumerated(record as Record<string, string>, fieldConfig);
    return enumeratedValues.display;
  });

  hasRequiredValidator = computed(() => {
    const form = this.form();
    const fieldConfig = this.fieldConfig();

    if (form === undefined || fieldConfig === undefined) {
      return false;
    }

    const control = form.get(fieldConfig.name);
    if (!control) {
      return false;
    }

    return control.hasValidator(Validators.required);
  });

  singleEnumValue = computed((): PickerOption[] | undefined => {
    if (this.showField() === false) return undefined;
    const currentValue = this.form().get(this.fieldConfig().name)?.value;
    const fixed = this.enumeration();
    if (fixed) {
      return fixed.filter((option) => option.id === currentValue).map(toOption);
    }
    if (!currentValue) return [];
    if (this.readDisabled()) {
      return [displayFromOptions(this.allEnumOptions(), String(currentValue))];
    }
    const record = this.singleEnumResourceRef()?.value();
    if (!record) return [];
    return [this.toEnumerated(record as Record<string, string>, this.fieldConfig())];
  });

  listEnumValues = computed((): PickerOption[] => {
    if (this.showField() === false) return [];
    const fixed = this.enumeration();
    if (fixed) {
      return fixed.map(toOption);
    }
    const options = this.allEnumOptions();
    if (!options.length) return this.singleEnumValue() || [];
    return options;
  });

  // The searchable autocomplete narrows the loaded options client-side, by display text
  // or by id (so an identifier can be pasted); the server has no substring search.
  availableEnumOptions = computed(() => {
    const editMode = this.editMode() === 'edit';
    const loaded = editMode ? this.listEnumValues() : this.singleEnumValue();
    const options = editMode && loaded ? matchOptions(loaded, this.query()) : loaded;
    const meta = this.fieldMeta();
    const metaRequired = 'required' in meta && meta.required;

    if (editMode && !this.hasRequiredValidator() && options && options.length > 0 && !metaRequired) {
      return [{ id: null, display: defaultEmptyFieldValue }, ...options];
    }

    return options;
  });

  toEnumerated(resource: Record<string, string>, element: FieldElement): PickerOption {
    const enumeratedConfig = element.enumeratedConfig as EnumeratedConfig;
    const displayFields =
      this.editMode() === 'edit' && enumeratedConfig.listDisplay.length > 0
        ? enumeratedConfig.listDisplay
        : enumeratedConfig.viewDisplay;
    const concat =
      this.editMode() === 'edit'
        ? enumeratedConfig.listConcatFn || enumeratedConfig.viewConcatFn
        : enumeratedConfig.viewConcatFn;

    const concatFunction = concatFunctions[concat] || hyphenConcat;

    return {
      id: resource['id'] ?? '',
      display: concatFunction(resource, ...displayFields),
    };
  }

  getDisplayText = (value: string | Record<string, string> | null): string => {
    if (!value) return '';

    if (typeof value === 'string') {
      const option = this.availableEnumOptions()?.find((o) => o.id === value);
      // An id with no matching option displays as itself rather than blanking the field.
      return option ? option.display : value;
    }

    return value['display'] || this.formatDisplay(value);
  };

  private formatDisplay(resource: Record<string, string>): string {
    return this.toEnumerated(resource, this.fieldConfig()).display;
  }

  search(value: string): void {
    this.query.set(value);
  }

  select(value: string): void {
    this.form().patchValue({ [this.fieldConfig().name]: value });
    this.form().markAsDirty();
    this.form().markAsTouched();
    this.reloadSignal.update((prev) => !prev);
  }
}

/** A fixed enumeration value in the shape the option list and display helpers share. */
function toOption(option: EnumerationOption): PickerOption {
  return { id: option.id, display: option.display };
}
