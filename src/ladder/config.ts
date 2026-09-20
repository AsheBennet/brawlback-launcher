/**
 * Ladder HTTP base URL.
 * OpenAPI servers default: http://localhost:8080
 * Override with LADDER_BASE_URL env (or pass baseUrl to the client / IPC).
 */
export const DEFAULT_LADDER_BASE_URL = "http://localhost:8080";

export function getLadderBaseUrl(override?: string): string {
  if (override && override.trim()) {
    return override.replace(/\/$/, "");
  }
  const fromEnv = typeof process !== "undefined" ? process.env.LADDER_BASE_URL : undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  return DEFAULT_LADDER_BASE_URL;
}
