import React from "react";
import { ArrowRight, CircleAlert, Eraser } from "lucide-react";
import { AGENTS } from "./config/agents";
import { createSessionId } from "./utils/session";
import { sendToAgent } from "./services/agents";
import { useAgentConsole } from "./hooks/useAgentConsole";
import { Sidebar } from "./components/layout/Sidebar";
import { TeamMembers } from "./components/layout/TeamMembers";
import { MessageBubble } from "./components/chat/MessageBubble";
import { Composer } from "./components/chat/Composer";
import { GhlSessionScreen } from "./features/ghl/GhlSessionScreen";
import { LoginScreen } from "./features/auth/LoginScreen";

export function App() {
  const {
    activeAgent,
    activeConversation,
    draft,
    error,
    ghlSession,
    isAuthenticated,
    isEmbedded,
    pendingAgentId,
    setActiveAgent,
    setDraft,
    setError,
    setPendingAgentId,
    updateConversation,
    handleLogin,
    handleLogout,
  } = useAgentConsole();
  const scrollRef = React.useRef(null);
  const isPending = pendingAgentId === activeAgent.id;

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeConversation.messages, activeAgent.id]);

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
    const conversation = activeConversation;
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
        showLogout={!isEmbedded}
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

              <Composer
                activeAgent={activeAgent}
                draft={draft}
                pendingAgentId={pendingAgentId}
                onDraftChange={setDraft}
                onKeyDown={handleKeyDown}
                onSend={handleSend}
              />

              <div className="mountain-line" aria-hidden="true" />
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
