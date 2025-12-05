import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseRPCModalComponent } from './base-rpc-modal.component';

describe('BaseRPCModalComponent', () => {
  let component: BaseRPCModalComponent;
  let fixture: ComponentFixture<BaseRPCModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseRPCModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseRPCModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
