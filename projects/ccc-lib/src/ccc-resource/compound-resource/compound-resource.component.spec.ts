import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompoundResourceComponent } from './compound-resource.component';

xdescribe('CompoundResourceComponent', () => {
  let component: CompoundResourceComponent;
  let fixture: ComponentFixture<CompoundResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompoundResourceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompoundResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
