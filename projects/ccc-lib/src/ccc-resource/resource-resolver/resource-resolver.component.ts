import { Component, ComponentRef, computed, effect, input, untracked, viewChild, ViewContainerRef } from '@angular/core';
import { ResourceStore } from '../../ccc-resource/resource-store.service';
import { ChildResourceConfig, ComponentConfig, FieldName, RecordData } from '../../types';

@Component({
  selector: 'ccc-resource-resolver',
  imports: [],
  templateUrl: './resource-resolver.component.html',
  styleUrl: './resource-resolver.component.scss',
  providers: [ResourceStore],
})
export class ResourceResolverComponent {
  compoundResourceComponent = input.required<ComponentRef<any>>();
  resourceConfig = input<ChildResourceConfig>();

  config = computed(() => {
    return this.resourceConfig() as ComponentConfig;
  });

  dynamicSlot = viewChild.required<ViewContainerRef, ViewContainerRef>('dynamicSlot', { read: ViewContainerRef });

  parentData = input.required<RecordData>();

  constructor() {
    effect(() => {
      const parentData = this.parentData();
      const config = this.config();
      const params = config?.params;
      if (params === undefined || config === undefined) return;

      untracked(() => {
        this.dynamicSlot().clear();
        const component = config.component;
        switch (component) {
          case 'SwitchResolver': {
            let uuid = '';
            let caseConfig = {} as ChildResourceConfig;
            for (const c of params.cases) {
              if (parentData) {
                if (parentData[c.parentField] === c.caseId) {
                  uuid = String(parentData[c.childId]);
                  caseConfig = c.config;
                  if ('parentRelation' in caseConfig) {
                    caseConfig.parentRelation.childKey = '' as FieldName;
                    caseConfig.parentRelation.parentKey = '' as FieldName;
                  }
                  break;
                }
              }
            }

            if (uuid == '') return;

            // Use dynamic import to avoid circular dependency
            const primaryComponentRef = this.dynamicSlot().createComponent(this.compoundResourceComponent().componentType);
              primaryComponentRef.setInput('resourceConfig', caseConfig);
              primaryComponentRef.setInput('uuid', uuid);
              primaryComponentRef.setInput('parentData', parentData);
            break;
          }
          default:
            console.warn('Component not found', component);
            // add default component to dynamic slot
            break;
        }
      });
    });
  }
}
