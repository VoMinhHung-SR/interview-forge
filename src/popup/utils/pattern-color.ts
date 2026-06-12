export type PatternColor = "violet" | "blue" | "emerald" | "amber" | "rose";

const PATTERN_RULES: Array<{ keywords: string[]; color: PatternColor }> = [
  { keywords: ["dynamic programming", "quy hoạch động", " dp"], color: "violet" },
  { keywords: ["two-pointer", "two pointer", "hai con trỏ"], color: "blue" },
  { keywords: ["graph", "bfs", "dfs", "đồ thị"], color: "emerald" },
  { keywords: ["binary search", "tìm kiếm nhị phân"], color: "amber" },
  { keywords: ["prefix", "suffix", "two-pass", "tiền tố", "hậu tố"], color: "rose" },
];

const COLOR_STYLES: Record<PatternColor, string> = {
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function getPatternColor(name: string): PatternColor {
  const lower = name.toLowerCase();
  for (const rule of PATTERN_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.color;
    }
  }
  return "violet";
}

export function getPatternColorClasses(name: string): string {
  return COLOR_STYLES[getPatternColor(name)];
}
