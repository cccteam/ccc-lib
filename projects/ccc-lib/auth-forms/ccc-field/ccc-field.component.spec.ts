import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CccInputFieldComponent } from './ccc-field.component';

describe('CccFieldComponent', () => {
  let component: CccInputFieldComponent;
  let fixture: ComponentFixture<CccInputFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CccInputFieldComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(CccInputFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', 'read');
    fixture.componentRef.setInput('resource', 'users');
    fixture.componentRef.setInput('domain', 'default');
    fixture.componentRef.setInput('value', 'value');
    fixture.componentRef.setInput('name', 'Field Name');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
