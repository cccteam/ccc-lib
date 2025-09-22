import { computed, Directive, inject, Injector, input, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataType, FieldElement, FieldMeta, Meta, RecordData, RESOURCE_META, RPCFieldMeta } from '@cccteam/ccc-lib/src/types';
import { ResourceCacheService } from '../resource-cache.service';
import { isUUID } from '../resources-helpers';

/*
 * Base class for all resource input components.
 */
@Directive()
export abstract class BaseInputComponent {
  injector = inject(Injector);
  cache = inject(ResourceCacheService);
  resourceMeta = inject(RESOURCE_META);

  meta = input.required<Meta>();
  pristineValue = input<DataType | null>();
  editMode = input.required<'edit' | 'view'>();
  showField = input<boolean>();
  fieldConfig = input.required<FieldElement>();
  fieldClass = input<string>();
  fieldMeta = input.required<FieldMeta | RPCFieldMeta>();
  form = input.required<FormGroup>();
  relatedData = input<RecordData>();

  /**
   * Resets the field back to its pristine value.
   */
  reset(): void {
    const control = this.form().get(this.fieldConfig().name as string);
    if (control) {
      control.setValue(this.pristineValue());
      control.markAsPristine();
    }
  }

  prefixString = computed(() => {
    const relatedData = this.relatedData();

    let builtPrefix = '';
    this.fieldConfig().prefixes.forEach((prefix) => {
      if (typeof prefix === 'string') {
        builtPrefix += prefix;
      } else if ('resource' in prefix) {
        if (!relatedData || !relatedData[prefix.id]) return;
        const id = relatedData[prefix.id];
        if (typeof id !== 'string') return;
        if (!id || !isUUID(id)) return;
        const prefixResourceMeta = this.resourceMeta(prefix.resource);
        const resource = this.cache
          .registerView(signal(prefixResourceMeta.route), signal(prefix.resource), signal(id))
          ?.value();
        if (resource && prefix.field in resource) {
          builtPrefix += resource[prefix.field];
        }
      } else if ('field' in prefix) {
        if (relatedData) {
          const fieldValue = relatedData[prefix.field];
          builtPrefix += fieldValue ? fieldValue : '';
        }
      }
    });
    return builtPrefix;
  });

  suffixString = computed(() => {
    const relatedData = this.relatedData();

    let builtSuffix = '';
    this.fieldConfig().suffixes.forEach((suffix) => {
      if (typeof suffix === 'string') {
        builtSuffix += suffix;
      } else if ('resource' in suffix) {
        if (!relatedData || !relatedData[suffix.id]) return;
        const id = relatedData[suffix.id];
        if (typeof id !== 'string') return;
        if (!id || !isUUID(id)) return;
        const suffixResourceMeta = this.resourceMeta(suffix.resource);
        const resource = this.cache
          .registerView(signal(suffixResourceMeta.route), signal(suffix.resource), signal(id))
          ?.value();
        if (resource && suffix.field in resource) {
          builtSuffix += resource[suffix.field];
        }
      } else if ('field' in suffix) {
        if (relatedData) {
          const fieldValue = relatedData[suffix.field];
          builtSuffix += fieldValue ? fieldValue : '';
        }
      }
    });
    return builtSuffix;
  });

  floatLabel = computed(() => {
    if (this.fieldConfig().prefixes.length > 0 || this.fieldConfig().suffixes.length > 0) {
      return 'always';
    } else {
      return 'auto';
    }
  });
}
