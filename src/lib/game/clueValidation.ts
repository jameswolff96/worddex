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

function tokenize(text: string): string[] {
  // Split on whitespace and punctuation that acts as a word boundary (/, -, ., etc.)
  // Apostrophes are kept so contractions stay whole (it's, don't).
  return text
    .trim()
    .split(/[\s/\-.,:;!?()\[\]{}"]+/)
    .map((tok) => tok.replace(/^[^\wÀ-ɏ']+|[^\wÀ-ɏ']+$/g, ""))
    .filter(Boolean);
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
  const tokens = tokenize(clueText);
  for (const token of tokens) {
    const result = checkClueToken(token, answer);
    if (result.blocked) return result;
  }
  return { blocked: false };
}

export function countWords(text: string): number {
  return tokenize(text).length;
}

/**
 * Given a set of already-used word tokens and a new clue message,
 * returns how many new words it costs and which tokens are new vs. free.
 * Punctuation attached to word edges is stripped before comparison/storage.
 */
export function analyzeClueMessage(
  text: string,
  usedWords: Set<string>
): { newWords: string[]; freeWords: string[]; cost: number } {
  const tokens = tokenize(text);
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
