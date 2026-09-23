import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createClient } from '@cccteam/resource';
import { RESOURCE_CLIENT } from '@cccteam/resource-angular/resource-client';

import { CccInputFieldComponent } from './ccc-field.component';

describe('CccFieldComponent', () => {
  let component: CccInputFieldComponent;
  let fixture: ComponentFixture<CccInputFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CccInputFieldComponent],
      // The application's client is required; a bare one over an empty descriptor serves the stub.
      providers: [
        {
          provide: RESOURCE_CLIENT,
          useValue: createClient(
            {
              resources: {},
              methods: {},
              permissionDigestRoute: 'permission-digest',
              userDomainsRoute: 'user-domains',
            },
            { baseUrl: '/api' },
          ),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CccInputFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mode', 'read');
    fixture.componentRef.setInput('resource', 'users');
    fixture.componentRef.setInput('domain', 'default');
    fixture.componentRef.setInput('value', 'value');
    fixture.componentRef.setInput('name', 'Field Name');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
