import { useState } from "react";
import type { ProblemContext, ProblemDifficulty, RecentProblem } from "@/shared/types";
import { openProblemPage } from "@/shared/utils/problem-url";
import { useTranslation } from "@/popup/hooks/useTranslation";
import { DifficultyBadge } from "./DifficultyBadge";
import { ProblemSummary } from "./ProblemSummary";

const CARD_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900";

const MAX_RECENT_DISPLAY = 3;

type HubTab = "problem" | "recent";

interface ProblemHubPanelProps {
  problem: ProblemContext | null;
  problemLoading: boolean;
  problemError: string | null;
  onRefreshProblem: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  saveLoading: boolean;
  recent: RecentProblem[];
  recentLoading: boolean;
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

function HistoryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 00-1.5 0v3.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 00-1.1-1.02l-1.45 1.55V6.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TabSlider({
  activeTab,
  onChange,
}: {
  activeTab: HubTab;
  onChange: (tab: HubTab) => void;
}) {
  const { t } = useTranslation();

  const tabs: Array<{ id: HubTab; label: string }> = [
    { id: "problem", label: t("problem") },
    { id: "recent", label: t("recentProblems") },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <div className="relative flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      <span
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm transition-transform duration-200 ease-out dark:bg-slate-700"
        style={{
          left: "4px",
          transform: `translateX(calc(${activeIndex * 100}%))`,
        }}
        aria-hidden
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative z-10 flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition-colors ${
            activeTab === tab.id ?
              "text-slate-900 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function RecentProblemsTab({
  recent,
  loading,
}: {
  recent: RecentProblem[];
  loading: boolean;
}) {
  const { t, locale } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="skeleton h-12 w-full rounded-lg" />
        <div className="skeleton h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("recentProblemsEmpty")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {recent.slice(0, MAX_RECENT_DISPLAY).map((item) => (
        <li key={item.problemId}>
          <button
            type="button"
            disabled={!item.url}
            title={!item.url ? t("recentProblemNoUrl") : undefined}
            onClick={() => openProblemPage(item)}
            className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
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
  );
}

export function ProblemHubPanel({
  problem,
  problemLoading,
  problemError,
  onRefreshProblem,
  isSaved,
  onToggleSave,
  saveLoading,
  recent,
  recentLoading,
}: ProblemHubPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<HubTab>("problem");

  return (
    <section className={CARD_CLASS}>
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <TabSlider activeTab={activeTab} onChange={setActiveTab} />
        </div>
        {activeTab === "problem" && (
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={t("showRecentProblems")}
            title={t("showRecentProblems")}
          >
            <HistoryIcon />
          </button>
        )}
      </div>

      <div
        role="tabpanel"
        className="min-h-[4rem] transition-opacity duration-150"
      >
        {activeTab === "problem" ?
          <ProblemSummary
            problem={problem}
            loading={problemLoading}
            error={problemError}
            onRefresh={onRefreshProblem}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
            saveLoading={saveLoading}
            embedded
          />
        : <RecentProblemsTab recent={recent} loading={recentLoading} />}
      </div>
    </section>
  );
}
