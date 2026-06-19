import { PLATFORM_SESSION_TIMEOUT_MS } from "../config/runtime";
import { getApiUrl } from "./api";
import { getQueryParams, isEmbeddedInFrame } from "../utils/session";

export function requestGhlEncryptedUserData() {
  return new Promise((resolve, reject) => {
    if (!isEmbeddedInFrame()) {
      reject(new Error("This page is not embedded in B10X.ai."));
      return;
    }

    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", messageHandler);
      reject(new Error("B10X.ai did not return session details in time."));
    }, PLATFORM_SESSION_TIMEOUT_MS);

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
    throw new Error(payload.detail || "Unable to verify the B10X.ai session.");
  }

  return payload;
}


export async function createDirectDevLogin({ username, password, signal } = {}) {
  const response = await fetch(getApiUrl("/dev/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || "Unable to verify direct dev login.");
  }

  return payload;
}


export async function createDirectDevSession({ signal, loginToken } = {}) {
  const response = await fetch(getApiUrl("/dev/session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(loginToken ? { "X-Direct-Dev-Login": loginToken } : {}),
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.detail || "Unable to create the direct dev session.");
  }

  return payload;
}
