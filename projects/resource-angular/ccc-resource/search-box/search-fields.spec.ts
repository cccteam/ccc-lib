import { ResourceMeta } from '@cccteam/resource';

import { deniedSearchFields, searchDeniedHint, searchedFields, searchFieldLabel, searchPlaceholder } from './search-fields';

// What a box over a resource searches for a caller, and how it says so: the resource's
// search fields less the digest's denials, labeled by the page's headers or in title case.

const clients: ResourceMeta = {
  route: 'clients',
  fields: [],
  searchFields: ['name', 'contactName', 'contactEmail', 'clientContact.displayName'],
};

describe('searchedFields', () => {
  const cases: { name: string; meta: ResourceMeta | undefined; listable: string[] | undefined; want: string[] }[] = [
    { name: 'every field when the digest carries no field information', meta: clients, listable: undefined, want: clients.searchFields ?? [] },
    { name: 'a denied field drops out; a child\'s dotted field stays', meta: clients, listable: ['id', 'name', 'contactName'], want: ['name', 'contactName', 'clientContact.displayName'] },
    { name: 'a resource with no search fields', meta: { route: 'ships', fields: [] }, listable: undefined, want: [] },
    { name: 'no metadata', meta: undefined, listable: ['name'], want: [] },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(searchedFields(tt.meta, tt.listable ? new Set(tt.listable) : undefined)).toEqual(tt.want);
    });
  }
});

describe('deniedSearchFields', () => {
  it('names the resource\'s own fields the digest leaves out, never a child\'s', () => {
    expect(deniedSearchFields(clients, new Set(['id', 'name']))).toEqual(['contactName', 'contactEmail']);
    expect(deniedSearchFields(clients, undefined)).toEqual([]);
  });
});

describe('searchFieldLabel', () => {
  const headers = new Map([['contactEmail', 'Email']]);
  const cases: { name: string; field: string; want: string }[] = [
    { name: 'the configured header first', field: 'contactEmail', want: 'Email' },
    { name: 'else the field in title case', field: 'contactName', want: 'Contact Name' },
    { name: 'a child\'s dotted field under both names', field: 'clientContact.displayName', want: 'Client Contact Display Name' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(searchFieldLabel(tt.field, headers)).toBe(tt.want);
    });
  }
});

describe('the box\'s words', () => {
  it('the placeholder names the fields it searches', () => {
    expect(searchPlaceholder(['Name', 'Email'])).toBe('Search Name, Email');
    expect(searchPlaceholder([])).toBe('Search');
  });

  it('the hint names the fields the role leaves out, or says nothing', () => {
    expect(searchDeniedHint(['Contact Email'])).toBe('Not searched for your role: Contact Email');
    expect(searchDeniedHint([])).toBe('');
  });
});
