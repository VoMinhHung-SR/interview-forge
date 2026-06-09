export { HintEngine } from "./hint-engine";
export { SolutionAnalysisEngine } from "./solution-engine";
export { TranslationEngine } from "./translation-engine";
export { createAiProvider, getActiveProviderId } from "./providers";

import { HintEngine } from "./hint-engine";
import { SolutionAnalysisEngine } from "./solution-engine";
import { TranslationEngine } from "./translation-engine";
import { createAiProvider } from "./providers";

let hintEngineInstance: HintEngine | null = null;
let solutionEngineInstance: SolutionAnalysisEngine | null = null;
let translationEngineInstance: TranslationEngine | null = null;

/** Returns a singleton HintEngine, or null if no API key is configured. */
export function getHintEngine(): HintEngine | null {
  if (hintEngineInstance) return hintEngineInstance;

  const provider = createAiProvider();
  if (!provider) return null;

  hintEngineInstance = new HintEngine({ provider });
  return hintEngineInstance;
}

/** Returns a singleton SolutionAnalysisEngine, or null if no API key is configured. */
export function getSolutionEngine(): SolutionAnalysisEngine | null {
  if (solutionEngineInstance) return solutionEngineInstance;

  const provider = createAiProvider();
  if (!provider) return null;

  solutionEngineInstance = new SolutionAnalysisEngine({ provider });
  return solutionEngineInstance;
}

/** Returns a singleton TranslationEngine, or null if no API key is configured. */
export function getTranslationEngine(): TranslationEngine | null {
  if (translationEngineInstance) return translationEngineInstance;

  const provider = createAiProvider();
  if (!provider) return null;

  translationEngineInstance = new TranslationEngine({ provider });
  return translationEngineInstance;
}

/** Resets AI engine singletons (useful when env keys change during dev). */
export function resetHintEngine(): void {
  hintEngineInstance = null;
  solutionEngineInstance = null;
  translationEngineInstance = null;
}
