/**
 * Key-Sorted Semantic Diff Engine for ScrubPad
 * 
 * Provides deterministic object key sorting and line-by-line diffing.
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineA?: number;
  lineB?: number;
}

export interface DiffSummary {
  lines: DiffLine[];
  additions: number;
  deletions: number;
  unchanged: number;
  identical: boolean;
}

/**
 * Recursively sort keys of an object alphabetically
 */
export function sortObjectKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => sortObjectKeys(item));
  }

  const keys = Object.keys(value as Record<string, unknown>).sort();
  const sortedObj: Record<string, unknown> = {};

  for (const key of keys) {
    sortedObj[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
  }

  return sortedObj;
}

/**
 * Sort keys in a JSON string (or return original string if not valid JSON)
 */
export function sortJsonString(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    const sorted = sortObjectKeys(parsed);
    return JSON.stringify(sorted, null, 2);
  } catch {
    return jsonStr;
  }
}

/**
 * Compute line-by-line diff between two strings using Longest Common Subsequence (LCS)
 */
export function computeLineDiff(textA: string, textB: string): DiffSummary {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');

  const m = linesA.length;
  const n = linesB.length;

  // Standard LCS DP Matrix
  // Using 1D/2D array bounded by length to prevent excessive memory usage
  const maxLines = 2000;
  const clampedM = Math.min(m, maxLines);
  const clampedN = Math.min(n, maxLines);

  const dp: number[][] = Array.from({ length: clampedM + 1 }, () => new Array(clampedN + 1).fill(0));

  for (let i = 1; i <= clampedM; i++) {
    for (let j = 1; j <= clampedN; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = clampedM;
  let j = clampedN;
  const reversedDiff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      reversedDiff.push({
        type: 'unchanged',
        content: linesA[i - 1],
        lineA: i,
        lineB: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversedDiff.push({
        type: 'added',
        content: linesB[j - 1],
        lineB: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      reversedDiff.push({
        type: 'removed',
        content: linesA[i - 1],
        lineA: i,
      });
      i--;
    }
  }

  const diffLines = reversedDiff.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of diffLines) {
    if (line.type === 'added') additions++;
    else if (line.type === 'removed') deletions++;
    else unchanged++;
  }

  return {
    lines: diffLines,
    additions,
    deletions,
    unchanged,
    identical: additions === 0 && deletions === 0,
  };
}
