/** Normalize source for stable cache keys (whitespace only, no comment stripping). */
export function normalizeCodeForHash(code: string): string {
  return code.replace(/\r\n/g, "\n").trim();
}

export async function hashCode(code: string): Promise<string> {
  const normalized = normalizeCodeForHash(code);
  const encoded = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
