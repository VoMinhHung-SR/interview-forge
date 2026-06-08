import type {
  LearningProfile,
  ProblemDifficulty,
  RecentProblem,
  SavedProblem,
} from "@/shared/types";
import { openProblemPage } from "@/shared/utils/problem-url";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { DifficultyBadge } from "./DifficultyBadge";

const MAX_RECENT_DISPLAY = 3;

const SECTION_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900";

interface PersistencePanelProps {
  recent: RecentProblem[];
  saved: SavedProblem[];
  profile: LearningProfile | null;
  loading: boolean;
  onUnsave: (problemId: string) => void;
}

function isProblemDifficulty(value: string | undefined): value is ProblemDifficulty {
  return value === "Easy" || value === "Medium" || value === "Hard";
}

function formatRelativeTime(timestamp: number, locale: string): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return locale === "vi" ? "Vừa xong" : "Just now";
  if (minutes < 60) return locale === "vi" ? `${minutes} phút trước` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "vi" ? `${hours} giờ trước` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "vi" ? `${days} ngày trước` : `${days}d ago`;
}

export function PersistencePanel({
  recent,
  saved,
  profile,
  loading,
  onUnsave,
}: PersistencePanelProps) {
  const { t, locale } = useTranslation();

  const topPatterns =
    profile ?
      Object.entries(profile.patterns)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const hasRecent = recent.length > 0;
  const hasSaved = saved.length > 0;
  const hasProfile =
    profile !== null &&
    (profile.viewedProblems > 0 ||
      profile.requestedHints > 0 ||
      topPatterns.length > 0);

  if (loading) {
    return (
      <section className={SECTION_CLASS}>
        <div className="skeleton h-4 w-1/3 rounded-md" />
        <div className="mt-3 skeleton h-8 w-full rounded-md" />
      </section>
    );
  }

  if (!hasRecent && !hasSaved && !hasProfile) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasRecent && (
        <section className={SECTION_CLASS}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("recentProblems")}
          </h3>
          <ul className="mt-3 space-y-2">
            {recent.slice(0, MAX_RECENT_DISPLAY).map((item) => (
              <li key={item.problemId}>
                <button
                  type="button"
                  disabled={!item.url}
                  title={!item.url ? t("recentProblemNoUrl") : undefined}
                  onClick={() => openProblemPage(item)}
                  className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {formatRelativeTime(item.viewedAt, locale)}
                    </span>
                  </span>
                  {isProblemDifficulty(item.difficulty) && (
                    <DifficultyBadge difficulty={item.difficulty} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasSaved && (
        <section className={SECTION_CLASS}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("savedProblems")}
          </h3>
          <ul className="mt-3 space-y-2">
            {saved.map((item) => (
              <li
                key={item.problemId}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <button
                  type="button"
                  disabled={!item.url}
                  title={!item.url ? t("recentProblemNoUrl") : undefined}
                  onClick={() => openProblemPage(item)}
                  className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
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
                  className="shrink-0 text-[11px] font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                >
                  {t("unsaveProblem")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasProfile && profile && (
        <section className={SECTION_CLASS}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("learningProfile")}
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">{t("problemsViewed")}</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">
                {profile.viewedProblems}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("hintsRequested")}</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">
                {profile.requestedHints}
              </dd>
            </div>
          </dl>
          {topPatterns.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500">{t("topPatterns")}</p>
              <ul className="mt-2 space-y-1">
                {topPatterns.map(([name, count]) => (
                  <li
                    key={name}
                    className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200"
                  >
                    <span className="truncate">{name}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{count}</span>
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
