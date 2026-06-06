export { HintEngine } from "./hint-engine";
export { createAiProvider, getActiveProviderId } from "./providers";

import { HintEngine } from "./hint-engine";
import { createAiProvider } from "./providers";

let engineInstance: HintEngine | null = null;

/** Returns a singleton HintEngine, or null if no API key is configured. */
export function getHintEngine(): HintEngine | null {
  if (engineInstance) return engineInstance;

  const provider = createAiProvider();
  if (!provider) return null;

  engineInstance = new HintEngine({ provider });
  return engineInstance;
}

/** Resets the singleton (useful when env keys change during dev). */
export function resetHintEngine(): void {
  engineInstance = null;
}
