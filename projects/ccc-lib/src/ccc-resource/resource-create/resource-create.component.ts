import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Data, Router, RouterModule } from '@angular/router';
import { CamelCaseToTitlePipe } from '@cccteam/ccc-lib/src/ccc-camel-case-to-title';
import {
  ChildResourceConfig,
  DataType,
  FieldElement,
  ListViewConfig,
  RecordData,
  Resource,
  RESOURCE_META,
  ResourceMeta,
  RootConfig,
  ViewConfig,
} from '@cccteam/ccc-lib/src/types';
import { NotificationService } from '@cccteam/ccc-lib/src/ui-notification-service';
import { tap } from 'rxjs';
import { FormStateService } from '../form-state.service';
import { flattenElements } from '../gui-constants';
import { CreateOperation } from '../operation-types';
import { ResourceCacheService } from '../resource-cache.service';
import { ResourceLayoutComponent } from '../resource-layout/resource-layout.component';
import { ResourceStore } from '../resource-store.service';
import { cleanStringForm, metadataTypeCoercion } from '../resources-helpers';

@Component({
  selector: 'ccc-resource-create',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    ResourceLayoutComponent,
  ],
  templateUrl: './resource-create.component.html',
  styleUrl: './resource-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResourceStore],
})
export class ResourceCreateComponent implements OnInit {
  activatedRoute = inject(ActivatedRoute);
  notifications = inject(NotificationService);
  store = inject(ResourceStore);
  cache = inject(ResourceCacheService);
  router = inject(Router);
  destroyRef = inject(DestroyRef);
  formState = inject(FormStateService);
  resourceMeta = inject(RESOURCE_META);

  routeData = toSignal<Data>(this.activatedRoute.data);

  isDirty = signal(false);
  submitted = signal<boolean>(false);
  complete = output<boolean>();
  resourceConfig = input<ChildResourceConfig>();
  parentData = input<RecordData>({});
  loadCreatedResource = input<boolean>(false);

  rootConfig = computed(() => {
    return this.activatedRoute.snapshot.data['config'] as RootConfig;
  });

  config = computed(() => {
    const inputConfig = this.resourceConfig() as ViewConfig;
    if (inputConfig !== undefined) {
      return inputConfig;
    }
    return this.rootConfig().parentConfig as ListViewConfig;
  });

  indentTitle = computed(() => {
    if (this.config().collapsible || this.resourceConfig() === undefined) {
      return false;
    }

    return true;
  });

  form = computed(() => {
    const meta = this.store.resourceMeta();
    const fg = new FormGroup({});
    const allElements = flattenElements(this.config().elements);

    for (const field of meta.fields || []) {
      if (fg.get(field.fieldName)) {
        continue;
      }

      let control = new FormControl<DataType>('');
      if (field.displayType === 'boolean') {
        control = new FormControl<boolean>(false);
      }

      const findElement = allElements.find((element) => element.type === 'field' && element.name === field.fieldName);
      const fieldConfig = findElement as FieldElement | undefined;
      if (!fieldConfig) {
        continue;
      }
      const fieldDefault = fieldConfig.default;
      if (field.displayType === 'boolean') {
        const booleanDefaultValue =
          fieldDefault?.type == 'static' && typeof fieldDefault?.value === 'boolean' ? fieldDefault.value : null;
        if (booleanDefaultValue === null) {
          console.error(
            `Default value for boolean field, ${field.fieldName}, is null, add a default value to the config`,
          );
        }
        control = new FormControl<boolean | null>(booleanDefaultValue);
      }

      if (fieldDefault?.type === 'foreignKey' && this.parentData()) {
        const parentValue = this.parentData()[fieldDefault.parentId];
        if (parentValue !== undefined) {
          control.setValue(parentValue);
        }
      } else if (fieldDefault?.type == 'static') {
        const staticDefault = fieldDefault;
        if (staticDefault.value) {
          control.setValue(staticDefault.value);
        }
      }

      if (fieldConfig.validators.length > 0) {
        control.setValidators(fieldConfig.validators);
      }

      if (field.required && !control.hasValidator(Validators.required)) {
        control.setValidators([Validators.required]);
      }
      fg.addControl(field.fieldName, control);
    }
    return fg;
  });

  route = computed(() => {
    const meta = this.store.resourceMeta();
    if (!meta) return '';
    return meta.consolidatedRoute || meta.route;
  });

  primaryKeys = computed(() => {
    const meta = this.store.resourceMeta() as ResourceMeta;
    if (!meta) return [];
    return meta.fields
      .filter((field) => field.primaryKey)
      .sort((a, b) => a.primaryKey!.ordinalPosition - b.primaryKey!.ordinalPosition);
  });

  hasRequiredPrimaryKey = computed(() => {
    const meta = this.store.resourceMeta() as ResourceMeta;
    if (!meta) {
      return false;
    }
    return meta.fields.some((field) => field.primaryKey && field.required);
  });

  primaryKeyPath = computed(() => {
    const meta = this.store.resourceMeta();
    const isConsolidated = meta.consolidatedRoute !== undefined;
    const pathPrefix = isConsolidated ? '/' + meta.route : '';
    const keyPath = this.primaryKeys()
      .map((field) => this.form().get(field.fieldName)?.value)
      .join('/');

    if (keyPath === '' && pathPrefix === '') {
      return '/';
    }

    if (keyPath === '') {
      return pathPrefix;
    }

    return pathPrefix + '/' + keyPath;
  });

  camelCaseToTitlePipe = new CamelCaseToTitlePipe();

  ngOnInit(): void {
    if (this.resourceMeta(this.config().primaryResource as Resource)) {
      this.store.resourceName.set(this.config().primaryResource as Resource);
      this.store.resourceMeta.set(this.resourceMeta(this.config().primaryResource as Resource));
    }
  }

  saveForm(): void {
    if (!this.form().valid) {
      this.submitted.set(true);
      this.form().markAllAsTouched();
      const formElement = document.getElementById('resource-form');
      const invalidField = formElement?.querySelector('.mdc-text-field--invalid');
      if (invalidField) {
        invalidField.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const resourceMeta = this.store.resourceMeta();
    if (!resourceMeta) return;

    const cleanedForm = cleanStringForm<Record<string, string>>(this.form());
    if (cleanedForm === undefined || cleanedForm === null) {
      return;
    }
    const coercedCleanedData = metadataTypeCoercion(cleanedForm, this.store.resourceMeta());

    const cleanedDataWithoutPrimaryKeys = Object.fromEntries(
      Object.entries(coercedCleanedData).filter(
        ([key]) => !this.primaryKeys().some((field) => field.fieldName === key),
      ),
    );

    const createPatch: CreateOperation = {
      op: 'add',
      value: cleanedDataWithoutPrimaryKeys,
      path: this.primaryKeyPath(),
    };

    this.cache
      .createPatch(createPatch, this.route(), this.store.resourceName())
      .pipe(
        tap((response) => {
          this.formState.decrementDirtyForms();

          if (!response) {
            this.complete.emit(true);
            return;
          }
          const navigationRoutes = this.config().createNavigation;
          const createIds = (response[this.store.resourceRoute()] as string[]) || [];
          if (this.loadCreatedResource() && createIds.length === 1) {
            let route = this.rootConfig().routeData.route;
            if (this.parentData() || !route) {
              route = resourceMeta.route;
            }
            if (navigationRoutes.length === 0) {
              this.router.navigate([route, createIds[0]]);
            } else {
              if (createIds[0]) {
                navigationRoutes.push(createIds[0]);
              }
              this.router.navigate(navigationRoutes);
            }
          } else {
            this.complete.emit(true);
          }
        }),
      )
      .subscribe();
  }

  cancelForm(): void {
    if (this.form().dirty) {
      this.formState.decrementDirtyForms();
    }
    this.complete.emit(true);
  }

  constructor() {
    effect(() => {
      console.debug('USAGE | New FormGroup subscription for: ', this.config().title);

      this.form()
        .valueChanges.pipe(
          tap(() => {
            const dirty = this.form().dirty;

            if (dirty !== this.isDirty()) {
              this.isDirty.set(dirty);
              if (dirty) {
                this.formState.incrementDirtyForms();
              } else {
                this.formState.decrementDirtyForms();
              }
            }
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe();
    });
  }
}
