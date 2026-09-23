import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { ApiDescriptor, createClient, Resource, TransportRequest, TransportResponse } from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { field, FieldMeta, FieldName, RESOURCE_META, ResourceMeta, viewConfig } from '@cccteam/resource-angular/types';

import { ResourceCreateComponent } from './resource-create.component';

describe('ResourceCreateComponent', () => {
  let component: ResourceCreateComponent;
  let fixture: ComponentFixture<ResourceCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCreateComponent],
      providers: [provideResourceTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCreateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'resourceConfig',
      viewConfig({ primaryResource: 'Squadrons' as Resource, elements: [] }),
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// A create form over a resource with the three read-only shapes and a write-only field:
// the shapes' controls start null and show the placeholder, never an input, and a null
// control leaves the add operation; the write-only field is a blank input.
describe('ResourceCreateComponent over the read-only shapes and a write-only field', () => {
  const probes = 'Probes' as Resource;
  const descriptor: ApiDescriptor = {
    permissionDigestRoute: 'permission-digest',
    userDomainsRoute: 'user-domains',
    methods: {},
    resources: {
      [probes]: {
        resource: probes,
        property: 'probes',
        route: 'probes',
        scope: 'global',
        consolidated: false,
        keys: ['id'],
        operations: ['list', 'read', 'create'],
      },
    },
  };
  const fieldMeta = (fieldName: string, extra: Partial<FieldMeta> = {}): FieldMeta =>
    ({ fieldName, displayType: 'string', required: false, isIndex: false, ...extra }) as FieldMeta;
  const meta: ResourceMeta = {
    route: 'probes',
    fields: [
      fieldMeta('id', { primaryKey: { ordinalPosition: 0 }, displayType: 'uuid' }),
      fieldMeta('name', { required: true }),
      fieldMeta('cargoBays', { displayType: 'number[]' }),
      fieldMeta('position', { displayType: 'object' }),
      fieldMeta('digest', { displayType: 'bytes' }),
      fieldMeta('transcript', { writeOnly: true }),
    ],
  };

  let fixture: ComponentFixture<ResourceCreateComponent>;
  let component: ResourceCreateComponent;
  let transport: ScriptedTransport;

  /** The add operations sent so far: what each one does and the value it carries. */
  const adds = (): { op: string; value: unknown }[] =>
    transport.requests
      .filter((request) => request.method === 'PATCH')
      .map((request) => (request.body as { op: string; value: unknown }[])[0])
      .map(({ op, value }) => ({ op, value }));

  const settle = async (done: () => boolean): Promise<void> => {
    for (let i = 0; i < 30 && !done(); i++) {
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
  };

  /** The visible input of the form field labeled so; null where the label draws no form field (the shapes) or nothing at all. */
  const inputLabeled = (label: string): HTMLInputElement | null => {
    const fields = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('mat-form-field'));
    const match = fields.find((formField) => formField.querySelector('mat-label')?.textContent?.trim() === label);
    return match?.querySelector<HTMLInputElement>('input:not([type=hidden])') ?? null;
  };

  beforeEach(async () => {
    transport = scriptedTransport((request: TransportRequest): TransportResponse => {
      if (request.method === 'PATCH') {
        return { status: 200, body: { probes: ['p-1'] } };
      }
      return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
    });
    await TestBed.configureTestingModule({
      imports: [ResourceCreateComponent],
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
        { provide: RESOURCE_META, useValue: (resource: Resource): ResourceMeta | undefined => (resource === probes ? meta : undefined) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceCreateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'resourceConfig',
      viewConfig({
        primaryResource: probes,
        elements: [
          field({ name: 'name' as FieldName, label: 'Name' }),
          field({ name: 'cargoBays' as FieldName, label: 'Cargo bays' }),
          field({ name: 'position' as FieldName, label: 'Position' }),
          field({ name: 'digest' as FieldName, label: 'Digest' }),
          field({ name: 'transcript' as FieldName, label: 'Transcript' }),
        ],
      }),
    );
    fixture.detectChanges();
  });

  it('starts the three shapes null behind the placeholder, and the write-only field as a blank input', () => {
    const form = component.form();
    expect(form.get('cargoBays')?.value).toBeNull();
    expect(form.get('position')?.value).toBeNull();
    expect(form.get('digest')?.value).toBeNull();
    // The three shapes show the placeholder's read-only input, never an editable one.
    expect(inputLabeled('Cargo bays')?.readOnly).toBe(true);
    expect(inputLabeled('Position')?.readOnly).toBe(true);
    expect(inputLabeled('Digest')?.readOnly).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('ccc-empty-readonly-field').length).toBe(3);
    const transcript = inputLabeled('Transcript');
    expect(transcript).not.toBeNull();
    expect(transcript?.value).toBe('');
  });

  it('leaves the null controls and the untyped write-only field out of the add operation', async () => {
    const name = component.form().get('name') as AbstractControl<unknown>;
    name.setValue('Kestrel');
    name.markAsDirty();
    component.saveForm();
    await settle(() => adds().length === 1);
    expect(adds()).toEqual([{ op: 'add', value: { name: 'Kestrel' } }]);
  });
});
