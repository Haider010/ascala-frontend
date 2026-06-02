import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";

export async function fetchTokenUsage({ appSessionToken, signal }) {
  if (!appSessionToken) {
    throw new Error("Backend account session is not ready yet.");
  }

  const response = await fetch(getApiUrl("/usage/tokens"), {
    headers: {
      Authorization: `Bearer ${appSessionToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to load token usage.");
  }

  return payload;
}
