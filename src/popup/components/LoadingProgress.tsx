import { useEffect, useState } from "react";

interface LoadingProgressProps {
  stages: string[];
  title?: string;
  stageIntervalMs?: number;
  waitingMessage?: string;
  slowMessage?: string;
}

export function LoadingProgress({
  stages,
  title = "Generating",
  stageIntervalMs = 2200,
  waitingMessage = "Still waiting for AI…",
  slowMessage = "Free-tier APIs can be slow or rate-limited. Please wait…",
}: LoadingProgressProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const atLastStage = stageIndex >= stages.length - 1;

  useEffect(() => {
    setStageIndex(0);
    setElapsedSec(0);

    const stageTimer = setInterval(() => {
      setStageIndex((current) =>
        current < stages.length - 1 ? current + 1 : current,
      );
    }, stageIntervalMs);

    const elapsedTimer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(stageTimer);
      clearInterval(elapsedTimer);
    };
  }, [stages, stageIntervalMs]);

  const progress = atLastStage ? 92 : ((stageIndex + 1) / stages.length) * 85;
  const statusText = atLastStage ? waitingMessage : stages[stageIndex];

  return (
    <div
      className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="loading-spinner" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-900">{title}</p>
          <p className="text-xs text-blue-700">{statusText}</p>
        </div>
        <span className="text-xs font-medium tabular-nums text-blue-600">
          {elapsedSec}s
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
        <div
          className={`loading-progress-bar h-full rounded-full bg-blue-500 transition-all duration-500 ease-out ${
            atLastStage ? "loading-progress-pulse" : ""
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {atLastStage && elapsedSec >= 8 && (
        <p className="mt-2 text-xs text-blue-600">{slowMessage}</p>
      )}
    </div>
  );
}
