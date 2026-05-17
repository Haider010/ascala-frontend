import React from "react";
import { createRoot } from "react-dom/client";
import {
  Bot,
  Check,
  CircleAlert,
  Eraser,
  Loader2,
  MessageSquareText,
  PanelRightOpen,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./styles.css";

const AGENTS = {
  brandy: {
    id: "brandy",
    name: "Brandy",
    role: "Brand agent",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/c65bf43d-45d3-42b5-9333-65e02bcd8835/chat",
    accent: "#0e7c66",
    prompt: "Ask Brandy about brand voice, client context, or campaign messaging.",
  },
  molly: {
    id: "molly",
    name: "Molly",
    role: "Operations agent",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/08d8a0f2-afb8-4e80-91d6-0efa25d5f85e/chat",
    accent: "#b65f00",
    prompt: "Ask Molly about workflows, tasks, follow-ups, or process details.",
  },
};

const STORAGE_KEY = "ascala.agent-console.v1";

function createSessionId(agentId) {
  if (globalThis.crypto?.randomUUID) {
    return `${agentId}-${globalThis.crypto.randomUUID()}`;
  }

  return `${agentId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createInitialState() {
  return {
    activeAgentId: "brandy",
    conversations: Object.fromEntries(
      Object.keys(AGENTS).map((agentId) => [
        agentId,
        {
          sessionId: createSessionId(agentId),
          messages: [
            {
              id: `${agentId}-welcome`,
              role: "assistant",
              content:
                agentId === "brandy"
                  ? "Hi, I am Brandy. Send me the customer, offer, or campaign context and I will help shape it."
                  : "Hi, I am Molly. Give me the workflow or task details and I will help turn them into action.",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ]),
    ),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    const fresh = createInitialState();

    return {
      activeAgentId: saved.activeAgentId in AGENTS ? saved.activeAgentId : "brandy",
      conversations: Object.fromEntries(
        Object.keys(AGENTS).map((agentId) => [
          agentId,
          {
            sessionId:
              saved.conversations?.[agentId]?.sessionId || fresh.conversations[agentId].sessionId,
            messages:
              Array.isArray(saved.conversations?.[agentId]?.messages) &&
              saved.conversations[agentId].messages.length > 0
                ? saved.conversations[agentId].messages
                : fresh.conversations[agentId].messages,
          },
        ]),
      ),
    };
  } catch {
    return createInitialState();
  }
}

function getResponseText(payload) {
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

async function sendToAgent({ agent, message, sessionId, signal }) {
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

  return getResponseText(payload) || "I received the message, but no text response came back.";
}

function App() {
  const [state, setState] = React.useState(loadState);
  const [draft, setDraft] = React.useState("");
  const [pendingAgentId, setPendingAgentId] = React.useState(null);
  const [error, setError] = React.useState("");
  const scrollRef = React.useRef(null);

  const activeAgent = AGENTS[state.activeAgentId];
  const activeConversation = state.conversations[state.activeAgentId];
  const isPending = pendingAgentId === activeAgent.id;

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeConversation.messages, activeAgent.id]);

  function updateConversation(agentId, updater) {
    setState((current) => ({
      ...current,
      conversations: {
        ...current.conversations,
        [agentId]: updater(current.conversations[agentId]),
      },
    }));
  }

  function setActiveAgent(agentId) {
    setState((current) => ({ ...current, activeAgentId: agentId }));
    setError("");
  }

  function clearActiveConversation() {
    const agentId = activeAgent.id;
    updateConversation(agentId, () => ({
      sessionId: createSessionId(agentId),
      messages: [
        {
          id: `${agentId}-reset-${Date.now()}`,
          role: "assistant",
          content: AGENTS[agentId].prompt,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setError("");
  }

  async function handleSend(event) {
    event?.preventDefault();

    const message = draft.trim();
    if (!message || pendingAgentId) return;

    const agent = activeAgent;
    const conversation = state.conversations[agent.id];
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setDraft("");
    setError("");
    setPendingAgentId(agent.id);
    updateConversation(agent.id, (current) => ({
      ...current,
      messages: [...current.messages, userMessage],
    }));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90000);

    try {
      const reply = await sendToAgent({
        agent,
        message,
        sessionId: conversation.sessionId,
        signal: controller.signal,
      });

      updateConversation(agent.id, (current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: reply,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (requestError) {
      const description =
        requestError.name === "AbortError"
          ? "The request timed out after 90 seconds."
          : requestError.message || "The agent request failed.";

      setError(description);
      updateConversation(agent.id, (current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: `error-${Date.now()}`,
            role: "system",
            content: description,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      window.clearTimeout(timeout);
      setPendingAgentId(null);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  }

  return (
    <main className="app-shell">
      <aside className="agent-rail" aria-label="Agent selector">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="eyebrow">Ascala GHL</p>
            <h1>Agent Console</h1>
          </div>
        </div>

        <div className="agent-tabs" role="tablist" aria-label="Choose agent">
          {Object.values(AGENTS).map((agent) => {
            const selected = agent.id === activeAgent.id;
            const messages = state.conversations[agent.id].messages.length;

            return (
              <button
                className={`agent-tab ${selected ? "is-active" : ""}`}
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                role="tab"
                aria-selected={selected}
                style={{ "--agent-accent": agent.accent }}
              >
                <span className="agent-avatar">
                  <Bot size={18} />
                </span>
                <span className="agent-copy">
                  <strong>{agent.name}</strong>
                  <small>{agent.role}</small>
                </span>
                <span className="message-count">{messages}</span>
              </button>
            );
          })}
        </div>

        <div className="endpoint-card">
          <div className="endpoint-heading">
            <PanelRightOpen size={16} />
            <span>Webhook</span>
          </div>
          <p>{activeAgent.endpoint}</p>
        </div>
      </aside>

      <section className="chat-panel" style={{ "--agent-accent": activeAgent.accent }}>
        <header className="chat-header">
          <div>
            <p className="eyebrow">Connected agent</p>
            <h2>{activeAgent.name}</h2>
          </div>
          <div className="header-actions">
            <span className="status-pill">
              {isPending ? <Loader2 className="spin" size={15} /> : <Check size={15} />}
              {isPending ? "Thinking" : "Ready"}
            </span>
            <button className="icon-button" type="button" onClick={clearActiveConversation} title="Clear chat">
              <Eraser size={18} />
            </button>
          </div>
        </header>

        <div className="messages" ref={scrollRef} aria-live="polite">
          {activeConversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} agent={activeAgent} />
          ))}
          {isPending && (
            <div className="typing-row">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <CircleAlert size={17} />
            <span>{error}</span>
          </div>
        )}

        <form className="composer" onSubmit={handleSend}>
          <label className="sr-only" htmlFor="message-input">
            Message {activeAgent.name}
          </label>
          <textarea
            id="message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeAgent.prompt}
            rows={1}
          />
          <button className="send-button" type="submit" disabled={!draft.trim() || Boolean(pendingAgentId)}>
            {pendingAgentId ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            <span>Send</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function MessageBubble({ message, agent }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const Icon = isUser ? UserRound : isSystem ? CircleAlert : MessageSquareText;

  return (
    <article className={`message ${isUser ? "from-user" : ""} ${isSystem ? "from-system" : ""}`}>
      <div className="message-icon">
        <Icon size={16} />
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span>{isUser ? "You" : isSystem ? "System" : agent.name}</span>
          <time>{formatTime(message.createdAt)}</time>
        </div>
        <p>{message.content}</p>
      </div>
    </article>
  );
}

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

createRoot(document.getElementById("root")).render(<App />);
