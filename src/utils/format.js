export function formatTime(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}


export function getResponseText(payload) {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;

  if (Array.isArray(payload)) {
    const best = payload
      .map((item) => getResponseText(item))
      .find((value) => value && value.trim().length > 0);
    return best || "";
  }

  if (typeof payload === "object") {
    const directKeys = ["output", "text", "message", "response", "answer", "content", "reply"];

    for (const key of directKeys) {
      if (typeof payload[key] === "string") return payload[key];
      if (payload[key] && typeof payload[key] === "object") {
        const nested = getResponseText(payload[key]);
        if (nested) return nested;
      }
    }

    if (Array.isArray(payload.messages)) {
      const lastAssistant = [...payload.messages]
        .reverse()
        .find((message) => message.role === "assistant" || message.type === "ai");
      const nested = getResponseText(lastAssistant || payload.messages.at(-1));
      if (nested) return nested;
    }

    if (payload.data) {
      const nested = getResponseText(payload.data);
      if (nested) return nested;
    }

    return JSON.stringify(payload, null, 2);
  }

  return String(payload);
}
