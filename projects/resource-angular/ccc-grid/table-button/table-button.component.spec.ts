import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { actionButtonConfig } from '@cccteam/resource-angular/types';

import { TableButtonComponent } from './table-button.component';

describe('TableButtonComponent', () => {
  let component: TableButtonComponent<null>;
  let fixture: ComponentFixture<TableButtonComponent<null>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableButtonComponent],
      providers: [provideResourceTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TableButtonComponent<null>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'config',
      actionButtonConfig({ label: 'Open', icon: 'open_in_new', actionType: 'link' }),
    );
    fixture.componentRef.setInput('rowData', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
