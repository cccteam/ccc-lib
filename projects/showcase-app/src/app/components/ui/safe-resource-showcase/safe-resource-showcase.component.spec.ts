import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeResourceShowcaseComponent } from './safe-resource-showcase.component';

describe('SafeResourceShowcaseComponent', () => {
  let component: SafeResourceShowcaseComponent;
  let fixture: ComponentFixture<SafeResourceShowcaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeResourceShowcaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SafeResourceShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
