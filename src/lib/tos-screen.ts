/**
 * Heuristic TOS / legal-risk screening for catalog candidates.
 * Flags clearly prohibited categories — not general adult or extreme fiction themes.
 * See docs/tos-review-policy.md.
 */

export type TosScreenResult = {
  hold: boolean;
  matchedRules: string[];
};

type TosRule = {
  id: string;
  label: string;
  patterns: RegExp[];
};

const TOS_RULES: TosRule[] = [
  {
    id: "prohibited_minors",
    label: "Content suggesting minors or underage sexual material",
    patterns: [
      /\b(loli|lolita|lolicon|shota|shotacon|underage|preteen|pre-teen)\b/i,
      /\b(pedophil|paedophil|pedo\b|jailbait)\b/i,
      /\b(child\s*porn|cp\s*porn)\b/i,
      /\b(teen\s*(sex|porn|nude))\b/i,
    ],
  },
  {
    id: "bestiality",
    label: "Bestiality / zoophilia",
    patterns: [/\b(bestiality|beastiality|zoophil|zoophilia)\b/i],
  },
  {
    id: "real_person_nonconsent",
    label: "Non-consensual real-person imagery (leaks, deepfakes, revenge porn)",
    patterns: [
      /\b(revenge\s*porn|deepfake\s*porn|deepfakes?\s+of)\b/i,
      /\b(celebrity\s+leak|leaked\s+nudes|hidden\s+camera\s+porn)\b/i,
      /\b(real\s+(rape|sex\s+tape)|actual\s+rape)\b/i,
    ],
  },
  {
    id: "illegal_violence",
    label: "Illegal violence / snuff presented as real",
    patterns: [/\b(snuff\s+film|real\s+snuff|actual\s+snuff)\b/i],
  },
];

function normalizeText(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join("\n").toLowerCase();
}

function mentionsUnderageAge(text: string): boolean {
  const re = /\b(\d{1,2})\s*(yo|y\/o|years?\s*old)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const age = Number.parseInt(match[1], 10);
    if (age > 0 && age < 18) return true;
  }
  return false;
}

export function screenCandidateText(text: string): TosScreenResult {
  const haystack = text.toLowerCase();
  const matchedRules: string[] = [];

  for (const rule of TOS_RULES) {
    if (rule.patterns.some((re) => re.test(haystack))) {
      matchedRules.push(rule.id);
    }
  }

  if (mentionsUnderageAge(text) && !matchedRules.includes("prohibited_minors")) {
    matchedRules.push("prohibited_minors");
  }

  return { hold: matchedRules.length > 0, matchedRules };
}

export function screenCandidateFields(input: {
  title: string;
  outboundUrl?: string;
  message?: string | null;
  rawPayload?: unknown;
}): TosScreenResult {
  const payloadText = extractPayloadText(input.rawPayload);
  const combined = normalizeText([
    input.title,
    input.outboundUrl,
    input.message,
    payloadText,
  ]);
  return screenCandidateText(combined);
}

export function tosRuleLabel(ruleId: string): string {
  return TOS_RULES.find((r) => r.id === ruleId)?.label ?? ruleId;
}

function extractPayloadText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const o = raw as Record<string, unknown>;
  const chunks: string[] = [];
  if (typeof o.description === "string") chunks.push(o.description);
  if (typeof o.short_description === "string") chunks.push(o.short_description);
  if (typeof o.message === "string") chunks.push(o.message);
  if (typeof o.title === "string") chunks.push(o.title);
  if (Array.isArray(o.tags)) {
    chunks.push(o.tags.map((t) => String(t)).join(" "));
  }
  return chunks.join("\n");
}
