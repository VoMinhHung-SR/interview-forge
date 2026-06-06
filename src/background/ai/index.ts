export { HintEngine } from "./hint-engine";
export { TranslationEngine } from "./translation-engine";
export { createAiProvider, getActiveProviderId } from "./providers";

import { HintEngine } from "./hint-engine";
import { TranslationEngine } from "./translation-engine";
import { createAiProvider } from "./providers";

let hintEngineInstance: HintEngine | null = null;
let translationEngineInstance: TranslationEngine | null = null;

/** Returns a singleton HintEngine, or null if no API key is configured. */
export function getHintEngine(): HintEngine | null {
  if (hintEngineInstance) return hintEngineInstance;

  const provider = createAiProvider();
  if (!provider) return null;

  hintEngineInstance = new HintEngine({ provider });
  return hintEngineInstance;
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
  translationEngineInstance = null;
}
