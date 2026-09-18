import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Resource } from '@cccteam/resource';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { viewConfig } from '@cccteam/resource-angular/types';

import { CompoundResourceComponent } from './compound-resource.component';

describe('CompoundResourceComponent', () => {
  let component: CompoundResourceComponent;
  let fixture: ComponentFixture<CompoundResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompoundResourceComponent],
      providers: [provideResourceTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CompoundResourceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('uuid', 'sq-1');
    fixture.componentRef.setInput(
      'resourceConfig',
      viewConfig({ primaryResource: 'Squadrons' as Resource, elements: [], showBackButton: false }),
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
