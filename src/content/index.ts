/**
 * Content script entry point.
 * Detects platform and will extract problem context in later milestones.
 */

import { detectPlatform } from "@/content/platforms";

console.info(
  "[Coding Interview Coach] Content script loaded:",
  detectPlatform(window.location.href) ?? "unsupported",
);
