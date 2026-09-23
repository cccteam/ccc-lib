import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RpcButtonComponent } from './rpc-button.component';

describe('RpcButtonComponent', () => {
  let component: RpcButtonComponent;
  let fixture: ComponentFixture<RpcButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpcButtonComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RpcButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('relatedData', {});
    fixture.componentRef.setInput('rpcConfig', {
      label: 'Test RPC',
      conditions: [],
      method: 'testMethod',
      elements: [],
      methodBodyTemplate: {},
    });
    fixture.componentRef.setInput('primaryResource', 'users');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
