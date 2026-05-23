import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Brain,
  CircleAlert,
  Eraser,
  Loader2,
  LockKeyhole,
  LogOut,
  Mic,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./styles.css";

const heroArtworkUrl = new URL(
  "../ChatGPT Image May 3, 2026, 02_52_01 PM.png",
  import.meta.url,
).href;
const logoUrl = new URL("./assets/logo.jpg", import.meta.url).href;

const AGENTS = {
  molly: {
    id: "molly",
    name: "Molly™",
    role: "Audience Intelligence",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/08d8a0f2-afb8-4e80-91d6-0efa25d5f85e/chat",
    accent: "#b45cff",
    accentSoft: "#6d28d9",
    mode: "Audience Intelligence",
    specialty: "Research, segmentation, audience insight",
    prompt: "Ask Molly about audience research, customer psychology, or market insight.",
    welcome:
      "Molly™ is online. Send audience context, customer notes, or market details and I will map the intelligence.",
  },
  brandy: {
    id: "brandy",
    name: "Brandy™",
    role: "Brand Voice",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/c65bf43d-45d3-42b5-9333-65e02bcd8835/chat",
    accent: "#8f3cff",
    accentSoft: "#4c1d95",
    mode: "Brand Voice",
    specialty: "Messaging, positioning, creative direction",
    prompt: "Ask Brandy about brand voice, client context, or campaign messaging.",
    welcome:
      "Brandy™ is online. Send the offer, audience, or campaign context and I will shape the brand direction.",
  },
};

const STORAGE_KEY = "ascala.agent-console.v1";
const AUTH_STORAGE_KEY = "ascala.agent-console.authenticated";
const LOGIN_USERNAME = "admin";
const LOGIN_PASSWORD = "admin03224515302";
const API_BASE_URL = (
  globalThis.__ASCALA_CONFIG__?.apiBaseUrl ||
  import.meta.env.VITE_API_BASE_URL ||
  ""
).replace(/\/$/, "");
const GHL_SESSION_TIMEOUT_MS = 8000;

function getApiUrl(path) {
  if (!API_BASE_URL) {
    throw new Error("Frontend is missing VITE_API_BASE_URL. Set it to the backend FastAPI URL and redeploy.");
  }

  return `${API_BASE_URL}${path}`;
}

function createSessionId(agentId) {
  if (globalThis.crypto?.randomUUID) {
    return `${agentId}-${globalThis.crypto.randomUUID()}`;
  }

  return `${agentId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createInitialState() {
  return {
    activeAgentId: "molly",
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

function loadState(storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    const fresh = createInitialState();

    return {
      activeAgentId: saved.activeAgentId in AGENTS ? saved.activeAgentId : "molly",
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

function isEmbeddedInFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

function sanitizeStorageScope(value) {
  return String(value || "direct")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 160);
}

function requestGhlEncryptedUserData() {
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

async function createGhlSession({ encryptedData, signal }) {
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

async function sendToAgent({ agent, message, sessionId, signal, appSessionToken }) {
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

    return getResponseText(payload.payload) || "I received the message, but no text response came back.";
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

  return getResponseText(payload) || "I received the message, but no text response came back.";
}

function App() {
  const [isEmbedded] = React.useState(isEmbeddedInFrame);
  const [ghlSession, setGhlSession] = React.useState({
    status: isEmbeddedInFrame() ? "checking" : "idle",
    data: null,
    error: "",
  });
  const [storageKey, setStorageKey] = React.useState(STORAGE_KEY);
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => !isEmbeddedInFrame() && localStorage.getItem(AUTH_STORAGE_KEY) === "true",
  );
  const [state, setState] = React.useState(() => loadState(STORAGE_KEY));
  const [draft, setDraft] = React.useState("");
  const [pendingAgentId, setPendingAgentId] = React.useState(null);
  const [error, setError] = React.useState("");
  const scrollRef = React.useRef(null);

  const activeAgent = AGENTS[state.activeAgentId];
  const activeConversation = state.conversations[state.activeAgentId];
  const isPending = pendingAgentId === activeAgent.id;

  React.useEffect(() => {
    if (!isEmbedded) return;

    const controller = new AbortController();

    async function verifyGhlSession() {
      try {
        const encryptedData = await requestGhlEncryptedUserData();
        const session = await createGhlSession({
          encryptedData,
          signal: controller.signal,
        });
        const scopedStorageKey = `${STORAGE_KEY}.${sanitizeStorageScope(session.storageScope)}`;

        setStorageKey(scopedStorageKey);
        setState(loadState(scopedStorageKey));
        setGhlSession({ status: "ready", data: session, error: "" });
        setIsAuthenticated(true);
      } catch (sessionError) {
        if (controller.signal.aborted) return;
        setGhlSession({
          status: "error",
          data: null,
          error: sessionError.message || "Unable to verify the HighLevel session.",
        });
        setIsAuthenticated(false);
      }
    }

    verifyGhlSession();

    return () => controller.abort();
  }, [isEmbedded]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [isAuthenticated, state, storageKey]);

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
    setDraft("");
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
          content: AGENTS[agentId].welcome,
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
        appSessionToken: ghlSession.data?.sessionToken,
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

  function handleLogin() {
    if (isEmbedded) return;
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
  }

  function handleLogout() {
    if (!isEmbedded) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsAuthenticated(false);
    setDraft("");
    setError("");
  }

  if (isEmbedded && !isAuthenticated) {
    return <GhlSessionScreen status={ghlSession.status} error={ghlSession.error} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <main className="ascala-workspace" style={{ "--agent-accent": activeAgent.accent }}>
      <Sidebar
        activeAgent={activeAgent}
        onSelectAgent={setActiveAgent}
        onLogout={handleLogout}
      />

      <section className="studio">
        <header className="studio-topbar">
          <div className="title-lockup">
            <h1>ESCOUADE</h1>
            <span>AI PRODUCTION TEAM</span>
          </div>
        </header>

        <div className="studio-layout">
          <div className="main-column">
            <TeamMembers activeAgent={activeAgent} onSelectAgent={setActiveAgent} />

            <section className="command-card">
              <div className="section-heading">
                <div>
                  <h2>{activeAgent.name.toUpperCase()} COMMAND DECK</h2>
                  <p>{activeAgent.specialty}.</p>
                </div>
                <button className="clear-action" type="button" onClick={clearActiveConversation}>
                  <Eraser size={16} />
                  <span>Clear Conversation</span>
                </button>
              </div>

              <div className="divider" />

              <div className="chat-console" ref={scrollRef} aria-live="polite">
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
                  rows={2}
                />
                <button className="primary-action" type="submit" disabled={!draft.trim() || Boolean(pendingAgentId)}>
                  {pendingAgentId ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                  <span>Send to {activeAgent.name.replace("™", "")}</span>
                  <ArrowRight size={17} />
                </button>
              </form>

              <div className="mountain-line" aria-hidden="true" />
            </section>
          </div>

        </div>
      </section>
    </main>
  );
}

function Sidebar({ activeAgent, onSelectAgent, onLogout }) {
  const navItems = [
    { id: "molly", label: "Molly™", sublabel: AGENTS.molly.role, icon: Brain },
    { id: "brandy", label: "Brandy™", sublabel: AGENTS.brandy.role, icon: Mic },
  ];

  return (
    <aside className="sidebar" aria-label="Ascala navigation">
      <div className="brand-stack">
        <LogoMark />
      </div>

      <nav className="side-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isAgent = item.id in AGENTS;
          const isActive = isAgent && item.id === activeAgent.id;

          return (
            <button
              className={`nav-item ${isActive ? "is-active" : ""}`}
              key={item.id}
              type="button"
              onClick={() => {
                if (isAgent) onSelectAgent(item.id);
              }}
            >
              <Icon size={22} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.sublabel}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <button className="logout-button" type="button" onClick={onLogout}>
        <LogOut size={17} />
        <span>Logout</span>
      </button>

      <footer className="sidebar-footer">© 2025 ASCALA<br />All rights reserved.</footer>
    </aside>
  );
}

function TeamMembers({ activeAgent, onSelectAgent }) {
  return (
    <section className="team-strip" aria-labelledby="team-title">
      <p id="team-title">ESCOUADE TEAM MEMBERS</p>
      <div className="agent-orbs">
        {Object.values(AGENTS).map((agent, index) => (
          <button
            className={`agent-card ${agent.id === activeAgent.id ? "is-active" : ""}`}
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
            style={{ "--orb-delay": `${index * 90}ms` }}
          >
            <span className="agent-orb">
              <span className="orb-ring" />
              <span className="orb-face">
                {agent.id === "molly" ? <Brain size={44} /> : <Mic size={44} />}
              </span>
            </span>
            <strong>{agent.name}</strong>
            <small>{agent.role}</small>
          </button>
        ))}

      </div>
    </section>
  );
}

function GhlSessionScreen({ status, error }) {
  const isError = status === "error";

  return (
    <main className="login-shell session-shell">
      <section className="login-panel session-panel" aria-labelledby="session-title">
        <div className="login-mark">
          {isError ? <CircleAlert size={24} /> : <Loader2 className="spin" size={24} />}
        </div>
        <div>
          <p className="eyebrow">HighLevel Session</p>
          <h2 id="session-title">{isError ? "Access unavailable" : "Connecting to GHL"}</h2>
        </div>
        <p className="session-copy">
          {isError
            ? error || "Unable to verify this HighLevel account."
            : "Verifying your signed HighLevel context and loading the correct workspace."}
        </p>
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (username.trim() === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
      setError("");
      onLogin();
      return;
    }

    setError("Invalid username or password.");
  }

  return (
    <main className="login-shell" style={{ "--hero-art": `url("${heroArtworkUrl}")` }}>
      <section className="login-copy" aria-label="Ascala GHL App">
        <div className="hero-brand">
          <LogoMark />
          <span>
            <strong>ASCALA</strong>
            <small>GHL APP</small>
          </span>
        </div>
        <h1>
          You don't need more tools.
          <span>You need an AI team.</span>
        </h1>
        <div className="hero-rule" />
        <p>ASCALA — <span>GHL App</span></p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-mark">
          <LockKeyhole size={24} />
        </div>
        <div>
          <p className="eyebrow">Protected Console</p>
          <h2 id="login-title">Admin Login</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <div className="login-error" role="alert">
              <CircleAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <button className="login-button" type="submit">
            <span className="arrow-circle">
              <ArrowRight size={24} />
            </span>
            <span>Enter Ascala</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function MessageBubble({ message, agent }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const Icon = isUser ? UserRound : isSystem ? CircleAlert : Sparkles;

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

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <img src={logoUrl} alt="" />
    </span>
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
