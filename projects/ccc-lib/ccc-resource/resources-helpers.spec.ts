import { isSubsequence } from './resources-helpers';

describe('isSubsequence', () => {
  it('matches characters that appear in order but not together', () => {
    expect(isSubsequence('getsep', 'get readi september')).toBe(true);
  });

  it('matches a plain substring', () => {
    expect(isSubsequence('readi', 'get readi september')).toBe(true);
  });

  it('rejects characters that appear out of order', () => {
    expect(isSubsequence('sepget', 'get readi september')).toBe(false);
  });

  it('rejects a character that is not there at all', () => {
    expect(isSubsequence('getz', 'get readi september')).toBe(false);
  });

  it('treats an empty needle as a match', () => {
    expect(isSubsequence('', 'get readi september')).toBe(true);
  });

  it('does not match a non-empty needle against an empty haystack', () => {
    expect(isSubsequence('get', '')).toBe(false);
  });

  it('is case sensitive, so callers normalize first', () => {
    expect(isSubsequence('GET', 'get readi september')).toBe(false);
  });
});
