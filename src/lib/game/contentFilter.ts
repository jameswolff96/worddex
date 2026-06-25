// Words are matched against whole tokens (whitespace-split, lowercased, non-alpha stripped).
// Leet-speak normalisation covers common substitutions (@ → a, 3 → e, etc.).

// Always blocked regardless of lobby settings.
const HATE_SPEECH: ReadonlySet<string> = new Set([
  // Racial / ethnic slurs
  "nigger", "nigga", "niggah", "chink", "gook", "spic", "spick", "wetback",
  "kike", "hymie", "raghead", "towelhead", "sandnigger", "beaner", "zipperhead",
  "coon", "jigaboo", "porch monkey", "jungle bunny", "sambo", "pickaninny",
  "cracker", "honky", "gringo", "slope", "slant", "redskin", "injun",
  // Homophobic / transphobic slurs
  "faggot", "fag", "dyke", "tranny", "shemale", "heshe",
  // Religious / national hate
  "islamofascist", "christcuck", "jewbag",
  // Ableist slurs used as hate speech
  "retard", "retarded",
  // Misc targeted slurs
  "whore", "cunt", "skank",
]);

// Blocked only when is_18_plus_mode is false.
const PROFANITY: ReadonlySet<string> = new Set([
  "fuck", "fucker", "fucking", "fucked", "motherfucker", "motherfucking",
  "shit", "shitting", "shitty", "bullshit",
  "ass", "asshole", "arsehole", "arse",
  "bitch", "bitches", "bitching",
  "cock", "cocks", "cocksucker",
  "dick", "dicks",
  "pussy", "pussies",
  "piss", "pissed", "pissing",
  "bastard", "bastards",
  "damn", "goddamn", "goddam",
  "crap", "crappy",
  "tit", "tits", "boob", "boobs",
  "cum", "jizz",
  "wank", "wanker", "wanking",
  "bollocks", "twat",
]);

function normalizeLeet(word: string): string {
  return word
    .replace(/@/g, "a")
    .replace(/4/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/!/g, "i")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/\+/g, "t");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9@!$]/g, ""))
    .filter(Boolean);
}

export type FilterResult = { blocked: false } | { blocked: true; reason: string };

export function filterContent(text: string, is18Plus: boolean): FilterResult {
  const tokens = tokenize(text);

  for (const raw of tokens) {
    const word = normalizeLeet(raw);

    if (HATE_SPEECH.has(word)) {
      return { blocked: true, reason: "That message contains prohibited language." };
    }

    if (!is18Plus && PROFANITY.has(word)) {
      return {
        blocked: true,
        reason: "Profanity is not allowed in this lobby. The host can enable 18+ mode to allow it.",
      };
    }
  }

  return { blocked: false };
}
