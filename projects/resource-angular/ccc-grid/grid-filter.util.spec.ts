import {
  composeFilter,
  conditionOf,
  filterControlFor,
  filterFields,
  indexedFilterActive,
  isComplete,
  withoutOrphanedCompanions,
} from './grid-filter.util';
import { ColumnFilter, ColumnFilterability, FilterControl } from './grid-types';

// The grid's filters as the server sees them: which fields a grammar string names, when
// a companion column may join, and how the column filters become one request filter.

const filterability: ColumnFilterability = {
  title: 'always',
  statusId: 'always',
  fee: 'withIndexed',
  notes: 'withIndexed',
  daysLeft: undefined,
};

const filter = (field: string, operator: ColumnFilter['operator'], value = ''): ColumnFilter => ({ field, operator, value });

describe('filterFields', () => {
  const cases: { name: string; filter: string; want: string[] }[] = [
    { name: 'one condition', filter: 'statusId:eq:open', want: ['statusId'] },
    { name: 'conditions joined by AND and OR', filter: 'statusId:eq:open,hazard:gt:2|title:eq:x', want: ['statusId', 'hazard', 'title'] },
    { name: 'parenthesized groups', filter: '(statusId:eq:open),(fee:gt:100,fee:lt:200)', want: ['statusId', 'fee'] },
    { name: 'a list value is not a field', filter: 'kindId:in:(rescue,salvage)', want: ['kindId'] },
    { name: 'a timestamp value with colons is not a field', filter: 'deadline:gt:2026-09-14T10:00:00Z', want: ['deadline'] },
    { name: 'a timestamp inside a list is not a field either', filter: 'deadline:in:(2026-01-01T00:00:00Z,2026-02-01T00:00:00Z)', want: ['deadline'] },
    { name: 'a null test', filter: 'squadronName:isnull', want: ['squadronName'] },
    { name: 'nothing', filter: '', want: [] },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(filterFields(tt.filter)).toEqual(tt.want);
    });
  }
});

describe('isComplete', () => {
  const cases: { name: string; filter: ColumnFilter; want: boolean }[] = [
    { name: 'a value for a comparison', filter: filter('title', 'eq', 'Convoy'), want: true },
    { name: 'no value for a comparison', filter: filter('title', 'eq', '  '), want: false },
    { name: 'a null test needs none', filter: filter('notes', 'isnull'), want: true },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(isComplete(tt.filter)).toBe(tt.want);
    });
  }
});

describe('indexedFilterActive', () => {
  const cases: { name: string; filters: ColumnFilter[]; external: string[]; want: boolean }[] = [
    { name: 'a filter on an always column', filters: [filter('statusId', 'eq', 'open')], external: [], want: true },
    { name: 'an incomplete filter on an always column counts for nothing', filters: [filter('statusId', 'eq', '')], external: [], want: false },
    { name: 'a companion filter alone', filters: [filter('fee', 'gt', '100')], external: [], want: false },
    { name: "the page's own filter names an always field", filters: [], external: ['statusId'], want: true },
    { name: "the page's own filter names only a companion field", filters: [], external: ['fee'], want: false },
    { name: 'nothing', filters: [], external: [], want: false },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(indexedFilterActive(tt.filters, filterability, tt.external)).toBe(tt.want);
    });
  }
});

describe('filterControlFor', () => {
  const cases: { name: string; column: { id: string; filterable?: boolean }; indexedActive: boolean; want: FilterControl }[] = [
    { name: 'an always column', column: { id: 'title' }, indexedActive: false, want: 'enabled' },
    { name: 'a companion column with no indexed filter waits', column: { id: 'fee' }, indexedActive: false, want: 'needsIndexed' },
    { name: 'a companion column beside an indexed filter', column: { id: 'fee' }, indexedActive: true, want: 'enabled' },
    { name: 'a column the server does not filter', column: { id: 'daysLeft' }, indexedActive: true, want: 'none' },
    { name: 'a column the metadata does not know', column: { id: 'view' }, indexedActive: true, want: 'none' },
    { name: 'the config opts an always column out', column: { id: 'title', filterable: false }, indexedActive: true, want: 'none' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(filterControlFor(tt.column, filterability, tt.indexedActive)).toBe(tt.want);
    });
  }
});

describe('withoutOrphanedCompanions', () => {
  const cases: { name: string; filters: ColumnFilter[]; external: string[]; want: string[] }[] = [
    { name: 'companions stay beside an indexed filter', filters: [filter('statusId', 'eq', 'open'), filter('fee', 'gt', '100')], external: [], want: ['statusId', 'fee'] },
    { name: 'clearing the last indexed filter clears the companions', filters: [filter('fee', 'gt', '100'), filter('notes', 'isnotnull')], external: [], want: [] },
    { name: "companions stay when the page's own filter is indexed", filters: [filter('fee', 'gt', '100')], external: ['statusId'], want: ['fee'] },
    { name: 'an always filter alone stays', filters: [filter('title', 'eq', 'Convoy')], external: [], want: ['title'] },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(withoutOrphanedCompanions(tt.filters, filterability, tt.external).map((f) => f.field)).toEqual(tt.want);
    });
  }
});

describe('conditionOf', () => {
  const cases: { name: string; filter: ColumnFilter; want: unknown }[] = [
    { name: 'a comparison trims its value', filter: filter('title', 'eq', ' Convoy '), want: { field: 'title', op: 'eq', value: 'Convoy' } },
    { name: 'a list splits on commas and drops blanks', filter: filter('kindId', 'in', 'rescue, salvage,,'), want: { field: 'kindId', op: 'in', value: ['rescue', 'salvage'] } },
    { name: 'a null test carries no value', filter: filter('notes', 'isnull', 'ignored'), want: { field: 'notes', op: 'isnull', value: undefined } },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(conditionOf(tt.filter)).toEqual(tt.want as never);
    });
  }
});

describe('composeFilter', () => {
  const cases: { name: string; page: string; filters: ColumnFilter[]; want: string }[] = [
    { name: 'nothing', page: '', filters: [], want: '' },
    { name: "the page's filter alone", page: 'sectorId:eq:anvil', filters: [], want: 'sectorId:eq:anvil' },
    { name: 'column filters alone, ANDed', page: '', filters: [filter('statusId', 'eq', 'open'), filter('fee', 'gt', '100')], want: 'statusId:eq:open,fee:gt:100' },
    { name: 'both, as parenthesized groups', page: 'sectorId:eq:anvil', filters: [filter('statusId', 'eq', 'open')], want: '(sectorId:eq:anvil),(statusId:eq:open)' },
    { name: 'an incomplete column filter is left out', page: '', filters: [filter('statusId', 'eq', ''), filter('title', 'eq', 'Convoy')], want: 'title:eq:Convoy' },
    { name: 'a list and a null test in the grammar', page: '', filters: [filter('kindId', 'in', 'rescue,salvage'), filter('notes', 'isnull')], want: 'kindId:in:(rescue,salvage),notes:isnull' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(composeFilter(tt.page, tt.filters)).toBe(tt.want);
    });
  }
});
