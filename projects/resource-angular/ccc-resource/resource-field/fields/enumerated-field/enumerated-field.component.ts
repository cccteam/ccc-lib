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
import { pickerSort, readMode } from '@cccteam/resource';
import { concatFunctions, hyphenConcat } from '../../../concat-fns';
import { PagedListRequest } from '../../../paged-list';
import { pageLabel } from '../../../resource-list/list-request';
import { BaseInputComponent } from '../../base-field.directive';
import { displayFromOptions, matchOptions, optionColumns, PickerOption, pickerRefusal, withChosen } from './enumerated-options';

/**
 * The picker for a field that holds another resource's identifier. Which resource it
 * lists is the generated metadata's statement alone: `enumeratedResource` names the
 * resource (a field-scope @enumerate, or the schema's foreign key), or `enumeration`
 * carries a fixed value set the picker renders with no request. The configuration
 * narrows and presents those rows — `filter`, `sorts`, the display columns — and never
 * chooses another resource.
 *
 * How the resource is read is the generated descriptor's statement alone: its declared
 * maximum page size (readMode). A source with no maximum is read whole in one request,
 * the options are every row, and the chosen value's display resolves from that list, so
 * a source with no read route serves. A source with a maximum is paged one server page
 * at a time, Previous and Next by the server's cursors inside the panel, sorted by the
 * configured sorts, else the source's @order, else the display column, and the chosen
 * value is read by key and shown ahead of the page's options, so the control shows what
 * is stored whichever page is open. `searchable` narrows a whole source's options in the
 * browser; a paged source renders the paged panel, since narrowing one page would hide
 * the rest (a server-side search is cccteam/backlog#101). A request the server refuses
 * shows the refusal in its words under the field, never an empty list.
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
   * The listed resource's generated descriptor, which says how it is read. A resource
   * the generated API does not describe (one registered by hand) has none and is read whole.
   */
  private descriptor = computed(() => {
    const resource = this.resource();
    return resource ? this.store.client.descriptor.resources[resource] : undefined;
  });

  /** Whether the source is paged: its descriptor declares a maximum page size. */
  paged = computed(() => {
    const descriptor = this.descriptor();
    return descriptor !== undefined && readMode(descriptor) === 'paged';
  });

  viewDetails = computed(() => {
    return this.editMode() === 'view' && this.fieldConfig().enumeratedConfig.viewDetails === true;
  });

  sorts = computed(() => {
    return this.fieldConfig().enumeratedConfig.sorts;
  });

  /** The columns the option list asks for: the id plus whatever the display concatenates. */
  private columns = computed(() => optionColumns(this.fieldConfig().enumeratedConfig));

  /** The display column shown first: the sort a paged source with no @order pages by. */
  private displayColumn = computed((): string | undefined => {
    const config = this.fieldConfig().enumeratedConfig;
    return config.listDisplay[0] ?? config.viewDisplay[0];
  });

  rootResourceRef = computed(() => {
    const rootConfig = this.activatedRoute.snapshot.data['config'] as RootConfig;
    const uuid = (this.activatedRoute.snapshot.params['uuid'] || '') as string;
    const rootMeta = this.resourceMeta(rootConfig.parentConfig.primaryResource);
    return this.store.resourceView(signal(rootMeta.route), signal(uuid));
  });

  /** The configured filter over the options, evaluated against the root or the parent row as configured. */
  private optionFilter = computed((): string => {
    const config = this.fieldConfig().enumeratedConfig;
    return (
      (config.filterType === 'rootResource'
        ? config.filter?.(this.rootResourceRef()?.value() || {})
        : config.filter?.(this.relatedData() || {})) ?? ''
    );
  });

  /**
   * The chosen row read by key, on a paged source: the row the field names, whichever
   * page is open. A paged source serves a read; the generator refuses one that does not.
   */
  singleEnumResourceRef = computed(() => {
    this.editMode();
    if (this.showField() === false) {
      return undefined;
    }

    const route = this.route();
    const resource = this.resource();

    this.reloadSignal();
    const fieldValue = this.form().get(this.fieldConfig().name)?.value;

    if (fieldValue && route && resource && this.paged()) {
      return untracked(() => this.store.resourceView(signal(route), signal(fieldValue)));
    }
    return undefined;
  });

  /** Every row of a whole source, read in one request; nothing on a paged source. */
  enumResourceRef = computed(() => {
    if (this.showField() === false || !this.resource() || this.paged()) return undefined;
    const enumeratedMeta = this.resourceMeta(this.resource() as Resource);
    const config = this.fieldConfig().enumeratedConfig;
    return this.store.resourceList(
      signal(enumeratedMeta.route),
      signal(this.optionFilter()),
      this.columns,
      signal(config.disableCacheForFilterPii),
      this.sorts,
    );
  });

  /**
   * The paged source's request while the picker is open for editing: the page the panel
   * shows, in the picker's sort. Nothing in view mode, where the chosen row is read by key.
   */
  private pageRequest = computed((): PagedListRequest | undefined => {
    const descriptor = this.descriptor();
    if (!this.paged() || !descriptor || this.showField() === false || this.editMode() !== 'edit') {
      return undefined;
    }
    const config = this.fieldConfig().enumeratedConfig;
    const configured = config.sorts.map((sort) => ({ field: sort.field as string, direction: sort.direction }));
    return {
      route: this.resourceMeta(this.resource() as Resource).route,
      filter: this.optionFilter(),
      sensitive: config.disableCacheForFilterPii,
      columns: this.columns(),
      sorts: pickerSort<Record<string, unknown>>(descriptor, configured, this.displayColumn()),
    };
  });

  /** The pager over a paged source, following pageRequest; nothing on a whole source. */
  pager = computed(() => (this.paged() ? this.store.resourcePage(this.pageRequest) : undefined));

  /** Every option a whole source answered, in the mode's display. */
  private allEnumOptions = computed((): PickerOption[] => {
    const records = this.enumResourceRef()?.value();
    if (!records || !records.length) return [];
    return records.map((record) => this.toEnumerated(record as Record<string, string>, this.fieldConfig()));
  });

  /** The open page's rows on a paged source, in the mode's display. */
  private pageOptions = computed((): PickerOption[] =>
    (this.pager()?.rows() ?? []).map((record) => this.toEnumerated(record as Record<string, string>, this.fieldConfig())),
  );

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
    // A whole source holds every row in its list: the display comes from there, and a
    // value the list does not hold shows as itself.
    if (!this.paged()) {
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
    if (!this.paged()) {
      return [displayFromOptions(this.allEnumOptions(), String(currentValue))];
    }
    const record = this.singleEnumResourceRef()?.value();
    if (!record || Object.keys(record).length === 0) return [];
    return [this.toEnumerated(record as Record<string, string>, this.fieldConfig())];
  });

  listEnumValues = computed((): PickerOption[] => {
    if (this.showField() === false) return [];
    const fixed = this.enumeration();
    if (fixed) {
      return fixed.map(toOption);
    }
    if (this.paged()) {
      // The page's rows, with the chosen row ahead of them when this page does not hold it.
      return withChosen(this.pageOptions(), this.singleEnumValue()?.[0]);
    }
    const options = this.allEnumOptions();
    if (!options.length) return this.singleEnumValue() || [];
    return options;
  });

  // The searchable autocomplete narrows a whole source's loaded options client-side, by
  // display text or by id (so an identifier can be pasted); the server has no substring
  // search. A paged source renders the paged panel and never narrows here.
  availableEnumOptions = computed(() => {
    const editMode = this.editMode() === 'edit';
    const loaded = editMode ? this.listEnumValues() : this.singleEnumValue();
    const options = editMode && loaded && !this.paged() ? matchOptions(loaded, this.query()) : loaded;
    const meta = this.fieldMeta();
    const metaRequired = 'required' in meta && meta.required;

    if (editMode && !this.hasRequiredValidator() && options && options.length > 0 && !metaRequired) {
      return [{ id: null, display: defaultEmptyFieldValue }, ...options];
    }

    return options;
  });

  /** The pager's label inside a paged picker's panel: this page's range of the total. */
  pagerLabel = computed(() => {
    const pager = this.pager();
    if (!pager) return '';
    const page = pager.page();
    return pageLabel(page.offset, pager.rows().length, page.total);
  });

  /** What the picker says when its request was refused or failed; nothing while it works. */
  refusal = computed((): string | undefined => {
    const pager = this.pager();
    if (pager) {
      return pager.status() === 'error' ? pickerRefusal(pager.error()) : undefined;
    }
    const ref = this.enumResourceRef();
    return ref && ref.status() === 'error' ? pickerRefusal(ref.error()) : undefined;
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
