const DEFAULT_API_BASE_URL = "http://localhost:3001/api";

export function getBackendApiBaseUrl() {
  return (
    process.env.E2E_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

export async function ensureBackendReachable() {
  const apiBaseUrl = getBackendApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${apiBaseUrl}/categories`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GET /categories returned HTTP ${response.status}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? ` Detail: ${error.message}` : "";

    throw new Error(
      `Backend API is not reachable at ${apiBaseUrl}. Please start PostgreSQL and run backend with \`cd backend && npm run start:dev\`.${detail}`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
