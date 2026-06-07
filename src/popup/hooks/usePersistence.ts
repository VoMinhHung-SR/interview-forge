import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/shared/messaging";
import type {
  LearningProfile,
  RecentProblem,
  SavedProblem,
} from "@/shared/types";

interface PersistenceState {
  recent: RecentProblem[];
  saved: SavedProblem[];
  profile: LearningProfile | null;
  loading: boolean;
}

export function usePersistence() {
  const [state, setState] = useState<PersistenceState>({
    recent: [],
    saved: [],
    profile: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const [recentRes, savedRes, profileRes] = await Promise.all([
      sendMessage<RecentProblem[]>({ type: "GET_RECENT_PROBLEMS" }),
      sendMessage<SavedProblem[]>({ type: "GET_SAVED_PROBLEMS" }),
      sendMessage<LearningProfile>({ type: "GET_LEARNING_PROFILE" }),
    ]);

    setState({
      recent: recentRes.ok ? recentRes.data : [],
      saved: savedRes.ok ? savedRes.data : [],
      profile: profileRes.ok ? profileRes.data : null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
