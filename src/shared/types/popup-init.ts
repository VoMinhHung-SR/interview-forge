import type { AppLocale } from "./hints";
import type { ProblemContext } from "./problem-context";
import type {
  HintSession,
  LearningProfile,
  RecentProblem,
  SavedProblem,
} from "./persistence";
import type { AnalysisSettings, SolutionAnalysis } from "./solution-analysis";

export interface PopupInitTranslation {
  description: string;
  fromCache: boolean;
}

export interface PopupInitData {
  problem: ProblemContext | null;
  recent: RecentProblem[];
  saved: SavedProblem[];
  profile: LearningProfile;
  hintSession: HintSession | null;
  analysis: SolutionAnalysis | null;
  analysisSettings: AnalysisSettings;
  translation: PopupInitTranslation | null;
}

export interface PopupInitRequest {
  locale?: AppLocale;
}
