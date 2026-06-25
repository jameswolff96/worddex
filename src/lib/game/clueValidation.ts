/**
 * LCS-based clue validation.
 * Block if: substring containment in either direction, OR
 * longest common substring ≥ 4 chars AND ≥ 60% of the shorter word.
 *
 * Thresholds are a starting point — run validateWordPairs() against the
 * full word bank before launch and tune as needed.
 */

export function longestCommonSubstring(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let max = 0;
  const dp: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev + 1;
        if (dp[j] > max) max = dp[j];
      } else {
        dp[j] = 0;
      }
      prev = temp;
    }
  }
  return max;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/s$/, ""); // strip trailing 's'
}

export type ClueCheckResult =
  | { blocked: false }
  | { blocked: true; reason: string };

export function checkClueToken(token: string, answer: string): ClueCheckResult {
  const t = normalize(token);
  const a = normalize(answer);

  if (!t) return { blocked: false };

  // Direct substring containment in either direction
  if (a.includes(t) || t.includes(a)) {
    return { blocked: true, reason: "Clue overlaps with the answer" };
  }

  const lcs = longestCommonSubstring(t, a);
  const threshold = Math.max(4, Math.ceil(0.6 * Math.min(t.length, a.length)));

  if (lcs >= threshold) {
    return { blocked: true, reason: "Clue is too similar to the answer" };
  }

  return { blocked: false };
}

export function checkClue(clueText: string, answer: string): ClueCheckResult {
  const tokens = clueText.trim().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const result = checkClueToken(token, answer);
    if (result.blocked) return result;
  }
  return { blocked: false };
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Given a set of already-used word tokens and a new clue message,
 * returns how many new words it costs and which tokens are new vs. free.
 */
export function analyzeClueMessage(
  text: string,
  usedWords: Set<string>
): { newWords: string[]; freeWords: string[]; cost: number } {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const newWords: string[] = [];
  const freeWords: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (usedWords.has(lower)) {
      freeWords.push(token);
    } else {
      newWords.push(token);
    }
  }

  return { newWords, freeWords, cost: newWords.length };
}
