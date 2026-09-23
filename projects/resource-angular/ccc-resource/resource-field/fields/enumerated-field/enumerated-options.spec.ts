import { FieldName } from '@cccteam/resource-angular/types';
import { ApiError } from '@cccteam/resource';

import { displayFromOptions, matchOptions, optionColumns, PickerOption, pickerRefusal, withChosen } from './enumerated-options';

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

describe('withChosen', () => {
  const dockOne: PickerOption = { id: '60000000-0000-4000-8000-000000000001', display: 'Anvil Dock One' };
  const quarantine: PickerOption = { id: '60000000-0000-4000-8000-000000000002', display: 'Quarantine Bay' };
  const cinderYard: PickerOption = { id: '60000000-0000-4000-8000-000000000004', display: 'Cinder Yard' };
  const cases: { name: string; page: PickerOption[]; chosen: PickerOption | undefined; want: PickerOption[] }[] = [
    { name: 'the page alone when nothing is chosen', page: [dockOne, quarantine], chosen: undefined, want: [dockOne, quarantine] },
    { name: 'the page alone when it holds the chosen row', page: [dockOne, quarantine], chosen: quarantine, want: [dockOne, quarantine] },
    { name: 'the chosen row ahead of a page that does not hold it', page: [dockOne, quarantine], chosen: cinderYard, want: [cinderYard, dockOne, quarantine] },
    { name: 'the chosen row alone on an empty page', page: [], chosen: cinderYard, want: [cinderYard] },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(withChosen(tt.page, tt.chosen)).toEqual(tt.want);
    });
  }
});

describe('pickerRefusal', () => {
  const cases: { name: string; error: unknown; want: string | undefined }[] = [
    { name: 'nothing while the picker works', error: undefined, want: undefined },
    {
      name: 'a 403 says the picker is not available, in the server\'s words',
      error: new ApiError('GET', '/api/sectors/anvil/client-rosters', 403, { message: 'no List grant on ClientRosters' }),
      want: 'This picker is not available to you: no List grant on ClientRosters',
    },
    {
      name: 'a 400 says the server refused the request, in its words: the way out is on the struct or in the config',
      error: new ApiError('GET', '/api/berths', 400, { message: 'Berths serves at most 50 rows per page and declares no order; add a sort' }),
      want: 'The server refused this picker\'s request: Berths serves at most 50 rows per page and declares no order; add a sort',
    },
    { name: 'any other failure is a plain sentence', error: new Error('network down'), want: 'This picker could not be loaded: network down' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(pickerRefusal(tt.error)).toBe(tt.want);
    });
  }
});
