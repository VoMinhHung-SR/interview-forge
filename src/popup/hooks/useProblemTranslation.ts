import { useEffect, useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type {
  AppLocale,
  PopupInitTranslation,
  ProblemContext,
  TranslateProblemResponse,
} from "@/shared/types";

interface ProblemTranslationState {
  displayDescription: string;
  loading: boolean;
  error: string | null;
  isTranslated: boolean;
}

export function useProblemTranslation(
  problem: ProblemContext | null,
  locale: AppLocale,
  initialTranslation?: PopupInitTranslation | null,
): ProblemTranslationState {
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(
    initialTranslation?.description ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseDescription = problem?.description ?? "";

  useEffect(() => {
    setError(null);

    if (!problem?.description) {
      setTranslatedDescription(null);
      setLoading(false);
      return;
    }

    if (locale !== "vi") {
      setTranslatedDescription(null);
      setLoading(false);
      return;
    }

    if (initialTranslation?.description) {
      setTranslatedDescription(initialTranslation.description);
      setLoading(false);
      return;
    }

    if (!problem.problemId) {
      setLoading(false);
      setError("Problem ID not found. Reload the problem page and try again.");
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const result = await sendMessage<TranslateProblemResponse>({
        type: "TRANSLATE_PROBLEM",
        payload: {
          problemId: problem.problemId!,
          description: problem.description,
          language: "vi",
        },
      });

      if (cancelled) return;

      setLoading(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setTranslatedDescription(result.data.translatedDescription);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    problem?.url,
    problem?.problemId,
    problem?.description,
    locale,
    initialTranslation?.description,
  ]);

  const displayDescription =
    locale === "vi" && translatedDescription ?
      translatedDescription
    : baseDescription;

  return {
    displayDescription,
    loading: locale === "vi" && loading,
    error,
    isTranslated: locale === "vi" && translatedDescription !== null && !error,
  };
}
