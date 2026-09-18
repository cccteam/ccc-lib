import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { field, FieldMeta, FieldName, ResourceMeta } from '@cccteam/resource-angular/types';

import { ResourceStore } from '../../../resource-store.service';
import { EnumeratedFieldComponent } from './enumerated-field.component';

describe('EnumeratedFieldComponent', () => {
  let component: EnumeratedFieldComponent;
  let fixture: ComponentFixture<EnumeratedFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnumeratedFieldComponent],
      providers: [provideResourceTesting(), ResourceStore],
    }).compileComponents();

    const fieldMeta: FieldMeta = {
      fieldName: 'status',
      displayType: 'enumerated',
      required: false,
      isIndex: false,
      enumeration: [{ id: 'active', display: 'Active' }],
    };
    const meta: ResourceMeta = { route: 'squadrons', fields: [fieldMeta] };
    fixture = TestBed.createComponent(EnumeratedFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('meta', meta);
    fixture.componentRef.setInput('fieldMeta', fieldMeta);
    fixture.componentRef.setInput('fieldConfig', field({ name: 'status' as FieldName, label: 'Status' }));
    fixture.componentRef.setInput('editMode', 'edit');
    fixture.componentRef.setInput('form', new FormGroup({ status: new FormControl<string | null>(null) }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
