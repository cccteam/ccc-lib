import { ColumnIconConfig, RecordData } from '@cccteam/ccc-lib/types';

const sourceRecord = Symbol('sourceRecord');

export type DisplayRow = RecordData & { [sourceRecord]?: RecordData };

export function toDisplayRow(record: RecordData): DisplayRow {
  return { ...record, [sourceRecord]: record };
}

export function evaluateOnSourceRecord(config: ColumnIconConfig | undefined): ColumnIconConfig | undefined {
  if (!config) {
    return undefined;
  }

  const source = (row: DisplayRow): RecordData => row[sourceRecord] ?? row;
  const { icon, tooltip } = config;
  const wrapped: ColumnIconConfig = { icon: (row) => icon(source(row)) };
  if (tooltip) {
    wrapped.tooltip = (row) => tooltip(source(row));
  }

  return wrapped;
}
