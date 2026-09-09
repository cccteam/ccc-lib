import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
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
  FieldElement,
  RecordData,
  Resource,
  RootConfig,
} from '@cccteam/ccc-lib/types';
import { concatFunctions, hyphenConcat } from '../../../concat-fns';
import { isSubsequence } from '../../../resources-helpers';
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

  /** Live form values, needed when overrideResource is a function of the record being edited. */
  formDataState = input<RecordData>();

  query = signal('');

  resource = computed(() => {
    const overrideResource = this.fieldConfig()?.enumeratedConfig?.overrideResource;
    if (typeof overrideResource === 'function') {
      try {
        return overrideResource(this.formDataState() || {});
      } catch (e) {
        console.error('Failed to resolve overrideResource for field: ', this.fieldConfig().name);
        console.error(e);
        return '' as Resource;
      }
    }

    if (overrideResource) {
      return overrideResource;
    }

    return this.fieldMeta()?.enumeratedResource as Resource;
  });

  tooltipMessage = computed(() => {
    const label = this.fieldConfig().label;
    return 'View ' + label + ' details';
  });

  route = computed(() => {
    const resource = this.resource();
    if (!resource) {
      return undefined;
    }

    return this.resourceMeta(resource)?.route;
  });

  /**
   * True when the options resource has no read handler, so a single record cannot be fetched by
   * id. Computed resources listing data from another service are the common case. The current
   * value's display text comes from the option list instead.
   */
  private readDisabled = computed(() => {
    const resource = this.resource();
    if (!resource) {
      return false;
    }

    return this.resourceMeta(resource)?.readDisabled === true;
  });

  viewDetails = computed(() => {
    return this.editMode() === 'view' && this.fieldConfig().enumeratedConfig.viewDetails === true && !!this.route();
  });

  sorts = computed(() => {
    return this.fieldConfig().enumeratedConfig.sorts;
  });

  /**
   * The columns the option list needs: the id it stores plus whatever the display concatenates.
   * Asking for them explicitly matters because a resource whose fields carry no read permission
   * of their own, a computed resource fetching from another service, say, answers a request with
   * no columns parameter with one empty object per record.
   */
  private columns = computed(() => {
    const config = this.fieldConfig().enumeratedConfig;

    return [...new Set<string>(['id', ...config.listDisplay, ...config.viewDisplay])];
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
    if (this.showField() === false) return undefined;
    const resource = this.resource();
    if (!resource) return undefined;
    const enumeratedMeta = this.resourceMeta(resource);
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
      // The typed query is deliberately not sent: the resource API rejects any query parameter
      // it does not recognize, and SearchTokens is not one of them, so a search request comes
      // back 400. Options are fetched once and narrowed in matchQuery instead.
      signal(''),
      this.sorts,
      signal(config.limit),
    );
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

    const [option] = this.singleEnumValue() || [];
    if (option === undefined) {
      return defaultEmptyFieldValue;
    }

    return option.display;
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

  /** Every option the list endpoint returned, before the search query narrows them. */
  private allEnumOptions = computed(() => {
    const records = this.enumResourceRef()?.value();
    if (!records) return [];
    return records.map((record) => this.toEnumerated(record as Record<string, string>, this.fieldConfig()));
  });

  singleEnumValue = computed(() => {
    if (this.showField() === false) return undefined;
    const currentValue = this.form().get(this.fieldConfig().name)?.value;
    if (!currentValue) return [];

    const record = this.singleEnumResourceRef()?.value();
    if (record) {
      return [this.toEnumerated(record as Record<string, string>, this.fieldConfig())];
    }

    // With no read handler to fetch the record by id, the display text comes from the option
    // list. A value that isn't in the list, an id entered by hand, displays as itself.
    if (this.readDisabled()) {
      const option = this.allEnumOptions().find((o) => o.id === currentValue);
      return [option || { id: String(currentValue), display: String(currentValue) }];
    }

    return [];
  });

  listEnumValues = computed(() => {
    if (this.showField() === false) return [];
    const currentValue = this.singleEnumValue();
    const options = this.allEnumOptions();
    if (!options.length) return currentValue || [];
    return this.matchQuery(options);
  });

  availableEnumOptions = computed(() => {
    const editMode = this.editMode() === 'edit';
    const options = editMode ? this.listEnumValues() : this.singleEnumValue();
    const meta = this.fieldMeta();
    const metaRequired = 'required' in meta && meta.required;

    if (editMode && !this.hasRequiredValidator() && options && options.length > 0 && !metaRequired) {
      return [{ id: null, display: defaultEmptyFieldValue }, ...options];
    }

    return options;
  });

  private previousResource: Resource | undefined = undefined;

  constructor() {
    super();

    // When the options resource is chosen from other fields, a value picked out of the old
    // resource identifies nothing in the new one, so it is cleared instead of being saved.
    effect(() => {
      const resource = this.resource();
      const editing = this.editMode() === 'edit';

      if (typeof this.fieldConfig()?.enumeratedConfig?.overrideResource !== 'function') {
        return;
      }

      const previousResource = this.previousResource;
      this.previousResource = resource;

      // A falsy previous resource means the fields it depends on had not loaded yet, which is
      // not a change the user made.
      if (!editing || !previousResource || previousResource === resource) {
        return;
      }

      untracked(() => {
        const control = this.form().get(this.fieldConfig().name);
        if (!control?.value) {
          return;
        }

        control.setValue(null);
        this.query.set('');
      });
    });
  }

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
      // An id with no matching option displays as itself rather than blanking the field.
      if (!option) return value;

      return option['display'] || (option.id !== null ? this.formatDisplay(option) : '');
    }

    return value['display'] || this.formatDisplay(value);
  };

  private formatDisplay(resource: Record<string, string>): string {
    return this.toEnumerated(resource, this.fieldConfig()).display;
  }

  /**
   * Narrows the fetched options to those matching what was typed. Display text matches as an
   * ordered subsequence, so "getsep" finds "Get Readi September", and ids match on substring so
   * one can be pasted in.
   */
  private matchQuery(options: { id: string; display: string }[]): { id: string; display: string }[] {
    const query = this.query().trim().toLowerCase();
    if (!query) return options;

    return options.filter(
      (option) =>
        isSubsequence(query, (option.display || '').toLowerCase()) || (option.id || '').toLowerCase().includes(query),
    );
  }

  search(value: string): void {
    this.query.set(value);
  }

  select(value: string): void {
    this.form().patchValue({ [this.fieldConfig().name]: value });
    this.form().markAsDirty();
    this.form().markAsTouched();
    this.query.set('');
    this.reloadSignal.update((prev) => !prev);
  }
}
