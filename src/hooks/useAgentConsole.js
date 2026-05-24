import React from "react";
import { AGENTS } from "../config/agents";
import { AUTH_STORAGE_KEY } from "../config/auth";
import { API_BASE_URL } from "../config/runtime";
import { STORAGE_KEY } from "../config/storage";
import { fetchAgentHistory } from "../services/agents";
import { createDirectDevSession, createGhlSession, requestGhlEncryptedUserData } from "../services/ghl";
import { createInitialState } from "../state/conversations";
import { isEmbeddedInFrame } from "../utils/session";

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

function loadAgentHistories(sessionToken, signal) {
  return Promise.all(
    Object.keys(AGENTS).map((agentId) =>
      fetchAgentHistory({
        agentId,
        signal,
        appSessionToken: sessionToken,
      }),
    ),
  );
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
  const directSessionAttemptedRef = React.useRef(false);

  const activeAgent = AGENTS[state.activeAgentId];
  const activeConversation = state.conversations[state.activeAgentId];

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
        const histories = await loadAgentHistories(session.sessionToken, controller.signal);

        setState(mergeHistoriesIntoState(histories));
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
      !API_BASE_URL ||
      ghlSession.data?.sessionToken ||
      ghlSession.status === "checking" ||
      directSessionAttemptedRef.current
    ) {
      return;
    }

    const controller = new AbortController();
    directSessionAttemptedRef.current = true;

    async function verifyDirectDevSession() {
      setGhlSession({ status: "checking", data: null, error: "" });

      try {
        const session = await createDirectDevSession({ signal: controller.signal });
        const histories = await loadAgentHistories(session.sessionToken, controller.signal);

        setState(mergeHistoriesIntoState(histories));
        setGhlSession({ status: "ready", data: session, error: "" });
      } catch (sessionError) {
        if (controller.signal.aborted) return;
        setGhlSession({ status: "idle", data: null, error: "" });
        setError(sessionError.message || "Unable to create the direct dev session.");
      }
    }

    verifyDirectDevSession();

    return () => controller.abort();
  }, [ghlSession.data?.sessionToken, ghlSession.status, isAuthenticated, isEmbedded]);

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
  };
}
