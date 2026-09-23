import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateFieldComponent } from './date-field.component';

xdescribe('DateFieldComponent', () => {
  let component: DateFieldComponent;
  let fixture: ComponentFixture<DateFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
