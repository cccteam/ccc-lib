import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceListCreateComponent } from './resource-list-create.component';

xdescribe('ResourceListCreateComponent', () => {
  let component: ResourceListCreateComponent;
  let fixture: ComponentFixture<ResourceListCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceListCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceListCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
