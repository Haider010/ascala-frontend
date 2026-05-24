function getLocalApiFallback() {
  if (typeof window === "undefined") return "";

  return ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:8000"
    : "";
}

export const API_BASE_URL = (
  globalThis.__ASCALA_CONFIG__?.apiBaseUrl ||
  import.meta.env.VITE_API_BASE_URL ||
  getLocalApiFallback()
).replace(/\/$/, "");

export const GHL_SESSION_TIMEOUT_MS = 8000;
