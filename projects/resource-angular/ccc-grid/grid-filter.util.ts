import { ColumnFilter } from './grid-types';

function compareCellToFilterValue(cellValue: unknown, filterValue: string): number {
  const cellNum = typeof cellValue === 'number' ? cellValue : Number(cellValue);
  const filterNum = Number(filterValue);
  if (cellValue !== null && cellValue !== undefined && cellValue !== '' && !Number.isNaN(cellNum) && !Number.isNaN(filterNum)) {
    return cellNum - filterNum;
  }
  const cellStr = cellValue == null ? '' : String(cellValue);
  return cellStr.localeCompare(filterValue);
}

export function matchesFilter(cellValue: unknown, filter: ColumnFilter): boolean {
  const value = filter.value.trim();
  if (!value) {
    return true;
  }

  if (filter.operator === 'gt' || filter.operator === 'gte' || filter.operator === 'lt' || filter.operator === 'lte') {
    const cmp = compareCellToFilterValue(cellValue, value);
    switch (filter.operator) {
      case 'gt':
        return cmp > 0;
      case 'gte':
        return cmp >= 0;
      case 'lt':
        return cmp < 0;
      case 'lte':
        return cmp <= 0;
    }
  }

  const cell = cellValue == null ? '' : String(cellValue).toLowerCase();
  const needle = value.toLowerCase();
  switch (filter.operator) {
    case 'doesNotContain':
      return !cell.includes(needle);
    case 'equals':
      return cell === needle;
    case 'notEqual':
      return cell !== needle;
    case 'startsWith':
      return cell.startsWith(needle);
    case 'endsWith':
      return cell.endsWith(needle);
    case 'contains':
    default:
      return cell.includes(needle);
  }
}
