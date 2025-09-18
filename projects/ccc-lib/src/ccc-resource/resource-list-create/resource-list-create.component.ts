import { Component, computed, inject, Injector, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ListViewConfig, RecordData, RootConfig } from '@cccteam/ccc-lib/src/types';
import { ResourceCacheService } from '../resource-cache.service';
import { ResourceCreateComponent } from '../resource-create/resource-create.component';
import { ResourceListComponent } from '../resource-list/resource-list.component';

@Component({
  selector: 'ccc-resource-list-create',
  templateUrl: './resource-list-create.component.html',
  styleUrl: './resource-list-create.component.scss',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    ResourceCreateComponent,
    ResourceListComponent,
  ],
})
export class ResourceListCreateComponent {
  injector = inject(Injector);
  cache = inject(ResourceCacheService);

  route = inject(ActivatedRoute);
  router = inject(Router);
  create = signal<boolean>(false);
  parentId = input<string>();
  parentData = input<RecordData>({});
  searchParams = input<Record<string, string>[]>([]);
  resourceConfig = input<ListViewConfig>();
  isRootList = input<boolean>(true);

  childKey = computed(() => {
    if (!this.config().parentRelation) {
      return '';
    }
    return this.config().parentRelation?.childKey as string;
  });

  filter = computed(() => {
    const filters = [];
    if (this.childKey() !== '' && this.parentKey() !== '') {
      filters.push(`${this.childKey()}:eq:${this.parentKey()}`);
    }
    return filters.join(',');
  });

  parentKey = computed(() => {
    if (this.parentData() === undefined || this.childKey() === undefined) {
      return '';
    }
    const parent = this.config().parentRelation?.parentKey;
    return this.parentData()?.[parent] || '';
  });

  config = computed(() => {
    const inputConfig = this.resourceConfig();
    if (inputConfig) {
      return inputConfig as ListViewConfig;
    }
    return this.rootConfig().parentConfig as ListViewConfig;
  });

  expPanel = viewChild<MatExpansionPanel, MatExpansionPanel>('expPanel', { read: MatExpansionPanel });

  rootConfig = computed(() => {
    return this.route.snapshot.data['config'] as RootConfig;
  });

  createLinkType = computed(() => {
    return this.config().createType === 'link' && this.create();
  });

  createConfig = computed(() => {
    const config = this.config();
    if (Object.keys(config.createConfig).length !== 0) {
      return config.createConfig;
    }
    return config;
  });

  createResource(event: MouseEvent): void {
    event.stopPropagation();
    this.create.set(true);

    if (this.expPanel() && this.expPanel()?.closed) {
      this.expPanel()?.open();
    }
  }

  makeCreatePatches(): void {
    if (this.create()) {
      const resource = this.config().primaryResource;
      this.cache.updateResourceInCache(resource, 'list');
      this.create.set(false);
    }
  }
}
