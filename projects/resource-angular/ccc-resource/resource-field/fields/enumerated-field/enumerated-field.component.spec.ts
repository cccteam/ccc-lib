import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ApiDescriptor, createClient, Resource, TransportRequest, TransportResponse } from '@cccteam/resource';
import { scriptedTransport, ScriptedTransport } from '@cccteam/resource/testing';
import { provideResourceTesting } from '@cccteam/resource-angular/testing';
import { enumeratedConfig, field, FieldMeta, FieldName, RESOURCE_META, ResourceMeta } from '@cccteam/resource-angular/types';

import { ResourceStore } from '../../../resource-store.service';
import { EnumeratedFieldComponent } from './enumerated-field.component';

describe('EnumeratedFieldComponent', () => {
  let component: EnumeratedFieldComponent;
  let fixture: ComponentFixture<EnumeratedFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnumeratedFieldComponent],
      providers: [provideResourceTesting(), ResourceStore],
    }).compileComponents();

    const fieldMeta: FieldMeta = {
      fieldName: 'status',
      displayType: 'enumerated',
      required: false,
      isIndex: false,
      enumeration: [{ id: 'active', display: 'Active' }],
    };
    const meta: ResourceMeta = { route: 'squadrons', fields: [fieldMeta] };
    fixture = TestBed.createComponent(EnumeratedFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('meta', meta);
    fixture.componentRef.setInput('fieldMeta', fieldMeta);
    fixture.componentRef.setInput('fieldConfig', field({ name: 'status' as FieldName, label: 'Status' }));
    fixture.componentRef.setInput('editMode', 'edit');
    fixture.componentRef.setInput('form', new FormGroup({ status: new FormControl<string | null>(null) }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// A picker over a paged source reads the chosen row by key: once, when the value is
// known, and again only when the value changes. An edit-mode toggle, a rebuild of the
// form group over the same value, and a reload of the page's row read nothing. The
// requests are pinned against a scripted client.
describe('EnumeratedFieldComponent over a paged source', () => {
  const squadrons = 'Squadrons' as Resource;
  const wings = 'Wings' as Resource;
  const descriptor: ApiDescriptor = {
    permissionDigestRoute: 'permission-digest',
    userDomainsRoute: 'user-domains',
    methods: {},
    resources: {
      [wings]: {
        resource: wings,
        property: 'wings',
        route: 'wings',
        scope: 'global',
        consolidated: false,
        keys: ['id'],
        operations: ['list', 'read'],
        page: { default: 25, max: 200 },
        order: [{ field: 'name', direction: 'asc' }],
      },
    },
  };
  const wingField: FieldMeta = {
    fieldName: 'wingId',
    displayType: 'enumerated',
    required: false,
    isIndex: true,
    enumeratedResource: wings,
  };
  const metas: Record<string, ResourceMeta> = {
    [squadrons]: { route: 'squadrons', fields: [wingField] },
    [wings]: { route: 'wings', fields: [{ fieldName: 'id', displayType: 'uuid', required: false, isIndex: true }, { fieldName: 'name', displayType: 'string', required: true, isIndex: true }] },
  };
  const wingRows: Record<string, { id: string; name: string }> = {
    'w-1': { id: 'w-1', name: 'Anvil Wing' },
    'w-2': { id: 'w-2', name: 'Forge Wing' },
  };

  let fixture: ComponentFixture<EnumeratedFieldComponent>;
  let transport: ScriptedTransport;

  const server = (request: TransportRequest): TransportResponse => {
    const path = request.url.split('?')[0];
    const key = path.match(/^\/api\/wings\/(.+)$/)?.[1];
    if (key && wingRows[key]) {
      return { status: 200, body: wingRows[key] };
    }
    if (path === '/api/wings') {
      return { status: 200, body: Object.values(wingRows), headers: { 'total-count': '2' } };
    }
    return { status: 404, body: { message: `unscripted ${request.method} ${request.url}` } };
  };

  /** The reads of a chosen wing so far, by key. */
  const wingReads = (): string[] =>
    transport.requests
      .map((request) => request.url.split('?')[0].match(/^\/api\/wings\/(.+)$/)?.[1])
      .filter((key): key is string => key !== undefined);

  const settle = async (): Promise<void> => {
    for (let i = 0; i < 10; i++) {
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
  };

  const formOver = (value: string | null): FormGroup => new FormGroup({ wingId: new FormControl<string | null>(value) });

  beforeEach(async () => {
    transport = scriptedTransport(server);
    await TestBed.configureTestingModule({
      imports: [EnumeratedFieldComponent],
      providers: [
        provideResourceTesting({ transport, client: (t) => createClient(descriptor, { baseUrl: '/api', transport: t }) }),
        { provide: RESOURCE_META, useValue: (resource: Resource): ResourceMeta => metas[resource] },
        ResourceStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumeratedFieldComponent);
    fixture.componentRef.setInput('meta', metas[squadrons]);
    fixture.componentRef.setInput('fieldMeta', wingField);
    fixture.componentRef.setInput(
      'fieldConfig',
      field({ name: 'wingId' as FieldName, label: 'Wing', enumeratedConfig: enumeratedConfig({ listDisplay: ['name' as FieldName], viewDisplay: ['name' as FieldName] }) }),
    );
    fixture.componentRef.setInput('editMode', 'view');
    fixture.componentRef.setInput('showField', true);
    fixture.componentRef.setInput('form', formOver('w-1'));
    fixture.detectChanges();
    await settle();
  });

  it('reads the chosen row once at load and shows its display', () => {
    expect(wingReads()).toEqual(['w-1']);
    expect(fixture.componentInstance.singleEnumDisplayText()).toBe('Anvil Wing');
  });

  it('reads nothing on an edit-mode toggle', async () => {
    fixture.componentRef.setInput('editMode', 'edit');
    await settle();
    fixture.componentRef.setInput('editMode', 'view');
    await settle();
    expect(wingReads()).toEqual(['w-1']);
  });

  it('reads nothing when the form group is rebuilt over the same value, as after a reload of the page\'s row', async () => {
    fixture.componentRef.setInput('form', formOver('w-1'));
    await settle();
    fixture.componentRef.setInput('form', formOver('w-1'));
    await settle();
    expect(wingReads()).toEqual(['w-1']);
    expect(fixture.componentInstance.singleEnumDisplayText()).toBe('Anvil Wing');
  });

  it('reads the new row exactly once when the chosen value changes', async () => {
    fixture.componentRef.setInput('editMode', 'edit');
    await settle();
    fixture.componentInstance.select('w-2');
    await settle();
    fixture.componentRef.setInput('editMode', 'view');
    await settle();
    expect(wingReads()).toEqual(['w-1', 'w-2']);
    expect(fixture.componentInstance.singleEnumDisplayText()).toBe('Forge Wing');
  });

  it('reads nothing while the field is hidden', async () => {
    fixture.componentRef.setInput('showField', false);
    await settle();
    fixture.componentRef.setInput('form', formOver('w-2'));
    await settle();
    expect(wingReads()).toEqual(['w-1']);
  });
});
