import aliases from "../data/aliases.json";

const SUFFIX_TOKENS =
  /[\s_-]+(max|xhigh|high|medium|low|minimal|none|unknown|thinking|reasoning|non-?thinking|preview|latest|instruct|chat|it|free|exp|experimental|\d+k|\d{4}(-?\d{2}-?\d{2})?|\d{8})$/i;

const aliasMap = aliases as Record<string, string>;

function stripSuffixes(s: string): string {
  let prev;
  do {
    prev = s;
    s = s.replace(SUFFIX_TOKENS, "").trim();
  } while (s !== prev);
  return s;
}

/** Collapse source-specific spellings ("Anthropic: Claude Opus 5.5", "claude-opus-5-5_max") to one key. */
export function canonicalKey(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/:free$/, "");
  s = s.replace(/^[a-z0-9 .-]+:\s+/, "");
  s = s.replace(/^[a-z0-9_.-]+\//, "");
  s = s.replace(/\([^)]*\)/g, " ").trim();
  s = s.replace(/(\d)p(\d)/g, "$1.$2");
  const key = stripSuffixes(s).replace(/[^a-z0-9]/g, "");
  return aliasMap[key] ?? key;
}

/** Human display name with provider prefixes, effort tags and slug suffixes removed. */
export function cleanName(raw: string): string {
  const s = raw
    .replace(/^[A-Za-z0-9 .-]+:\s+/, "")
    .replace(/^[a-z0-9_.-]+\//, "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  return /[_]|^[a-z0-9.-]+$/.test(s) ? stripSuffixes(s) : s;
}
