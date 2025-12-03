import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomConfigWidgetComponent } from './custom-config-widget.component';

describe('CustomConfigWidgetComponent', () => {
  let component: CustomConfigWidgetComponent;
  let fixture: ComponentFixture<CustomConfigWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomConfigWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomConfigWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
