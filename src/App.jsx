import React from "react";
import { CircleAlert } from "lucide-react";
import { sendToAgent } from "./services/agents";
import { useAgentConsole } from "./hooks/useAgentConsole";
import { Sidebar } from "./components/layout/Sidebar";
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
    isConversationLoading,
    pendingAgentId,
    setActiveAgent,
    setDraft,
    setError,
    setPendingAgentId,
    updateConversation,
    workflowStatus,
    applyWorkflowStatus,
    handleLogin,
    handleLogout,
  } = useAgentConsole();
  const scrollRef = React.useRef(null);
  const isPending = pendingAgentId === activeAgent.id;
  const isComposerDisabled = isConversationLoading || !ghlSession.data?.sessionToken;

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeConversation.messages, activeAgent.id, isConversationLoading]);

  async function handleSend(event) {
    event?.preventDefault();

    const message = draft.trim();
    if (!message || pendingAgentId || isConversationLoading) return;

    if (!ghlSession.data?.sessionToken) {
      setError("Backend account session is not ready yet.");
      return;
    }

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
      const { reply, sessionId, workflowStatus: nextWorkflowStatus } = await sendToAgent({
        agent,
        message,
        sessionId: conversation.sessionId,
        signal: controller.signal,
        appSessionToken: ghlSession.data?.sessionToken,
      });

      updateConversation(agent.id, (current) => ({
        ...current,
        sessionId: sessionId || current.sessionId,
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
      applyWorkflowStatus(nextWorkflowStatus);
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
    if (isComposerDisabled) {
      event.preventDefault();
      return;
    }

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
        workflowStatus={workflowStatus}
        showLogout={!isEmbedded}
        onSelectAgent={setActiveAgent}
        onLogout={handleLogout}
      />

      <section className="studio">
        <header className="studio-topbar">
          <div className="title-lockup">
            <h1>{activeAgent.name}</h1>
          </div>
        </header>

        <div className="studio-layout">
          <div className="main-column">
            <section className="command-card">
              <div className="chat-console" ref={scrollRef} aria-live="polite">
                {isConversationLoading ? (
                  <div className="history-loading-state" role="status" aria-label="Loading conversation">
                    <span className="history-loader" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                ) : (
                  activeConversation.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} agent={activeAgent} />
                  ))
                )}
                {!isConversationLoading && isPending && (
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
                disabled={isComposerDisabled}
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
