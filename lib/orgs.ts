export interface Org {
  id: string;
  label: string;
  color: string;
  match: RegExp;
}

export const ORGS: Org[] = [
  { id: "openai", label: "OpenAI", color: "#10a37f", match: /openai|^gpt|^o\d/i },
  { id: "anthropic", label: "Anthropic", color: "#e8875b", match: /anthropic|claude/i },
  { id: "google", label: "Google", color: "#4f8bff", match: /google|deepmind|gemini|gemma/i },
  { id: "meta", label: "Meta", color: "#1877f2", match: /meta|llama|muse/i },
  { id: "xai", label: "xAI", color: "#e5e7eb", match: /\bx-?ai\b|grok/i },
  { id: "deepseek", label: "DeepSeek", color: "#6c7dff", match: /deepseek/i },
  { id: "alibaba", label: "Alibaba", color: "#ff6a00", match: /alibaba|qwen/i },
  { id: "mistral", label: "Mistral", color: "#ffb000", match: /mistral|magistral|codestral/i },
  { id: "moonshot", label: "Moonshot", color: "#b388ff", match: /moonshot|kimi/i },
  { id: "zhipu", label: "Z.ai", color: "#00d1c1", match: /zhipu|z\.ai|z-ai|glm/i },
  { id: "minimax", label: "MiniMax", color: "#ff4d8d", match: /minimax/i },
  { id: "amazon", label: "Amazon", color: "#ff9900", match: /amazon|nova/i },
  { id: "microsoft", label: "Microsoft", color: "#00a4ef", match: /microsoft|phi-?\d/i },
  { id: "nvidia", label: "NVIDIA", color: "#76b900", match: /nvidia|nemotron/i },
  { id: "cohere", label: "Cohere", color: "#d18ee2", match: /cohere|command/i },
  { id: "bytedance", label: "ByteDance", color: "#3c8cff", match: /bytedance|seed|doubao/i },
  { id: "tencent", label: "Tencent", color: "#1fbf8f", match: /tencent|hunyuan/i },
  { id: "xiaomi", label: "Xiaomi", color: "#ff7a1a", match: /xiaomi|mimo/i },
  { id: "stepfun", label: "StepFun", color: "#5ee7ff", match: /stepfun|^step[\s-]/i },
];

export const OTHER_ORG: Org = { id: "other", label: "Other", color: "#8b93a7", match: /$^/ };

const byId = new Map(ORGS.map((o) => [o.id, o]));

export function orgOf(id: string): Org {
  return byId.get(id) ?? OTHER_ORG;
}

/** Resolve an org from any combination of org name and model name hints. */
export function resolveOrg(...hints: (string | undefined)[]): string {
  for (const hint of hints) {
    if (!hint) continue;
    const hit = ORGS.find((o) => o.match.test(hint));
    if (hit) return hit.id;
  }
  return OTHER_ORG.id;
}
