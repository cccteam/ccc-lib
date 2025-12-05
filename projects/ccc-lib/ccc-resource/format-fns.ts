import { FormatType } from '@cccteam/ccc-lib/types';
import { format, isValid, parseISO } from 'date-fns';

export type FormatterFn = (value: string) => string;

export const simpleSlashDateFormatter = (value: string): string => {
  if (!value) return '';
  const parsedDate = parseISO(value.toString());

  if (isValid(parsedDate)) {
    return format(parsedDate, 'M/d/yyyy');
  }

  console.error('Applying simpleSlashDateFormatter to invalid date value:', value);
  return value.toString();
};

export const ValueFormatters: Record<FormatType, FormatterFn> = {
  ['simpleSlashDateFormat']: simpleSlashDateFormatter,
};

export function applyFormatting(formatString: string, value: string): string {
  if (!value) return '';
  if (formatString in ValueFormatters) {
    return ValueFormatters[formatString as FormatType](value);
  }

  //default to formatting as a date with provided format string
  const parsedDate = parseISO(value.toString());

  if (isValid(parsedDate)) {
    return format(parsedDate, formatString);
  }

  return value.toString();
}

export function formatDateString(formatString: string, value: string): string {
  if (!value) return '';

  //default to formatting as a date with provided format string
  const parsedDate = parseISO(value.toString());

  if (isValid(parsedDate)) {
    return format(parsedDate, formatString);
  }

  return value.toString();
}
