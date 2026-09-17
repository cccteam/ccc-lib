import { ApiError, FieldMeta, ResourceMeta } from '@cccteam/resource';
import { PageTurn } from '@cccteam/resource-angular/ccc-grid';
import { filterEligibility, listEmptyMessage, pageLabel, PagePosition, positionAfter } from './list-request';

// The list component's pure parts: which columns the server filters, where the page
// sits after a turn, and what an empty table says. The component itself is the wiring
// of these onto the store and the grid.

const field = (fieldName: string, extra: Partial<FieldMeta> = {}): FieldMeta =>
  ({ fieldName, displayType: 'string', required: false, isIndex: false, ...extra }) as FieldMeta;

const boards: ResourceMeta = {
  route: 'sectors/{sectorID}/mission-boards',
  fields: [
    field('id', { primaryKey: { ordinalPosition: 0 }, isIndex: true, filterable: 'always' }),
    field('title', { isIndex: true, filterable: 'always' }),
    field('fee', { filterable: 'withIndexed' }),
    field('daysLeft'),
  ],
};

describe('filterEligibility', () => {
  const cases: { name: string; meta: ResourceMeta | undefined; columns: string[]; want: Record<string, string | undefined> }[] = [
    {
      name: 'each column takes its field\'s filterable',
      meta: boards,
      columns: ['title', 'fee', 'daysLeft'],
      want: { title: 'always', fee: 'withIndexed' },
    },
    { name: 'an action column and a renamed duplicate are absent', meta: boards, columns: ['view', 'title_1'], want: {} },
    { name: 'no metadata, nothing filters', meta: undefined, columns: ['title'], want: {} },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(filterEligibility(tt.meta, tt.columns.map((id) => ({ id })))).toEqual(tt.want as never);
    });
  }
});

describe('positionAfter', () => {
  const cases: {
    name: string;
    position: PagePosition;
    turn: PageTurn | 'reload';
    leftRows: number;
    landed: { rows: number; total?: number };
    want: PagePosition;
  }[] = [
    { name: 'a first page starts at zero with its total', position: { offset: 50, total: 99 }, turn: 'first', leftRows: 25, landed: { rows: 25, total: 130 }, want: { offset: 0, total: 130 } },
    { name: 'next moves past the page left and keeps the total', position: { offset: 0, total: 130 }, turn: 'next', leftRows: 25, landed: { rows: 25 }, want: { offset: 25, total: 130 } },
    { name: 'prev moves back by the page landed on', position: { offset: 50, total: 130 }, turn: 'prev', leftRows: 25, landed: { rows: 25 }, want: { offset: 25, total: 130 } },
    { name: 'prev never goes below zero', position: { offset: 10, total: 130 }, turn: 'prev', leftRows: 10, landed: { rows: 25 }, want: { offset: 0, total: 130 } },
    { name: 'a reload stays put and takes a fresh total', position: { offset: 0, total: 130 }, turn: 'reload', leftRows: 25, landed: { rows: 25, total: 129 }, want: { offset: 0, total: 129 } },
    { name: 'a reload of a later page keeps the total it had', position: { offset: 25, total: 130 }, turn: 'reload', leftRows: 25, landed: { rows: 25 }, want: { offset: 25, total: 130 } },
    { name: 'a first page with no count carries no total', position: { offset: 0, total: 130 }, turn: 'first', leftRows: 0, landed: { rows: 25 }, want: { offset: 0, total: undefined } },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(positionAfter(tt.position, tt.turn, tt.leftRows, tt.landed)).toEqual(tt.want);
    });
  }
});

describe('listEmptyMessage', () => {
  const cases: { name: string; error: unknown; noColumns: boolean; want: string }[] = [
    { name: 'no error, an empty list', error: undefined, noColumns: false, want: 'No records found' },
    { name: 'the digest leaves no column', error: undefined, noColumns: true, want: 'Your permissions cover none of the columns on this page.' },
    {
      name: 'a refused list reads as a refusal',
      error: new ApiError('GET', '/api/mission-boards', 403, { message: 'no List on MissionBoards' }),
      noColumns: false,
      want: 'This list is not available to you: no List on MissionBoards',
    },
    {
      name: 'a refused filter or page size reads in the server\'s words',
      error: new ApiError('GET', '/api/mission-boards?limit=500', 400, { message: 'limit 500 exceeds the maximum of 200' }),
      noColumns: false,
      want: "The server refused this list's request: limit 500 exceeds the maximum of 200",
    },
    { name: 'any other failure names itself', error: new Error('network down'), noColumns: false, want: 'This list could not be loaded: network down' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(listEmptyMessage(tt.error, tt.noColumns)).toBe(tt.want);
    });
  }
});

describe('pageLabel', () => {
  const cases: { name: string; offset: number; rows: number; total: number | undefined; want: string }[] = [
    { name: 'the first page as a range of the total', offset: 0, rows: 25, total: 200, want: '1–25 of 200' },
    { name: 'a later page counts from the rows before it', offset: 25, rows: 25, total: 200, want: '26–50 of 200' },
    { name: 'the range alone when no total was asked', offset: 0, rows: 3, total: undefined, want: '1–3' },
    { name: 'an empty list', offset: 0, rows: 0, total: 0, want: 'No rows' },
    { name: 'an empty page of a list with rows elsewhere', offset: 50, rows: 0, total: 50, want: 'No rows here of 50' },
  ];

  for (const tt of cases) {
    it(tt.name, () => {
      expect(pageLabel(tt.offset, tt.rows, tt.total)).toBe(tt.want);
    });
  }
});
