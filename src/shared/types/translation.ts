import type { AppLocale } from "./hints";

export interface TranslationCacheEntry {
  problemId: string;
  language: AppLocale;
  translatedDescription: string;
  createdAt: number;
}

export interface TranslateProblemRequest {
  problemId: string;
  description: string;
  language: AppLocale;
}

export interface TranslateProblemResponse {
  translatedDescription: string;
  fromCache: boolean;
}

export type TranslationEngineErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "EMPTY_RESPONSE"
  | "UNSUPPORTED_LANGUAGE";

export interface TranslationEngineError {
  code: TranslationEngineErrorCode;
  message: string;
}

export interface TranslationEngineData {
  translatedDescription: string;
}

export type TranslationEngineResult =
  | { success: true; data: TranslationEngineData }
  | { success: false; error: TranslationEngineError };
