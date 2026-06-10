import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { storageService } from "@/shared/storage";
import type { AnalysisSettings } from "@/shared/types/solution-analysis";

const DEFAULT_SETTINGS: AnalysisSettings = {
  autoAnalyzeOnSubmit: false,
};

export async function getAnalysisSettings(): Promise<AnalysisSettings> {
  const stored = await storageService.get<AnalysisSettings>(
    STORAGE_KEYS.analysisSettings,
  );
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setAnalysisSettings(
  partial: Partial<AnalysisSettings>,
): Promise<AnalysisSettings> {
  const current = await getAnalysisSettings();
  const updated = { ...current, ...partial };
  await storageService.set(STORAGE_KEYS.analysisSettings, updated);
  return updated;
}

export async function isAutoAnalyzeOnSubmitEnabled(): Promise<boolean> {
  const settings = await getAnalysisSettings();
  return settings.autoAnalyzeOnSubmit;
}
