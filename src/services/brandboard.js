import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";

async function requestBrandBoard(path, { method = "GET", appSessionToken, signal, body } = {}) {
  if (!appSessionToken) {
    throw new Error("Backend account session is not ready yet.");
  }

  const headers = {
    Authorization: `Bearer ${appSessionToken}`,
  };
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(getApiUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to load BrandBoard.");
  }

  return payload;
}

export function fetchBrandBoard({ appSessionToken, signal }) {
  return requestBrandBoard("/brandboard", { appSessionToken, signal });
}

export function generateBrandBoard({ appSessionToken, signal, instruction = "" }) {
  return requestBrandBoard("/brandboard/generate", {
    method: "POST",
    appSessionToken,
    signal,
    body: { instruction },
  });
}
