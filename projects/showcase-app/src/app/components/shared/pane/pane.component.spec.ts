import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaneComponent } from './pane.component';

xdescribe('PaneComponent', () => {
  let component: PaneComponent;
  let fixture: ComponentFixture<PaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
