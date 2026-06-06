import type { ProblemDifficulty } from "@/shared/types";
import { useTranslation } from "@/popup/hooks/useTranslation";
import type { TranslationKey } from "@/popup/locales";

export interface DifficultyBadgeProps {
  difficulty: ProblemDifficulty;
  className?: string;
}

const DIFFICULTY_LABEL_KEYS: Record<ProblemDifficulty, TranslationKey> = {
  Easy: "difficultyEasy",
  Medium: "difficultyMedium",
  Hard: "difficultyHard",
};

const DIFFICULTY_STYLES: Record<ProblemDifficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-100 text-amber-700 ring-amber-200",
  Hard: "bg-red-100 text-red-700 ring-red-200",
};

export function DifficultyBadge({ difficulty, className = "" }: DifficultyBadgeProps) {
  const { t } = useTranslation();
  const label = t(DIFFICULTY_LABEL_KEYS[difficulty]);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-inset ${DIFFICULTY_STYLES[difficulty]} ${className}`}
      aria-label={`${t("difficulty")}: ${label}`}
    >
      {label}
    </span>
  );
}
