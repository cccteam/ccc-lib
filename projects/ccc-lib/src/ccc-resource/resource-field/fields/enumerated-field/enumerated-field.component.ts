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
import { defaultEmptyFieldValue, EnumeratedConfig, FieldElement, Resource, RootConfig } from '@cccteam/ccc-lib/src/types';
import { concatFunctions, hyphenConcat } from '../../../../ccc-resource/concat-fns';
import { BaseInputComponent } from '../../base-field.directive';

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

  resource = computed(() => {
    if (this.fieldConfig()?.enumeratedConfig?.overrideResource) {
      return this.fieldConfig()?.enumeratedConfig?.overrideResource;
    }
    return this.fieldMeta()?.enumeratedResource as Resource;
  });

  tooltipMessage = computed(() => {
    const label = this.fieldConfig().label;
    return 'View ' + label + ' details';
  });

  route = computed(() => {
    const resource = this.fieldMeta()?.enumeratedResource;
    return this.resourceMeta(resource as Resource)?.route;
  });

  viewDetails = computed(() => {
    return this.editMode() === 'view' && this.fieldConfig().enumeratedConfig.viewDetails === true;
  });

  sorts = computed(() => {
    return this.fieldConfig().enumeratedConfig.sorts;
  });

  singleEnumResourceRef = computed(() => {
    this.editMode();
    if (this.showField() === false) {
      return undefined;
    }

    const route = this.route();
    const resource = this.resource();

    this.reloadSignal();
    const fieldValue = this.form().get(this.fieldConfig().name)?.value;

    if (fieldValue && route && resource) {
      return untracked(() => this.store.resourceView(this.route, signal(fieldValue)));
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
    if (this.showField() === false) return undefined;
    const enumeratedMeta = this.resourceMeta(this.resource() as Resource);
    const config = this.fieldConfig().enumeratedConfig;
    const filter =
      config.filterType === 'rootResource'
        ? config?.filter?.(this.rootResourceRef()?.value() || {})
        : config?.filter?.(this.relatedData() || {});
    return this.store.resourceList(
      signal(enumeratedMeta.route),
      signal(filter),
      signal([]),
      signal(config.disableCacheForFilterPii),
      this.query,
      this.sorts,
    );
  });

  singleEnumDisplayText = computed(() => {
    const showField = this.showField();
    if (showField === false) {
      return undefined;
    }

    const form = this.form();
    const fieldConfig = this.fieldConfig();
    const singleEnumResourceRef = this.singleEnumResourceRef();

    if (form === undefined || fieldConfig === undefined || singleEnumResourceRef === undefined) {
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

  singleEnumValue = computed(() => {
    if (this.showField() === false) return undefined;
    const currentValue = this.form().get(this.fieldConfig().name)?.value;
    const record = this.singleEnumResourceRef()?.value();
    if (!currentValue) return [];
    if (!record) return [];
    return [this.toEnumerated(record as Record<string, string>, this.fieldConfig())];
  });

  listEnumValues = computed(() => {
    if (this.showField() === false) return [];
    const currentValue = this.singleEnumValue();
    const records = this.enumResourceRef()?.value();
    if (!records || !records.length) return currentValue || [];
    return records.map((record) => this.toEnumerated(record as Record<string, string>, this.fieldConfig()));
  });

  availableEnumOptions = computed(() => {
    if (this.editMode() === 'edit') {
      return this.listEnumValues();
    }
    return this.singleEnumValue();
  });

  toEnumerated(resource: Record<string, string>, element: FieldElement): { id: string; display: string } {
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
      return option ? option['display'] || this.formatDisplay(option) : '';
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
