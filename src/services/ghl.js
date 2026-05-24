import { GHL_SESSION_TIMEOUT_MS } from "../config/runtime";
import { getApiUrl } from "./api";
import { getQueryParams, isEmbeddedInFrame } from "../utils/session";

export function requestGhlEncryptedUserData() {
  return new Promise((resolve, reject) => {
    if (!isEmbeddedInFrame()) {
      reject(new Error("This page is not embedded in HighLevel."));
      return;
    }

    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", messageHandler);
      reject(new Error("HighLevel did not return session details in time."));
    }, GHL_SESSION_TIMEOUT_MS);

    function messageHandler(event) {
      if (event.data?.message !== "REQUEST_USER_DATA_RESPONSE") return;

      window.clearTimeout(timeout);
      window.removeEventListener("message", messageHandler);
      resolve(event.data.payload);
    }

    window.addEventListener("message", messageHandler);
    window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");
  });
}


export async function createGhlSession({ encryptedData, signal }) {
  const response = await fetch(getApiUrl("/ghl/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      encryptedData,
      queryParams: getQueryParams(),
    }),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || "Unable to verify the HighLevel session.");
  }

  return payload;
}


export async function createDirectDevSession({ signal } = {}) {
  const response = await fetch(getApiUrl("/dev/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || "Unable to create the direct dev session.");
  }

  return payload;
}
