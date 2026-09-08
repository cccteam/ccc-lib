import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceFieldComponent } from './resource-field.component';

xdescribe('ResourceFieldComponent', () => {
  let component: ResourceFieldComponent;
  let fixture: ComponentFixture<ResourceFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
