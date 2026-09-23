import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ApiDescriptor, createClient, Resource, TransportRequest, TransportResponse } from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { field, FieldMeta, FieldName, RESOURCE_META, ResourceMeta, viewConfig } from '@cccteam/resource-angular/types';

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

// A row with a write-only field, an object field, and an array field: the view draws
// nothing for the write-only field and presents the two shapes read-only; in edit mode
// the write-only field is a blank input and the two shapes stay read-only; a save sends
// only what was typed, never the untouched array or object, and nothing at all when
// nothing was typed. The requests are pinned against a scripted client.
describe('ResourceViewComponent over a write-only field and the read-only shapes', () => {
  const calls = 'Calls' as Resource;
  const descriptor: ApiDescriptor = {
    permissionDigestRoute: 'permission-digest',
    userDomainsRoute: 'user-domains',
    methods: {},
    resources: {
      [calls]: {
        resource: calls,
        property: 'calls',
        route: 'calls',
        scope: 'global',
        consolidated: false,
        keys: ['id'],
        operations: ['list', 'read', 'patch'],
        patchable: ['summary', 'transcript', 'position', 'tags'],
      },
    },
  };
  const fieldMeta = (fieldName: string, extra: Partial<FieldMeta> = {}): FieldMeta =>
    ({ fieldName, displayType: 'string', required: false, isIndex: false, ...extra }) as FieldMeta;
  const meta: ResourceMeta = {
    route: 'calls',
    fields: [
      fieldMeta('id', { primaryKey: { ordinalPosition: 0 }, displayType: 'uuid' }),
      fieldMeta('summary'),
      fieldMeta('transcript', { writeOnly: true }),
      fieldMeta('position', { displayType: 'object' }),
      fieldMeta('tags', { displayType: 'string[]' }),
    ],
  };
  /** The row as the server returns it: no transcript, since the server never returns a write-only field. */
  const row = { id: 'c-1', summary: 'Beacon lost', position: { type: 'Point', coordinates: [1, 2] }, tags: ['a', 'b'] };

  let fixture: ComponentFixture<ResourceViewComponent>;
  let component: ResourceViewComponent;
  let transport: ScriptedTransport;

  const server = (request: TransportRequest): TransportResponse => {
    const path = request.url.split('?')[0];
    if (request.method === 'GET' && path === '/api/calls/c-1') {
      return { status: 200, body: row };
    }
    if (request.method === 'PATCH') {
      return { status: 200, body: {} };
    }
    return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
  };

  /** Runs change detection and lets pending microtasks land until `done` answers true, or a few rounds pass. */
  const settle = async (done: () => boolean): Promise<void> => {
    for (let i = 0; i < 30 && !done(); i++) {
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
  };

  /** The value of every patch operation sent so far. */
  const patches = (): unknown[] =>
    transport.requests.filter((request) => request.method === 'PATCH').map((request) => (request.body as { value: unknown }[])[0].value);

  /** The visible input of the form field labeled so; null where the label draws no form field (the shapes) or nothing at all. */
  const inputLabeled = (label: string): HTMLInputElement | null => {
    const fields = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-form-field'));
    const match = fields.find((formField) => formField.querySelector('mat-label')?.textContent?.trim() === label);
    return match?.querySelector<HTMLInputElement>('input:not([type=hidden])') ?? null;
  };

  beforeEach(async () => {
    transport = scriptedTransport(server);
    await TestBed.configureTestingModule({
      imports: [ResourceViewComponent],
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
        provideNoopAnimations(),
        ResourceStore,
        { provide: RESOURCE_META, useValue: (resource: Resource): ResourceMeta | undefined => (resource === calls ? meta : undefined) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('uuid', 'c-1');
    fixture.componentRef.setInput(
      'config',
      viewConfig({
        primaryResource: calls,
        showBackButton: false,
        elements: [
          field({ name: 'summary' as FieldName, label: 'Summary' }),
          field({ name: 'transcript' as FieldName, label: 'Transcript' }),
          field({ name: 'position' as FieldName, label: 'Position' }),
          field({ name: 'tags' as FieldName, label: 'Tags' }),
        ],
      }),
    );
    fixture.detectChanges();
    await settle(() => component.store.rowPresent());
  });

  it('draws nothing for the write-only field, the object as JSON, and the array as chips', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(inputLabeled('Summary')?.value).toBe('Beacon lost');
    expect(inputLabeled('Transcript')).toBeNull();
    expect(element.querySelector('ccc-object-field pre')?.textContent).toBe(JSON.stringify(row.position, null, 2));
    expect(Array.from(element.querySelectorAll('ccc-array-field mat-chip')).map((chip) => chip.textContent?.trim())).toEqual(['a', 'b']);
  });

  it('in edit mode the write-only field is a blank input and the two shapes stay read-only', () => {
    component.setEditMode('edit');
    fixture.detectChanges();
    const transcript = inputLabeled('Transcript');
    expect(transcript).not.toBeNull();
    expect(transcript?.value).toBe('');
    expect(transcript?.readOnly).toBe(false);
    expect(inputLabeled('Position')).toBeNull();
    expect(inputLabeled('Tags')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('ccc-object-field pre')).not.toBeNull();
  });

  it('a save with nothing typed sends nothing, and a typed transcript is the whole patch', async () => {
    component.setEditMode('edit');
    fixture.detectChanges();
    component.saveForm();
    await settle(() => false);
    expect(patches()).toEqual([]);

    const transcript = component.form().get('transcript') as AbstractControl<unknown>;
    transcript.setValue('Cadet on watch logged a debris field');
    transcript.markAsDirty();
    component.saveForm();
    await settle(() => patches().length === 1);
    expect(patches()).toEqual([{ transcript: 'Cadet on watch logged a debris field' }]);
  });

  it('a save of another field sends no array and no object', async () => {
    component.setEditMode('edit');
    fixture.detectChanges();
    const summary = component.form().get('summary') as AbstractControl<unknown>;
    summary.setValue('Beacon found');
    summary.markAsDirty();
    component.saveForm();
    await settle(() => patches().length === 1);
    expect(patches()).toEqual([{ summary: 'Beacon found' }]);
  });
});
