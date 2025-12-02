// Shared types and constants used across the ccc-resource module
// This file exists to break circular dependencies between types and ccc-resource

export const defaultEmptyFieldValue = '-';

export type NullBoolean = null | true | false;

export type ConcatFn = 'space-concat' | 'hyphen-concat' | 'space-hyphen-concat' | 'hyphen-space-concat';
