import React from "react";
import { AGENTS } from "../config/agents";
import { AUTH_STORAGE_KEY } from "../config/auth";
import { STORAGE_KEY } from "../config/storage";
import { createGhlSession, requestGhlEncryptedUserData } from "../services/ghl";
import { loadState } from "../state/conversations";
import { sanitizeStorageScope, isEmbeddedInFrame } from "../utils/session";

export function useAgentConsole() {
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

  const activeAgent = AGENTS[state.activeAgentId];
  const activeConversation = state.conversations[state.activeAgentId];

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
