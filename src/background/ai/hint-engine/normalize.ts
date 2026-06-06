import type { HintLevel, HintLevelContent } from "@/shared/types/hints";
import { HINT_LEVEL_LABELS } from "@/shared/types/hints";

const REQUIRED_LEVELS: HintLevel[] = [1, 2, 3];

/**
 * Pads missing levels or trims to exactly three hints in order.
 */
export function toThreeHintTuple(
  hints: HintLevelContent[],
  maxLevel: HintLevel = 3,
): [HintLevelContent, HintLevelContent, HintLevelContent] | null {
  const byLevel = new Map(hints.map((h) => [h.level, h]));
  const result: HintLevelContent[] = [];

  for (const level of REQUIRED_LEVELS) {
    if (level > maxLevel) {
      result.push({
        level,
        label: HINT_LEVEL_LABELS[level],
        text: "",
      });
      continue;
    }

    const hint = byLevel.get(level);
    if (!hint?.text) return null;
    result.push(hint);
  }

  return result as [HintLevelContent, HintLevelContent, HintLevelContent];
}

/**
 * Returns only hints up to the requested level for progressive reveal.
 */
export function getHintsUpToLevel(
  hints: HintLevelContent[],
  level: HintLevel,
): HintLevelContent[] {
  return hints.filter((h) => h.level <= level && h.text.length > 0);
}
