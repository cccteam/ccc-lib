import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CccInputFieldComponent } from './ccc-field.component';

describe('CccFieldComponent', () => {
  let component: CccInputFieldComponent;
  let fixture: ComponentFixture<CccInputFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CccInputFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CccInputFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
