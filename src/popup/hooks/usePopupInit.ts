import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type {
  AppLocale,
  HintSession,
  LearningProfile,
  PopupInitData,
  ProblemContext,
  RecentProblem,
  SavedProblem,
} from "@/shared/types";
import type { AnalysisSettings, SolutionAnalysis } from "@/shared/types/solution-analysis";
import { createEmptyLearningProfile } from "@/shared/types/persistence";

interface PopupInitState {
  problem: ProblemContext | null;
  recent: RecentProblem[];
  saved: SavedProblem[];
  profile: LearningProfile;
  hintSession: HintSession | null;
  analysis: SolutionAnalysis | null;
  analysisSettings: AnalysisSettings;
  translation: PopupInitData["translation"];
  loading: boolean;
  error: string | null;
}

export function usePopupInit(locale: AppLocale) {
  const [state, setState] = useState<PopupInitState>({
    problem: null,
    recent: [],
    saved: [],
    profile: createEmptyLearningProfile(),
    hintSession: null,
    analysis: null,
    analysisSettings: { autoAnalyzeOnSubmit: false },
    translation: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await sendMessage<PopupInitData>({
      type: "GET_POPUP_INIT",
      payload: { locale },
    });

    if (!response.ok) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: response.error,
        problem: null,
      }));
      return;
    }

    setState({
      problem: response.data.problem,
      recent: response.data.recent,
      saved: response.data.saved,
      profile: response.data.profile,
      hintSession: response.data.hintSession,
      analysis: response.data.analysis,
      analysisSettings: response.data.analysisSettings,
      translation: response.data.translation,
      loading: false,
      error: null,
    });

    return response.data;
  }, [locale]);

  const refreshPersistence = useCallback(async () => {
    const [recentRes, savedRes, profileRes] = await Promise.all([
      sendMessage<RecentProblem[]>({ type: "GET_RECENT_PROBLEMS" }),
      sendMessage<SavedProblem[]>({ type: "GET_SAVED_PROBLEMS" }),
      sendMessage<LearningProfile>({ type: "GET_LEARNING_PROFILE" }),
    ]);

    setState((prev) => ({
      ...prev,
      recent: recentRes.ok ? recentRes.data : prev.recent,
      saved: savedRes.ok ? savedRes.data : prev.saved,
      profile: profileRes.ok ? profileRes.data : prev.profile,
    }));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    reload: load,
    refreshPersistence,
  };
}
