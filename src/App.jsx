import React from "react";
import { CheckCircle2, CircleAlert, FlaskConical, X } from "lucide-react";
import { sendToAgent } from "./services/agents";
import { useAgentConsole } from "./hooks/useAgentConsole";
import { Sidebar } from "./components/layout/Sidebar";
import { MessageBubble } from "./components/chat/MessageBubble";
import { Composer } from "./components/chat/Composer";
import { EscouadeWorkspace } from "./features/escouade/EscouadeWorkspace";
import { GhlSessionScreen } from "./features/ghl/GhlSessionScreen";
import { LoginScreen } from "./features/auth/LoginScreen";

export function App() {
  const {
    activeAgent,
    activeConversation,
    draft,
    error,
    devUnlockAll,
    effectiveWorkflowStatus,
    ghlSession,
    isAuthenticated,
    isEmbedded,
    isConversationLoading,
    pendingAgentId,
    setActiveAgent,
    setDevUnlockAll,
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
  const [completionNotice, setCompletionNotice] = React.useState(null);
  const isEscouade = activeAgent.id === "escouade";
  const isPending = pendingAgentId === activeAgent.id;
  const isComposerDisabled = isConversationLoading || !ghlSession.data?.sessionToken;

  function getStep(status, agentId) {
    return status?.steps?.find((step) => step.id === agentId);
  }

  function getAgentCompletionNotice(agentId, previousStatus, nextStatus) {
    const previousStep = getStep(previousStatus, agentId);
    const nextStep = getStep(nextStatus, agentId);

    if (!nextStep?.completed || previousStep?.completed) return null;

    const unlockedStep = nextStatus?.steps?.find(
      (step) => step.status === "current" && step.available && !step.locked,
    );

    if (!unlockedStep) return null;

    const copy = {
      molly: {
        title: "Strategic foundation saved",
        description: `${unlockedStep.name} is now accessible with the context needed to shape the next layer.`,
      },
      brandy: {
        title: "Brand voice saved",
        description: `${unlockedStep.name} is now accessible with the brand context needed to continue.`,
      },
      sacha: {
        title: "Strategy plan saved",
        description: `${unlockedStep.name} is now accessible with the strategy context needed for production.`,
      },
    };

    return copy[agentId] || {
      title: "Output saved",
      description: `${unlockedStep.name} is now accessible with the context needed to continue.`,
    };
  }

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
      const notice = getAgentCompletionNotice(agent.id, workflowStatus, nextWorkflowStatus);
      if (notice) {
        setCompletionNotice({
          ...notice,
          id: `${agent.id}-${Date.now()}`,
        });
      }
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
        workflowStatus={effectiveWorkflowStatus}
        showLogout={!isEmbedded}
        onSelectAgent={setActiveAgent}
        onLogout={handleLogout}
      />

      <section className="studio">
        {completionNotice && (
          <div className="completion-toast" role="status" aria-live="polite">
            <div className="completion-toast-icon" aria-hidden="true">
              <CheckCircle2 size={19} />
            </div>
            <div className="completion-toast-copy">
              <strong>{completionNotice.title}</strong>
              <span>{completionNotice.description}</span>
            </div>
            <button
              className="completion-toast-close"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setCompletionNotice(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <header className="studio-topbar">
          <div className="title-lockup">
            <h1>{activeAgent.name}</h1>
          </div>
          {!isEmbedded && (
            <label className={`dev-unlock-toggle ${devUnlockAll ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={devUnlockAll}
                onChange={(event) => setDevUnlockAll(event.target.checked)}
              />
              <span className="dev-unlock-switch" aria-hidden="true" />
              <span className="dev-unlock-copy">
                <FlaskConical size={15} />
                Unlock all
              </span>
            </label>
          )}
        </header>

        <div className="studio-layout">
          <div className="main-column">
            {isEscouade ? (
              <EscouadeWorkspace
                appSessionToken={ghlSession.data?.sessionToken}
                onWorkflowStatus={applyWorkflowStatus}
              />
            ) : (
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
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
