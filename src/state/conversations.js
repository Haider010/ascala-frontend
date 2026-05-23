import { AGENTS, DEFAULT_AGENT_ID } from "../config/agents";
import { createSessionId } from "../utils/session";

export function createInitialState() {
  return {
    activeAgentId: DEFAULT_AGENT_ID,
    conversations: Object.fromEntries(
      Object.values(AGENTS).map((agent) => [
        agent.id,
        {
          sessionId: createSessionId(agent.id),
          messages: [
            {
              id: `${agent.id}-welcome`,
              role: "assistant",
              content: agent.welcome,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ]),
    ),
  };
}


export function loadState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    const fresh = createInitialState();

    return {
      activeAgentId: saved.activeAgentId in AGENTS ? saved.activeAgentId : DEFAULT_AGENT_ID,
      conversations: Object.fromEntries(
        Object.values(AGENTS).map((agent) => [
          agent.id,
          {
            sessionId:
              saved.conversations?.[agent.id]?.sessionId ||
              fresh.conversations[agent.id].sessionId,
            messages:
              Array.isArray(saved.conversations?.[agent.id]?.messages) &&
              saved.conversations[agent.id].messages.length > 0
                ? saved.conversations[agent.id].messages
                : fresh.conversations[agent.id].messages,
          },
        ]),
      ),
    };
  } catch {
    return createInitialState();
  }
}
