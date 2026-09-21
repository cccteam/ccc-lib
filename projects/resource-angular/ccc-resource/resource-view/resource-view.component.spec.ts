import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Resource } from '@cccteam/resource';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { viewConfig } from '@cccteam/resource-angular/types';

import { ResourceStore } from '../resource-store.service';
import { ResourceViewComponent } from './resource-view.component';

describe('ResourceViewComponent', () => {
  let component: ResourceViewComponent;
  let fixture: ComponentFixture<ResourceViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceViewComponent],
      // The view provides no store of its own: inside a compound page it shares the page's,
      // elsewhere it sits on an element carrying cccRowStore. The expansion panel binds
      // [@.disabled], which needs an animation renderer.
      providers: [provideResourceTesting(), provideNoopAnimations(), ResourceStore],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('uuid', 'sq-1');
    fixture.componentRef.setInput(
      'config',
      viewConfig({ primaryResource: 'Squadrons' as Resource, elements: [], showBackButton: false }),
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('ResourceViewComponent with no store in scope', () => {
  it('fails at construction naming ResourceStore', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceViewComponent],
      providers: [provideResourceTesting(), provideNoopAnimations()],
    }).compileComponents();
    expect(() => TestBed.createComponent(ResourceViewComponent)).toThrow(/ResourceStore/);
  });
});
