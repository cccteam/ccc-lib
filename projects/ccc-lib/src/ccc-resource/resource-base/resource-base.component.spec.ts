import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceBaseComponent } from './resource-base.component';

xdescribe('ResourceBaseComponent', () => {
  let component: ResourceBaseComponent;
  let fixture: ComponentFixture<ResourceBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceBaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
