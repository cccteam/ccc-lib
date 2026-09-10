import { FieldName } from '@cccteam/resource-angular/types';

import { displayFromOptions, matchOptions, optionColumns, PickerOption } from './enumerated-options';

describe('optionColumns', () => {
  const cases: {
    name: string;
    listDisplay: FieldName[];
    viewDisplay: FieldName[];
    want: string[];
  }[] = [
    {
      name: 'the id alone when nothing is displayed',
      listDisplay: [],
      viewDisplay: [],
      want: ['id'],
    },
    {
      name: 'the id first, then the list and view columns',
      listDisplay: ['name' as FieldName],
      viewDisplay: ['name' as FieldName, 'contactCount' as FieldName],
      want: ['id', 'name', 'contactCount'],
    },
    {
      name: 'a column named twice is asked for once',
      listDisplay: ['id' as FieldName, 'name' as FieldName],
      viewDisplay: ['name' as FieldName],
      want: ['id', 'name'],
    },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(optionColumns({ listDisplay: tt.listDisplay, viewDisplay: tt.viewDisplay })).toEqual(tt.want);
    });
  }
});

describe('matchOptions', () => {
  const halvard: PickerOption = { id: '10000000-0000-4000-8000-000000000001', display: 'Halvard Freight' };
  const meridian: PickerOption = { id: '10000000-0000-4000-8000-000000000002', display: 'Meridian Survey Office' };
  const options = [halvard, meridian];
  const ids = (matched: PickerOption[]): string[] => matched.map((o) => o.id);

  const cases: { name: string; query: string; want: PickerOption[] }[] = [
    { name: 'an empty query keeps every option', query: '', want: options },
    { name: 'a blank query keeps every option', query: '   ', want: options },
    { name: 'the display matches as a substring regardless of case', query: 'SURVEY', want: [meridian] },
    { name: 'the id matches as a substring, so one can be pasted', query: '8000-000000000001', want: [halvard] },
    { name: 'a query matching nothing empties the list', query: 'zephyr', want: [] },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(ids(matchOptions(options, tt.query))).toEqual(ids(tt.want));
    });
  }
});

describe('displayFromOptions', () => {
  const standard: PickerOption = { id: 'standard', display: 'Standard sheet' };
  const cases: { name: string; value: string; want: PickerOption }[] = [
    { name: 'a value in the list shows its display', value: 'standard', want: standard },
    { name: 'a value outside the list shows as itself, never blank', value: 'legacy-9', want: { id: 'legacy-9', display: 'legacy-9' } },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(displayFromOptions([standard], tt.value)).toEqual(tt.want);
    });
  }
});
