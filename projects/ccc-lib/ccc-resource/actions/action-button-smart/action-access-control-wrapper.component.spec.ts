import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionAccessControlWrapperComponent } from './action-access-control-wrapper.component';

describe('ActionAccessControlWrapperComponent', () => {
  let component: ActionAccessControlWrapperComponent;
  let fixture: ComponentFixture<ActionAccessControlWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionAccessControlWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionAccessControlWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
