export const API_BASE_URL = (
  globalThis.__ASCALA_CONFIG__?.apiBaseUrl ||
  import.meta.env.VITE_API_BASE_URL ||
  ""
).replace(/\/$/, "");

export const GHL_SESSION_TIMEOUT_MS = 8000;
