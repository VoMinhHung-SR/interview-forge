const RETRYABLE_STATUS = new Set([503]);

export function isRetryableError(status: number, body: string): boolean {
  // 429 = quota/rate limit — retrying within seconds almost never helps on free tier
  if (status === 429 || body.includes("RESOURCE_EXHAUSTED")) return false;
  return RETRYABLE_STATUS.has(status);
}

export function isQuotaError(status: number, body: string): boolean {
  return status === 429 || body.includes("RESOURCE_EXHAUSTED");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRetryDelayMs(body: string): number {
  const match = body.match(/retry in ([\d.]+)s/i);
  if (!match?.[1]) return 3000;
  return Math.min(Math.ceil(parseFloat(match[1]) * 1000) + 500, 15000);
}
