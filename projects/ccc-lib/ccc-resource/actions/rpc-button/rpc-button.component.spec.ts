import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RpcButtonComponent } from './rpc-button.component';

describe('RpcButtonComponent', () => {
  let component: RpcButtonComponent;
  let fixture: ComponentFixture<RpcButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpcButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RpcButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
