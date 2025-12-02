import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelCaseToTitle',
})
export class CamelCaseToTitlePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return value;
    }

    // If the entire string is uppercase (acronym), return as-is
    if (value === value.toUpperCase() && !/[0-9]/.test(value)) {
      return value;
    }

    // Insert space before uppercase letters
    let transformed = value.replace(/([A-Z])/g, ' $1');

    // Insert space before digits following a letter
    transformed = transformed.replace(/([a-zA-Z])([0-9])/g, '$1 $2');

    // Trim and capitalize the first letter
    transformed = transformed.trim();
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);

    return transformed;
  }
}
