import type { ProblemContext } from "@/shared/types";

interface ProblemHeaderProps {
  problem: ProblemContext | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ProblemHeader({
  problem,
  loading,
  error,
  onRefresh,
}: ProblemHeaderProps) {
  if (loading) {
    return (
      <p className="text-sm text-slate-500">Detecting problem on this page…</p>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-500">
          No problem detected. Open a LeetCode problem tab, then refresh.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h2 className="text-sm font-medium text-slate-900">{problem.title}</h2>
      <p className="line-clamp-3 text-xs text-slate-500">{problem.description}</p>
      {problem.examples.length > 0 && (
        <p className="text-xs text-slate-400">
          {problem.examples.length} example{problem.examples.length > 1 ? "s" : ""}{" "}
          detected
        </p>
      )}
    </div>
  );
}
