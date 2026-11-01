import { describe, it, expect } from 'vitest';
import { sortObjectKeys, sortJsonString, computeLineDiff } from '../src/core/diff';

describe('Diff and Key Sorter', () => {
  it('should sort object keys recursively in alphabetical order', () => {
    const unordered = {
      z: 1,
      a: {
        d: 'val',
        b: 'val',
      },
      m: [ { y: 2, x: 1 } ]
    };

    const sorted = sortObjectKeys(unordered) as Record<string, unknown>;
    expect(Object.keys(sorted)).toEqual(['a', 'm', 'z']);
    expect(Object.keys(sorted.a as object)).toEqual(['b', 'd']);
  });

  it('should sort JSON strings cleanly', () => {
    const json = '{"beta": 2, "alpha": 1}';
    const sorted = sortJsonString(json);
    expect(sorted).toBe('{\n  "alpha": 1,\n  "beta": 2\n}');
  });

  it('should compute line diff additions, deletions and identical states', () => {
    const textA = 'line 1\nline 2\nline 3';
    const textB = 'line 1\nline 2 updated\nline 3\nline 4';

    const diff = computeLineDiff(textA, textB);
    expect(diff.identical).toBe(false);
    expect(diff.additions).toBeGreaterThan(0);
    expect(diff.deletions).toBeGreaterThan(0);

    const identicalDiff = computeLineDiff(textA, textA);
    expect(identicalDiff.identical).toBe(true);
    expect(identicalDiff.additions).toBe(0);
    expect(identicalDiff.deletions).toBe(0);
  });
});
