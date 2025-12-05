import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  OnInit,
  output,
  signal,
  Type,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ChildResourceConfig,
  ParentResourceConfig,
  RecordData,
  Resource,
  RESOURCE_META,
  RootConfig,
} from '@cccteam/ccc-lib/types';
import { ActionAccessControlWrapperComponent } from '../actions/action-button-smart/action-access-control-wrapper.component';
import { ActionButtonContext } from '../actions/actions.interface';
import { RpcButtonComponent } from '../actions/rpc-button/rpc-button.component';
import { ResourceArrayViewComponent } from '../resource-array-view/resource-array-view.component';
import { ResourceListCreateComponent } from '../resource-list-create/resource-list-create.component';
import { ResourceResolverComponent } from '../resource-resolver/resource-resolver.component';
import { ResourceStore } from '../resource-store.service';
import { ResourceViewComponent } from '../resource-view/resource-view.component';

@Component({
  selector: 'compound-resource',
  templateUrl: './compound-resource.component.html',
  styleUrl: './compound-resource.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule,
    RouterModule,
    MatButtonModule,
    RpcButtonComponent,
    ResourceViewComponent,
    ResourceListCreateComponent,
    ResourceArrayViewComponent,
    ResourceResolverComponent,
    ActionAccessControlWrapperComponent,
    RouterModule,
  ],
  providers: [ResourceStore],
})
export class CompoundResourceComponent implements OnInit {
  location = inject(Location);
  route = inject(ActivatedRoute);
  store = inject(ResourceStore);
  injector = inject(Injector);
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  componentRef: Type<any> = CompoundResourceComponent;
  resourceMeta = inject(RESOURCE_META);

  resourceConfig = input<ParentResourceConfig | ChildResourceConfig>();
  isArrayChild = input<boolean>(false);
  uuid = input.required<string>();
  parentData = input<RecordData>();

  rootConfig = computed(() => this.route.snapshot.data['config'] as RootConfig);

  emptyOneToOne = signal(false);
  missingRoot = input(false);
  resourceCreate = output();
  deleted = output<boolean>();
  navAfterDelete = input<boolean>(true);
  navAfterDeleteConsideringRoot = computed(() => {
    const navAfterDeleteInput = this.navAfterDelete();
    if (navAfterDeleteInput === undefined) return true;
    return false;
  });

  hasElements = computed(() => {
    const config = this.primaryConfig();
    return config && (config.type === 'ListView' || config.type === 'View') && config.elements.length > 0;
  });

  primaryConfigParentId = computed(() => {
    const config = this.primaryConfig();
    const data = this.resolvedData();
    if (config.type === 'View' || config.type === 'ListView') {
      const parentKey = config.parentRelation?.parentKey;
      if (parentKey !== '') {
        return String(data[parentKey]);
      }
    }
    return this.uuid();
  });

  primaryConfig = computed(() => {
    const config = this.resourceConfig();
    if (config) {
      return config;
    }
    return this.rootConfig().parentConfig;
  });

  title = computed(() => {
    if (this.isArrayChild()) {
      return '';
    }
    const config = this.primaryConfig();
    if (config.type !== 'Component') {
      return config.title;
    }
    return '';
  });

  isRootConfig = computed(() => {
    return this.resourceConfig() === undefined;
  });

  configs = computed(() => {
    if (this.hasElements() && this.emptyOneToOne()) {
      return [];
    }

    if (this.isRootConfig()) {
      return this.rootConfig().relatedConfigs;
    }

    const config = this.primaryConfig();
    if (config.type === 'ListView' || config.type === 'View') {
      return config.relatedConfigs;
    }
    return [];
  });

  rpcConfigs = computed(() => {
    const isRootConfig = this.isRootConfig();
    const rootConfig = this.rootConfig();

    if (isRootConfig === undefined || rootConfig === undefined) {
      return [];
    }

    if (!isRootConfig || rootConfig.rpcConfigs === undefined) {
      return [];
    }

    return rootConfig.rpcConfigs?.map((config) => ({
      config,
      context: {
        actionType: 'rpc',
        shouldRender: config.shouldRender,
        resourceData: this.resolvedData(),
      } satisfies ActionButtonContext,
    }));
  });
  hasRpcConfigs = computed(() => !!this.rpcConfigs() && this.rpcConfigs()!.length > 0);

  resolvedData = computed(() => {
    if (Object.keys(this.store.viewData()).length > 0) {
      return this.store.viewData() as RecordData;
    }

    return this.parentData() || ({} as RecordData);
  });

  ngOnInit(): void {
    const resource = this.primaryConfig().primaryResource as Resource;
    const meta = this.resourceMeta(resource);

    if (meta) {
      this.store.resourceName.set(resource);
      this.store.resourceMeta.set(meta);
    }
  }

  constructor() {
    effect(() => {
      this.store.uuid.set(this.primaryConfigParentId());

      const c = this.primaryConfig();
      if (this.missingRoot()) {
        return;
      }
      if (c.type === 'View') {
        this.store.buildStoreViewData();
      } else if (c.type === 'ListView') {
        this.store.buildStoreListData();
        this.store.buildStoreViewData();
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
