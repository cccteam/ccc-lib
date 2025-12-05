import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableButtonComponent } from './table-button.component';

xdescribe('TableButtonComponent', () => {
  let component: TableButtonComponent<null>;
  let fixture: ComponentFixture<TableButtonComponent<null>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableButtonComponent<null>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
