import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceArrayViewComponent } from './resource-array-view.component';

xdescribe('ResourceArrayViewComponent', () => {
  let component: ResourceArrayViewComponent;
  let fixture: ComponentFixture<ResourceArrayViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceArrayViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceArrayViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
