import React from "react";
import { CheckCircle2, CircleAlert, Trash2, X } from "lucide-react";
import { clearAccountOutputs, clearAgentOutput, sendToAgent } from "./services/agents";
import { useAgentConsole } from "./hooks/useAgentConsole";
import { Sidebar } from "./components/layout/Sidebar";
import { MessageBubble } from "./components/chat/MessageBubble";
import { Composer } from "./components/chat/Composer";
import { BrandBoardWorkspace } from "./features/brandboard/BrandBoardWorkspace";
import { EscouadeWorkspace } from "./features/escouade/EscouadeWorkspace";
import { GhlSessionScreen } from "./features/ghl/GhlSessionScreen";
import { LandingPage } from "./features/landing/LandingPage";
import { LoginScreen } from "./features/auth/LoginScreen";
import { UplyWorkspace } from "./features/uply/UplyWorkspace";
import { TokenUsageWorkspace } from "./features/usage/TokenUsageWorkspace";
import { AGENT_REQUEST_TIMEOUT_MS } from "./config/runtime";

export function App() {
  const {
    activeAgent,
    activeConversation,
    draft,
    error,
    effectiveWorkflowStatus,
    ghlSession,
    devUnlockAll,
    isAuthenticated,
    isEmbedded,
    isLocalDev,
    isConversationLoading,
    pendingAgentId,
    resetConsole,
    resetAgentConversation,
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
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showClearAgentConfirm, setShowClearAgentConfirm] = React.useState(false);
  const [isClearingOutputs, setIsClearingOutputs] = React.useState(false);
  const [isClearingAgentOutput, setIsClearingAgentOutput] = React.useState(false);
  const [clearError, setClearError] = React.useState("");
  const [showLanding, setShowLanding] = React.useState(true);
  const [workspaceResetKey, setWorkspaceResetKey] = React.useState(0);
  const isBrandBoard = activeAgent.id === "brandboard";
  const isEscouade = activeAgent.id === "escouade";
  const isUply = activeAgent.id === "uply";
  const isUsage = activeAgent.id === "usage";
  const canClearActiveAgent = activeAgent.id !== "usage";
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
        description: `${unlockedStep.name} is now accessible. It will use Molly's saved audience and messaging context for the next layer.`,
      },
      brandy: {
        title: "Brand voice saved",
        description: `${unlockedStep.name} is now accessible. It will use the saved audience, positioning, and voice foundation.`,
      },
      brandboard: {
        title: "Brand guidelines saved",
        description: `${unlockedStep.name} is now accessible. It will use the saved brand system to plan the content strategy.`,
      },
      sacha: {
        title: "Strategy plan saved",
        description: `${unlockedStep.name} is now accessible. It will use the saved strategy context for production.`,
      },
    };

    const baseNotice = copy[agentId] || {
      title: "Output saved",
      description: `${unlockedStep.name} is now accessible with the context needed to continue.`,
    };

    return {
      ...baseNotice,
      nextAgentId: unlockedStep.id,
      nextAgentName: unlockedStep.name,
    };
  }

  function showCompletionNoticeFor(agentId, previousStatus, nextStatus) {
    const notice = getAgentCompletionNotice(agentId, previousStatus, nextStatus);
    if (!notice) return;

    setCompletionNotice({
      ...notice,
      id: `${agentId}-${Date.now()}`,
    });
  }

  function handleWorkspaceWorkflowStatus(nextWorkflowStatus, moveToCurrent = true, showNotice = true) {
    if (showNotice) {
      showCompletionNoticeFor(activeAgent.id, workflowStatus, nextWorkflowStatus);
    }
    applyWorkflowStatus(nextWorkflowStatus, moveToCurrent);
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
    const timeout = window.setTimeout(() => controller.abort(), AGENT_REQUEST_TIMEOUT_MS);

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
      showCompletionNoticeFor(agent.id, workflowStatus, nextWorkflowStatus);
      applyWorkflowStatus(nextWorkflowStatus, false);
    } catch (requestError) {
      const description =
        requestError.name === "AbortError"
          ? "The agent is taking longer than expected. Please try again in a moment."
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

  async function handleClearAll() {
    if (!ghlSession.data?.sessionToken || isClearingOutputs || isClearingAgentOutput) return;

    setIsClearingOutputs(true);
    setClearError("");
    setError("");
    try {
      const result = await clearAccountOutputs({
        appSessionToken: ghlSession.data.sessionToken,
      });
      resetConsole(result.workflowStatus);
      setShowLanding(true);
      setCompletionNotice(null);
      setShowClearConfirm(false);
    } catch (clearError) {
      setClearError(clearError.message || "Unable to clear account outputs.");
      setError(clearError.message || "Unable to clear account outputs.");
    } finally {
      setIsClearingOutputs(false);
    }
  }

  async function handleClearActiveAgent() {
    if (!ghlSession.data?.sessionToken || isClearingAgentOutput || !canClearActiveAgent) return;

    const agentId = activeAgent.id;
    setIsClearingAgentOutput(true);
    setClearError("");
    setError("");
    try {
      const result = await clearAgentOutput({
        appSessionToken: ghlSession.data.sessionToken,
        agentId,
      });
      resetAgentConversation(agentId, result.workflowStatus);
      setWorkspaceResetKey((current) => current + 1);
      setCompletionNotice(null);
      setShowClearAgentConfirm(false);
    } catch (clearError) {
      setClearError(clearError.message || `Unable to clear ${activeAgent.name}.`);
      setError(clearError.message || `Unable to clear ${activeAgent.name}.`);
    } finally {
      setIsClearingAgentOutput(false);
    }
  }

  if (isEmbedded && !isAuthenticated) {
    return <GhlSessionScreen status={ghlSession.status} error={ghlSession.error} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  function handleEnterWorkspace() {
    const currentAgentId = effectiveWorkflowStatus?.currentAgentId;
    if (currentAgentId) {
      setActiveAgent(currentAgentId);
    }
    setShowLanding(false);
  }

  if (showLanding) {
    return (
      <LandingPage
        workflowStatus={effectiveWorkflowStatus}
        isSessionReady={Boolean(ghlSession.data?.sessionToken)}
        onEnterWorkspace={handleEnterWorkspace}
      />
    );
  }

  return (
    <main className="ascala-workspace" style={{ "--agent-accent": activeAgent.accent }}>
      <Sidebar
        activeAgent={activeAgent}
        workflowStatus={effectiveWorkflowStatus}
        showLogout={!isEmbedded}
        onSelectAgent={setActiveAgent}
        onOpenLanding={() => setShowLanding(true)}
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
              {completionNotice.nextAgentId && (
                <button
                  className="completion-toast-action"
                  type="button"
                  onClick={() => {
                    setActiveAgent(completionNotice.nextAgentId);
                    setCompletionNotice(null);
                  }}
                >
                  Continue to {completionNotice.nextAgentName}
                </button>
              )}
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
          <div className="topbar-actions">
            {isLocalDev && (
              <label className="dev-unlock-toggle">
                <input
                  type="checkbox"
                  checked={devUnlockAll}
                  onChange={(event) => setDevUnlockAll(event.target.checked)}
                />
                <span className="dev-unlock-track" aria-hidden="true">
                  <span />
                </span>
                <span className="dev-unlock-label">Unlock all</span>
              </label>
            )}
            {canClearActiveAgent && (
              <button
                className="clear-agent-button"
                type="button"
                disabled={!ghlSession.data?.sessionToken || isClearingOutputs || isClearingAgentOutput}
                onClick={() => {
                  setClearError("");
                  setShowClearAgentConfirm(true);
                }}
              >
                <Trash2 size={15} />
                Clear this layer
              </button>
            )}
            <button
              className="clear-all-button"
              type="button"
              disabled={!ghlSession.data?.sessionToken || isClearingOutputs || isClearingAgentOutput}
              onClick={() => {
                setClearError("");
                setShowClearConfirm(true);
              }}
            >
              <Trash2 size={15} />
              Clear all
            </button>
          </div>
        </header>

        <div className="studio-layout">
          <div className={["main-column", isUsage ? "is-usage-column" : ""].filter(Boolean).join(" ")}>
            {isBrandBoard ? (
              <BrandBoardWorkspace
                key={`brandboard-${workspaceResetKey}`}
                appSessionToken={ghlSession.data?.sessionToken}
                onWorkflowStatus={handleWorkspaceWorkflowStatus}
              />
            ) : isEscouade ? (
              <EscouadeWorkspace
                key={`escouade-${workspaceResetKey}`}
                appSessionToken={ghlSession.data?.sessionToken}
                onWorkflowStatus={handleWorkspaceWorkflowStatus}
              />
            ) : isUply ? (
              <UplyWorkspace appSessionToken={ghlSession.data?.sessionToken} />
            ) : isUsage ? (
              <TokenUsageWorkspace appSessionToken={ghlSession.data?.sessionToken} />
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

      {showClearConfirm && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-all-title">
            <button
              className="confirm-modal-close"
              type="button"
              aria-label="Cancel clear all"
              onClick={() => {
                setClearError("");
                setShowClearConfirm(false);
              }}
              disabled={isClearingOutputs}
            >
              <X size={16} />
            </button>
            <div className="confirm-modal-icon" aria-hidden="true">
              <Trash2 size={21} />
            </div>
            <div className="confirm-modal-copy">
              <h2 id="clear-all-title">Clear all agent outputs?</h2>
              <p>
                This will remove saved Molly, Brandy, BrandBoard, Sacha, and Escouade outputs for this account,
                clear the stored chat history, lock the workflow again, and return you to the intro page.
              </p>
            </div>
            {clearError && <div className="confirm-modal-error" role="alert">{clearError}</div>}
            <div className="confirm-modal-actions">
              <button
                className="ghost-confirm-button"
                type="button"
                onClick={() => {
                  setClearError("");
                  setShowClearConfirm(false);
                }}
                disabled={isClearingOutputs}
              >
                Cancel
              </button>
              <button
                className="danger-confirm-button"
                type="button"
                onClick={handleClearAll}
                disabled={isClearingOutputs}
              >
                {isClearingOutputs ? "Clearing..." : "Yes, clear all"}
              </button>
            </div>
          </section>
        </div>
      )}

      {showClearAgentConfirm && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal confirm-modal-agent" role="dialog" aria-modal="true" aria-labelledby="clear-agent-title">
            <button
              className="confirm-modal-close"
              type="button"
              aria-label={`Cancel clearing ${activeAgent.name}`}
              onClick={() => {
                setClearError("");
                setShowClearAgentConfirm(false);
              }}
              disabled={isClearingAgentOutput}
            >
              <X size={16} />
            </button>
            <div className="confirm-modal-icon" aria-hidden="true">
              <Trash2 size={21} />
            </div>
            <div className="confirm-modal-copy">
              <h2 id="clear-agent-title">Clear {activeAgent.name} output?</h2>
              <p>
                This removes saved data for {activeAgent.name} only. Other agent outputs stay in the account,
                but the workflow will recalculate based on what remains.
              </p>
            </div>
            {clearError && <div className="confirm-modal-error" role="alert">{clearError}</div>}
            <div className="confirm-modal-actions">
              <button
                className="ghost-confirm-button"
                type="button"
                onClick={() => {
                  setClearError("");
                  setShowClearAgentConfirm(false);
                }}
                disabled={isClearingAgentOutput}
              >
                Cancel
              </button>
              <button
                className="danger-confirm-button"
                type="button"
                onClick={handleClearActiveAgent}
                disabled={isClearingAgentOutput}
              >
                {isClearingAgentOutput ? "Clearing..." : "Yes, clear this layer"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
