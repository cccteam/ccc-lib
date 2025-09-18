import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  OnInit,
  signal,
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
  ResourceArrayViewComponent,
  ResourceListCreateComponent,
  ResourceResolverComponent,
  ResourceStore,
  ResourceViewComponent,
  RootConfig,
} from '@cccteam/ccc-lib';

@Component({
  selector: 'ccc-compound-resource',
  templateUrl: './compound-resource.component.html',
  styleUrl: './compound-resource.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule,
    RouterModule,
    MatButtonModule,
    ResourceViewComponent,
    ResourceListCreateComponent,
    ResourceArrayViewComponent,
    ResourceResolverComponent,
    CommonModule,
    RouterModule,
  ],
  providers: [ResourceStore],
})
export class CompoundResourceComponent implements OnInit {
  location = inject(Location);
  route = inject(ActivatedRoute);
  store = inject(ResourceStore);
  injector = inject(Injector);
  resourceMeta = inject(RESOURCE_META);

  resourceConfig = input<ParentResourceConfig | ChildResourceConfig>();
  isArrayChild = input<boolean>(false);
  uuid = input.required<string>();
  parentData = input<RecordData>();

  rootConfig = computed(() => this.route.snapshot.data['config'] as RootConfig);

  emptyOneToOne = signal(false);

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

  rpcConfigs = computed(() => (this.isRootConfig() ? this.rootConfig().rpcConfigs : undefined));
  hasRpcConfigs = computed(() => !!this.rpcConfigs() && this.rpcConfigs()!.length > 0);

  resolvedData = computed(() => {
    if (this.store.viewData()) {
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
      if (c.type === 'View') {
        this.store.resetResourceView();
      } else if (c.type === 'ListView') {
        this.store.resetResourceList();
        this.store.resetResourceView();
      }
    });
  }

  handleEmptyOneToOne(value: boolean): void {
    this.emptyOneToOne.set(value);
  }

  goBack(): void {
    this.location.back();
  }
}
