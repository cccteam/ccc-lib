import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resource } from '@cccteam/resource';
import { scriptedTransport } from '@cccteam/resource/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { arrayConfig, viewConfig } from '@cccteam/resource-angular/types';

import { CompoundResourceComponent } from '../compound-resource/compound-resource.component';
import { ResourceArrayViewComponent } from './resource-array-view.component';

describe('ResourceArrayViewComponent', () => {
  let component: ResourceArrayViewComponent;
  let fixture: ComponentFixture<ResourceArrayViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceArrayViewComponent],
      providers: [provideResourceTesting({ transport: scriptedTransport({ status: 200, body: [] }) })],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceArrayViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('compoundResourceComponent', CompoundResourceComponent);
    fixture.componentRef.setInput(
      'resourceConfig',
      arrayConfig({
        primaryResource: 'Squadrons' as Resource,
        iteratedConfig: viewConfig({ primaryResource: 'Squadrons' as Resource, elements: [] }),
        listFilter: () => '',
      }),
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
