import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeResourceTestingComponent } from './safe-resource-testing.component';

describe('SafeResourceTestingComponent', () => {
  let component: SafeResourceTestingComponent;
  let fixture: ComponentFixture<SafeResourceTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafeResourceTestingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SafeResourceTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
