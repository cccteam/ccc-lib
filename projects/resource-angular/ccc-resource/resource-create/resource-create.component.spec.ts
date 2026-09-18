import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resource } from '@cccteam/resource';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { viewConfig } from '@cccteam/resource-angular/types';

import { ResourceCreateComponent } from './resource-create.component';

describe('ResourceCreateComponent', () => {
  let component: ResourceCreateComponent;
  let fixture: ComponentFixture<ResourceCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCreateComponent],
      providers: [provideResourceTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCreateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'resourceConfig',
      viewConfig({ primaryResource: 'Squadrons' as Resource, elements: [] }),
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
