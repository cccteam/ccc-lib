import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { field, FieldMeta, FieldName, ResourceMeta } from '@cccteam/resource-angular/types';

import { ResourceStore } from '../resource-store.service';
import { ResourceFieldComponent } from './resource-field.component';

describe('ResourceFieldComponent', () => {
  let component: ResourceFieldComponent;
  let fixture: ComponentFixture<ResourceFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFieldComponent],
      // The field it renders for a string column, TextFieldComponent, takes the store of the view it is in.
      providers: [provideResourceTesting(), ResourceStore],
    }).compileComponents();

    const callsign: FieldMeta = { fieldName: 'callsign', displayType: 'string', required: false, isIndex: false };
    const meta: ResourceMeta = { route: 'squadrons', fields: [callsign] };
    fixture = TestBed.createComponent(ResourceFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('meta', meta);
    fixture.componentRef.setInput('fieldConfig', field({ name: 'callsign' as FieldName, label: 'Callsign' }));
    fixture.componentRef.setInput('form', new FormGroup({ callsign: new FormControl('') }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
