import { FieldName } from '@cccteam/resource-angular/types';

import { singleColumnConfig } from './configs';

// A column is a field column, a button column or an icon column, and the three are
// exclusive by type: a config naming both a button and an icon does not compile, which
// the directive below proves at build time.

describe('singleColumnConfig', () => {
  it('builds a field column, a button column and an icon column', () => {
    expect(singleColumnConfig({ id: 'name' as FieldName }).buttonConfig).toBeUndefined();
    expect(singleColumnConfig({ id: 'view' as FieldName, buttonConfig: { label: 'View', icon: 'arrow_forward' } }).buttonConfig?.icon).toBe(
      'arrow_forward',
    );
    expect(singleColumnConfig({ id: 'status' as FieldName, iconConfig: { icons: { over: 'warning' } } }).iconConfig?.icons['over']).toBe(
      'warning',
    );
  });

  it('refuses a column that is both a button and an icon, at compile time', () => {
    const both = {
      id: 'status' as FieldName,
      buttonConfig: { label: 'View', icon: 'arrow_forward' },
      iconConfig: { icons: { over: 'warning' } },
    };
    // @ts-expect-error a column is a button or an icon, never both
    expect(() => singleColumnConfig(both)).not.toThrow();
  });
});
