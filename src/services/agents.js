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
  if (appSessionToken) {
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
    };
  }

  const response = await fetch(agent.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "sendMessage",
      sessionId,
      chatInput: message,
      message,
    }),
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const details = getResponseText(payload) || response.statusText;
    throw new Error(`${response.status} ${details}`.trim());
  }

  return {
    reply: getResponseText(payload) || "I received the message, but no text response came back.",
    sessionId,
  };
}
