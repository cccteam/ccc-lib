import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeavePageConfirmationModalComponent } from './leave-page-confirmation-modal.component';

describe('LeavePageConfirmationModalComponent', () => {
  let component: LeavePageConfirmationModalComponent;
  let fixture: ComponentFixture<LeavePageConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeavePageConfirmationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeavePageConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
