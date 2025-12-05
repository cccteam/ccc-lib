import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NullBooleanFieldComponent } from './nullboolean-field.component';

xdescribe('NullBooleanFieldComponent', () => {
  let component: NullBooleanFieldComponent;
  let fixture: ComponentFixture<NullBooleanFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NullBooleanFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NullBooleanFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
