import { NgComponentOutlet } from '@angular/common';
import {
    Component,
    computed,
    effect,
    inject,
    Injector,
    input,
    OnInit,
    output,
    Signal,
    signal,
    Type,
    viewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ArrayConfig, ColumnConfig, RecordData, RESOURCE_META, ViewConfig } from '@cccteam/ccc-lib/src/types';
import { ActionAccessControlWrapperComponent } from '../actions/action-button-smart/action-access-control-wrapper.component';
import { ActionButtonContext } from '../actions/actions.interface';
import { ResourceCreateComponent } from '../resource-create/resource-create.component';
import { ResourceStore } from '../resource-store.service';

@Component({
  selector: 'ccc-resource-array-view',
  templateUrl: './resource-array-view.component.html',
  styleUrl: './resource-array-view.component.scss',
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    ResourceCreateComponent,
    ActionAccessControlWrapperComponent,
    NgComponentOutlet,
  ],
  providers: [ResourceStore],
})
export class ResourceArrayViewComponent implements OnInit {
  resourceMeta = inject(RESOURCE_META);
  store = inject(ResourceStore);
  injector = inject(Injector);

  resourceConfig = input.required<ArrayConfig>();
  parentData = input<RecordData>({});
  expPanel = viewChild<MatExpansionPanel, MatExpansionPanel>('expPanel', { read: MatExpansionPanel });

  emptyOneToOne = output<boolean>();

  createMode = signal(false);
/* eslint-disable  @typescript-eslint/no-explicit-any */
  compoundResourceComponent = input.required<Type<any>>();

  showCreateButton = computed(() => {
    const list = this.store.listData();
    const resourceConfig = this.resourceConfig();
    const iteratedConfig = resourceConfig.iteratedConfig;
    if (list && resourceConfig?.viewType === 'OneToOne') {
      this.emptyOneToOne.emit(list.length === 0);
      return list.length === 0;
    }
    if ('createTitle' in iteratedConfig && iteratedConfig.createTitle !== '') {
      return true;
    }
    return false;
  });

  createActionConfig: Signal<ActionButtonContext | undefined> = computed(() => {
    const config = this.resourceConfig();
    const showCreate = this.showCreateButton();
    const meta = this.store.resourceMeta();

    if (config === undefined || showCreate === undefined || meta === undefined) {
      return undefined;
    }

    return {
      actionType: 'create',
      meta: this.store.resourceMeta(),
      shouldRender: () => (showCreate && config.shouldRenderActions?.create?.(this.parentData())) ?? false,
      resourceData: this.parentData(),
    };
  });

  createConfig = computed(() => {
    const config = this.resourceConfig();
    if (config.createConfig && Object.keys(config.createConfig).length !== 0) {
      return config.createConfig as ViewConfig;
    }
    if (config.iteratedConfig && Object.keys(config.iteratedConfig).length !== 0) {
      return config.iteratedConfig as ViewConfig;
    }
    return config;
  });

  resourceListRoute = computed(() => {
    const config = this.resourceConfig();
    const meta = this.resourceMeta(config.connectorResource || config.primaryResource);
    return meta.route;
  });

  setCreateMode(value: boolean): void {
    this.createMode.set(value);
    if (value && this.expPanel && this.expPanel()?.closed) {
      this.expPanel()?.open();
    }
  }

  ngOnInit(): void {
    this.store.resourceName.set(this.resourceConfig().primaryResource);
    const meta = this.resourceMeta(this.resourceConfig().primaryResource);
    this.store.resourceMeta.set(meta);
    this.store.overrideRoute.set(this.resourceListRoute());
    const columnArray = [];
    if (this.resourceConfig().connectorField !== '') {
      columnArray.push({ id: this.resourceConfig().connectorField });
    } else {
      columnArray.push({ id: 'id' } as ColumnConfig);
    }
    this.store.listColumns.set(columnArray);
    this.store.sorts.set(this.resourceConfig().sorts);
  }

  constructor() {
    effect(() => {
      const parentData = this.parentData();
      const resourceConfig = this.resourceConfig();

      if (resourceConfig && 'listFilter' in resourceConfig && parentData) {
        const filter = resourceConfig.listFilter(parentData);

        this.store.filter.set(filter);
        this.store.disableCacheForFilterPii.set(resourceConfig.disableCacheForFilterPii);
        this.store.buildStoreListData();
      }
    });
  }

  createResource(event: MouseEvent): void {
    event.stopPropagation();
    const expPanel = this.expPanel();

    if (!expPanel) {
      this.setCreateMode(true);
      return;
    }
    this.setCreateMode(true);
    if (expPanel.closed) {
      expPanel.open();
    }
  }

  onResourceDeleted(): void {
    this.setCreateMode(false);
  }

  onCreateCompleted(): void {
    this.store.reloadListData();
    this.setCreateMode(false);
  }
}
