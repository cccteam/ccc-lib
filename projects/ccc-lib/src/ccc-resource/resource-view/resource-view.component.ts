import { Location } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  input,
  OnInit,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { filter, tap } from 'rxjs';
import { sparseFormData } from '../../auth-forms';
import {
  AlertLevel,
  DataType,
  FieldElement,
  ListViewConfig,
  RecordData,
  Resource,
  RESOURCE_META,
  ResourceMeta,
  RootConfig,
  RPCConfig,
  ViewConfig,
} from '../../types';
import { NotificationService } from '../../ui-notification-service';
import { FormStateService } from '../form-state.service';
import { civildateCoercion, flattenElements } from '../gui-constants';
import { DeleteOperation, UpdateOperation } from '../operation-types';
import { ResourceCacheService } from '../resource-cache.service';
import { ResourceLayoutComponent } from '../resource-layout/resource-layout.component';
import { ResourceStore } from '../resource-store.service';
import { metadataTypeCoercion } from '../resources-helpers';

@Component({
  selector: 'ccc-resource-view',
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
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
  ],
  templateUrl: './resource-view.component.html',
  styleUrl: './resource-view.component.scss',
  providers: [ResourceStore],
})
export class ResourceViewComponent implements OnInit {
  location = inject(Location);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  notifications = inject(NotificationService);
  store = inject(ResourceStore);
  cache = inject(ResourceCacheService);
  injector = inject(Injector);
  destroyRef = inject(DestroyRef);
  formState = inject(FormStateService);
  dialog = inject(MatDialog);

  editMode: WritableSignal<'edit' | 'view'> = signal('view');
  uuid = input.required<string>();
  config = input.required<ViewConfig | ListViewConfig>();
  relatedData = input<RecordData>({});
  compoundResourceView = input<boolean>(false);
  isDirty = signal(false);

  displayFormInvalidMessage = signal<boolean>(false);
  deleted = output<boolean>();

  resourceMeta = inject(RESOURCE_META);

  rootConfig = computed(() => {
    return this.activatedRoute.snapshot.data['config'] as RootConfig;
  });

  shouldShowDelete = computed(() => {
    const config = this.config();
    if (config) {
      return config.primaryResource !== this.rootConfig().parentConfig.primaryResource;
    }
    return config === undefined;
  });

  inlineRpcConfigs = computed(() => {
    const config = this.config();
    if (config) {
      return config.rpcConfigs?.filter((rpc: RPCConfig) => rpc.placement === 'inline');
    }
    return [];
  });

  endRpcConfigs = computed(() => {
    const config = this.config();
    if (config) {
      return config.rpcConfigs?.filter((rpc: RPCConfig) => rpc.placement === 'end');
    }
    return [];
  });

  useExpansionPanel = computed(() => {
    const config = this.config();
    // TODO: Investigate why we're doing this check, it's weird because viewType is not part of the input configs
    if (config && 'viewType' in config && config.viewType !== 'View') {
      return false;
    }

    return config.collapsible || !this.compoundResourceView();
  });

  resourceConfigRouteSnapshot = computed(() => {
    return (
      this.config() ||
      (this.activatedRoute.snapshot.data['config'] as RootConfig)?.parentConfig ||
      ({} as ViewConfig | ListViewConfig)
    );
  });

  emptyFormGroup = new FormGroup({});

  form = computed(() => {
    const meta = this.store.resourceMeta();
    const resourceData = this.store.viewData();
    const config = this.config();

    if (meta === undefined || resourceData === undefined || config === undefined) {
      return this.emptyFormGroup;
    }

    const fg = new FormGroup({});
    const pristineValues: Record<string, DataType | null> = {};
    const allElements = flattenElements(config.elements);

    for (const field of meta.fields || []) {
      const isFieldNameRegistered = fg.get(field.fieldName) !== null;
      if (isFieldNameRegistered) {
        continue;
      }

      const findConfig = allElements.find((element) => element.type === 'field' && element.name === field.fieldName);
      const fieldConfig = findConfig as FieldElement | undefined;
      if (!fieldConfig) {
        continue;
      }

      let value: DataType | null = null;
      const stringValue = resourceData?.[field.fieldName] ? String(resourceData[field.fieldName]) : '';

      if (field.displayType === 'civildate' && stringValue) {
        value = civildateCoercion(stringValue);
      } else if (resourceData[field.fieldName] !== undefined) {
        value = resourceData[field.fieldName];
      }

      const control = new FormControl(value);

      if (fieldConfig.validators.length > 0) {
        control.setValidators(fieldConfig.validators);
      }

      fg.addControl(field.fieldName, control);
      pristineValues[field.fieldName] = value;
    }
    this.pristineFormValues = pristineValues;

    return fg;
  });

  pristineFormValues: Record<string, DataType | null> = {};

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

  primaryKeyPath = computed(() => {
    const meta = this.store.resourceMeta();
    const isConsolidated = !!meta.consolidatedRoute;
    let resourceIdentifier = '';
    if (isConsolidated) {
      resourceIdentifier = '/' + String(meta.route);
    }
    return (
      resourceIdentifier +
      '/' +
      this.primaryKeys()
        .map((field) => this.store.viewData()[field.fieldName])
        .join('/')
    );
  });

  ngOnInit(): void {
    if (this.resourceMeta(this.config().primaryResource as Resource)) {
      this.store.resourceName.set(this.config().primaryResource as Resource);
      this.store.resourceMeta.set(this.resourceMeta(this.config().primaryResource as Resource));
    }

    this.store.uuid.set(this.relatedId());
    this.store.resetResourceView();
    this.inlineRpcConfigs();
    this.endRpcConfigs();
  }

  setEditMode(mode: 'edit' | 'view'): void {
    if (mode === 'view') {
      const changeData = sparseFormData(this.form(), this.pristineFormValues);
      if (Object.keys(changeData).length !== 0) {
        this.notifications.addGlobalNotification({
          message: 'You have unsaved changes.',
          link: '',
          level: AlertLevel.ERROR,
        });
        return;
      }
      this.editMode.set('view');
    } else if (mode === 'edit') {
      this.editMode.set('edit');
    }
  }

  saveForm(): void {
    if (!this.form().valid) {
      this.displayFormInvalidMessage.set(true);
      this.form().markAllAsTouched();
      return;
    }

    this.displayFormInvalidMessage.set(false);

    const resourceMeta = this.store.resourceMeta();
    if (!resourceMeta) return;

    const sparseData = sparseFormData(this.form(), this.pristineFormValues);
    const coercedSparseData = metadataTypeCoercion(sparseData, resourceMeta);

    const updatePatch: UpdateOperation = {
      op: 'patch',
      value: coercedSparseData,
      path: this.primaryKeyPath(),
    };

    this.pristineFormValues = this.form().getRawValue();

    if (Object.keys(coercedSparseData).length === 0) return;
    this.cache
      .makePatches([updatePatch], this.route(), this.store.resourceName())
      .pipe(
        tap(() => {
          this.form().markAsPristine();
          this.setEditMode('view');
          this.formState.decrementDirtyForms();
          this.store.reloadResourceView();
        }),
      )
      .subscribe();
  }

  resetForm(): void {
    this.form().reset();
    this.form().patchValue(this.pristineFormValues);
    this.setEditMode('view');
    if (this.form().dirty) {
      this.formState.decrementDirtyForms();
    }
  }

  deleteResource(): void {
    const deletePatch: DeleteOperation = {
      op: 'remove',
      value: {},
      path: this.primaryKeyPath(),
    };

    this.cache
      .makePatches([deletePatch], this.route(), this.store.resourceName())
      .pipe(
        tap(() => {
          this.cache.updateResourceInCache(this.store.resourceName(), 'list');
          this.deleted.emit(true);
        }),
        filter(() => this.compoundResourceView()),
        tap(() => {
          this.location.back();
        }),
      )
      .subscribe();
  }

  relatedId(): string {
    const relatedData = this.relatedData();
    const config = this.config();
    if (config.parentRelation?.parentKey) {
      return String(relatedData[config.parentRelation.parentKey]);
    }
    return this.uuid();
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

    effect(() => {
      this.uuid();
      this.store.uuid.set(this.relatedId());
    });
  }
}
