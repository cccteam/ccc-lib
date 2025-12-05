import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionAccessControlWrapper } from './action-access-control-wrapper.component';

describe('ActionAccessControlWrapper', () => {
  let component: ActionAccessControlWrapper;
  let fixture: ComponentFixture<ActionAccessControlWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionAccessControlWrapper],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionAccessControlWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
