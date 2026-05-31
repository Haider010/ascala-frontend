import React from "react";
import { AGENTS, AGENT_WORKFLOW, WORKSPACES } from "../config/agents";
import { AUTH_STORAGE_KEY } from "../config/auth";
import { STORAGE_KEY } from "../config/storage";
import { fetchAgentHistory } from "../services/agents";
import { createDirectDevSession, createGhlSession, requestGhlEncryptedUserData } from "../services/ghl";
import { createInitialState } from "../state/conversations";
import { isEmbeddedInFrame } from "../utils/session";

const EMPTY_CONVERSATION = { sessionId: null, messages: [] };

function mergeHistoriesIntoState(histories) {
  const fresh = createInitialState();

  for (const history of histories) {
    const agent = AGENTS[history.agentId];
    if (!agent) continue;

    fresh.conversations[agent.id] = {
      sessionId: history.sessionId,
      messages:
        Array.isArray(history.messages) && history.messages.length > 0
          ? history.messages
          : fresh.conversations[agent.id].messages,
    };
  }

  return fresh;
}

function createDefaultWorkflowStatus() {
  return {
    currentAgentId: "molly",
    steps: AGENT_WORKFLOW.map((step, index) => ({
      ...step,
      status: index === 0 ? "current" : "locked",
      locked: index !== 0,
      completed: false,
    })),
  };
}

function getSelectableAgentId(workflowStatus, fallbackAgentId) {
  const currentAgentId = workflowStatus?.currentAgentId;
  if (currentAgentId in WORKSPACES) return currentAgentId;

  const firstUnlocked = workflowStatus?.steps?.find((step) => !step.locked && step.available && step.id in WORKSPACES);
  if (firstUnlocked) return firstUnlocked.id;

  return fallbackAgentId in WORKSPACES ? fallbackAgentId : "molly";
}

async function loadAgentHistories(sessionToken, signal) {
  const results = await Promise.allSettled(
    Object.keys(AGENTS).map((agentId) =>
      fetchAgentHistory({
        agentId,
        signal,
        appSessionToken: sessionToken,
      }),
    ),
  );
  const histories = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  return histories;
}

async function getSessionHistories(session, signal) {
  if (Array.isArray(session.histories)) {
    return session.histories;
  }

  return loadAgentHistories(session.sessionToken, signal);
}

export function useAgentConsole() {
  const [isEmbedded] = React.useState(isEmbeddedInFrame);
  const [ghlSession, setGhlSession] = React.useState({
    status: isEmbeddedInFrame() ? "checking" : "idle",
    data: null,
    error: "",
  });
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => !isEmbeddedInFrame() && localStorage.getItem(AUTH_STORAGE_KEY) === "true",
  );
  const [state, setState] = React.useState(createInitialState);
  const [draft, setDraft] = React.useState("");
  const [pendingAgentId, setPendingAgentId] = React.useState(null);
  const [error, setError] = React.useState("");
  const [workflowStatus, setWorkflowStatus] = React.useState(createDefaultWorkflowStatus);
  const directSessionAttemptedRef = React.useRef(false);

  const effectiveWorkflowStatus = workflowStatus;
  const activeAgent = WORKSPACES[state.activeAgentId] || WORKSPACES.molly;
  const activeConversation = state.conversations[state.activeAgentId] || EMPTY_CONVERSATION;
  const isConversationLoading = isAuthenticated && ghlSession.status === "checking";

  function applyWorkflowStatus(nextWorkflowStatus, moveToCurrent = true) {
    if (!nextWorkflowStatus) return;

    setWorkflowStatus(nextWorkflowStatus);
    if (!moveToCurrent) return;

    setState((current) => ({
      ...current,
      activeAgentId: getSelectableAgentId(nextWorkflowStatus, current.activeAgentId),
    }));
  }

  React.useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

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
        const histories = await getSessionHistories(session, controller.signal);

        const nextWorkflowStatus = session.workflowStatus || createDefaultWorkflowStatus();
        setState({
          ...mergeHistoriesIntoState(histories),
          activeAgentId: getSelectableAgentId(nextWorkflowStatus, state.activeAgentId),
        });
        applyWorkflowStatus(nextWorkflowStatus, false);
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
    if (
      isEmbedded ||
      !isAuthenticated ||
      directSessionAttemptedRef.current
    ) {
      return;
    }

    const controller = new AbortController();
    let completed = false;
    directSessionAttemptedRef.current = true;

    async function verifyDirectDevSession() {
      setGhlSession({ status: "checking", data: null, error: "" });

      try {
        const session = await createDirectDevSession({ signal: controller.signal });
        if (controller.signal.aborted) return;

        if (!session.sessionToken) {
          throw new Error("Direct dev session response did not include a session token.");
        }

        const histories = await getSessionHistories(session, controller.signal);
        if (controller.signal.aborted) return;

        const nextWorkflowStatus = session.workflowStatus || createDefaultWorkflowStatus();
        setState({
          ...mergeHistoriesIntoState(histories),
          activeAgentId: getSelectableAgentId(nextWorkflowStatus, state.activeAgentId),
        });
        applyWorkflowStatus(nextWorkflowStatus, false);
        setGhlSession({ status: "ready", data: session, error: "" });
        completed = true;
      } catch (sessionError) {
        if (controller.signal.aborted) {
          directSessionAttemptedRef.current = false;
          return;
        }
        setGhlSession({ status: "idle", data: null, error: "" });
        setError(sessionError.message || "Unable to create the direct dev session.");
      }
    }

    verifyDirectDevSession();

    return () => {
      if (!completed) {
        directSessionAttemptedRef.current = false;
      }
      controller.abort();
    };
  }, [isAuthenticated, isEmbedded]);

  function updateConversation(agentId, updater) {
    setState((current) => ({
      ...current,
      conversations: {
        ...current.conversations,
        [agentId]: updater(current.conversations[agentId]),
      },
    }));
  }

  function resetConsole(nextWorkflowStatus = createDefaultWorkflowStatus()) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("ascala-dev-unlock-all");
    setState(createInitialState());
    setWorkflowStatus(nextWorkflowStatus || createDefaultWorkflowStatus());
    setDraft("");
    setError("");
    setPendingAgentId(null);
  }

  function setActiveAgent(agentId) {
    const step = effectiveWorkflowStatus.steps.find((item) => item.id === agentId);
    if (!step || step.locked || !step.available || !(agentId in WORKSPACES)) return;

    setState((current) => ({ ...current, activeAgentId: agentId }));
    setDraft("");
    setError("");
  }

  function handleLogin() {
    if (isEmbedded) return;
    directSessionAttemptedRef.current = false;
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
  }

  function handleLogout() {
    if (!isEmbedded) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    directSessionAttemptedRef.current = false;
    setGhlSession({ status: "idle", data: null, error: "" });
    setIsAuthenticated(false);
    setDraft("");
    setError("");
  }

  return {
    activeAgent,
    activeConversation,
    draft,
    error,
    effectiveWorkflowStatus,
    ghlSession,
    isAuthenticated,
    isEmbedded,
    isConversationLoading,
    pendingAgentId,
    resetConsole,
    setActiveAgent,
    setDraft,
    setError,
    setPendingAgentId,
    updateConversation,
    workflowStatus,
    applyWorkflowStatus,
    handleLogin,
    handleLogout,
  };
}
