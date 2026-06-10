import { useState } from "react";
import type {
  LearningProfile,
  ProblemDifficulty,
  SavedProblem,
} from "@/shared/types";
import { openProblemPage } from "@/shared/utils/problem-url";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { getPatternColorClasses } from "@/popup/utils/pattern-color";
import { DifficultyBadge } from "./DifficultyBadge";

interface PersistencePanelProps {
  saved: SavedProblem[];
  profile: LearningProfile | null;
  loading: boolean;
  onUnsave: (problemId: string) => void;
}

function isProblemDifficulty(value: string | undefined): value is ProblemDifficulty {
  return value === "Easy" || value === "Medium" || value === "Hard";
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PersistencePanel({
  saved,
  profile,
  loading,
  onUnsave,
}: PersistencePanelProps) {
  const { t } = useTranslation();
  const [profileExpanded, setProfileExpanded] = useState(false);

  const topPatterns =
    profile ?
      Object.entries(profile.patterns)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const hasSaved = saved.length > 0;
  const hasProfile =
    profile !== null &&
    (profile.viewedProblems > 0 ||
      profile.requestedHints > 0 ||
      topPatterns.length > 0);

  if (loading) {
    return (
      <section className="card">
        <div className="skeleton h-4 w-1/3 rounded-md" />
        <div className="mt-3 skeleton h-8 w-full rounded-md" />
      </section>
    );
  }

  if (!hasSaved && !hasProfile) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasSaved && (
        <section className="card">
          <h3 className="section-title">{t("savedProblems")}</h3>
          <ul className="mt-3 space-y-2">
            {saved.map((item) => (
              <li
                key={item.problemId}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
              >
                <button
                  type="button"
                  disabled={!item.url}
                  title={!item.url ? t("recentProblemNoUrl") : undefined}
                  onClick={() => openProblemPage(item)}
                  className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {item.title}
                  </span>
                  {isProblemDifficulty(item.difficulty) && (
                    <span className="mt-1 inline-block">
                      <DifficultyBadge difficulty={item.difficulty} />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onUnsave(item.problemId)}
                  className="shrink-0 text-[11px] font-medium text-slate-500 hover:text-red-600"
                >
                  {t("unsaveProblem")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasProfile && profile && (
        <section className="card">
          <button
            type="button"
            onClick={() => setProfileExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-2 text-left"
            aria-expanded={profileExpanded}
          >
            <h3 className="section-title">{t("learningProfile")}</h3>
            {topPatterns.length > 0 && <ChevronIcon expanded={profileExpanded} />}
          </button>

          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
              <dd className="text-2xl font-bold text-slate-900">
                {profile.viewedProblems}
              </dd>
              <dt className="mt-0.5 text-xs text-slate-500">{t("problemsViewed")}</dt>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
              <dd className="text-2xl font-bold text-slate-900">
                {profile.requestedHints}
              </dd>
              <dt className="mt-0.5 text-xs text-slate-500">{t("hintsRequested")}</dt>
            </div>
          </dl>

          {topPatterns.length > 0 && profileExpanded && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500">{t("topPatterns")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {topPatterns.map(([name, count]) => (
                  <li
                    key={name}
                    title={name}
                    className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getPatternColorClasses(name)}`}
                  >
                    <span className="line-clamp-2">{name}</span>
                    <span className="shrink-0 rounded-full bg-white/70 px-1.5 text-[10px] font-semibold">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
