import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";

export async function fetchAgentHistory({ agentId, signal, appSessionToken }) {
  const response = await fetch(getApiUrl(`/agent-chat/history?agentId=${encodeURIComponent(agentId)}`), {
    headers: {
      Authorization: `Bearer ${appSessionToken}`,
    },
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to load chat history.");
  }

  return payload;
}


export async function sendToAgent({ agent, message, sessionId, signal, appSessionToken }) {
  if (!appSessionToken) {
    throw new Error("Backend account session is not ready yet.");
  }

  const response = await fetch(getApiUrl("/agent-chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appSessionToken}`,
    },
    body: JSON.stringify({
      agentId: agent.id,
      message,
      sessionId,
    }),
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "The agent request failed.");
  }

  return {
    reply: getResponseText(payload.payload) || "I received the message, but no text response came back.",
    sessionId: payload.sessionId || sessionId,
    workflowStatus: payload.workflowStatus || null,
  };
}


export async function clearAccountOutputs({ appSessionToken }) {
  if (!appSessionToken) {
    throw new Error("Backend account session is not ready yet.");
  }

  const response = await fetch(getApiUrl("/account/clear-outputs"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appSessionToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to clear account outputs.");
  }

  return payload;
}


export async function clearAgentOutput({ appSessionToken, agentId }) {
  if (!appSessionToken) {
    throw new Error("Backend account session is not ready yet.");
  }

  const response = await fetch(getApiUrl(`/account/clear-output/${encodeURIComponent(agentId)}`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appSessionToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to clear agent output.");
  }

  return payload;
}
