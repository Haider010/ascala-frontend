import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";
import { AGENT_REQUEST_TIMEOUT_MS } from "../config/runtime";

const ESCOUADE_REQUEST_TIMEOUT_MS = AGENT_REQUEST_TIMEOUT_MS;
const escouadeWorkspaceCacheBySession = new Map();

export function getEscouadeWorkspaceCache(appSessionToken) {
  if (!appSessionToken) return null;
  return escouadeWorkspaceCacheBySession.get(appSessionToken) || null;
}

export function setEscouadeWorkspaceCache(appSessionToken, value) {
  if (!appSessionToken) return;
  escouadeWorkspaceCacheBySession.set(appSessionToken, {
    ...value,
    cachedAt: Date.now(),
  });
}

export function clearEscouadeWorkspaceCache(appSessionToken) {
  if (appSessionToken) {
    escouadeWorkspaceCacheBySession.delete(appSessionToken);
    return;
  }
  escouadeWorkspaceCacheBySession.clear();
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = ESCOUADE_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Escouade is taking longer than expected. Please try again in a moment.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function requestEscouade(path, { method = "GET", body, appSessionToken }) {
  const response = await fetchWithTimeout(getApiUrl(path), {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${appSessionToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getResponseText(payload.detail) || payload.detail || "Escouade request failed.");
  }

  return payload;
}

function parseWorkflowStatusHeader(response) {
  const workflowStatusHeader = response.headers.get("X-Workflow-Status");
  if (!workflowStatusHeader) return null;

  try {
    return JSON.parse(workflowStatusHeader);
  } catch {
    return null;
  }
}

export function generateEscouadeBatch({ appSessionToken, memberType, batchName, sourceType, sourceLabel, filters, message, conversationHistory = [] }) {
  return requestEscouade("/escouade/batch/generate", {
    method: "POST",
    appSessionToken,
    body: {
      member_type: memberType,
      batch_name: batchName,
      source_type: sourceType,
      source_label: sourceLabel,
      filters,
      message,
      conversation_history: conversationHistory,
    },
  });
}

export function getEscouadeProductionBrief({ appSessionToken }) {
  return requestEscouade("/escouade/brief", {
    appSessionToken,
  });
}

export function getLatestEscouadeBatch({ appSessionToken }) {
  return requestEscouade("/escouade/batch/latest", {
    appSessionToken,
  });
}

export function listEscouadeBatches({ appSessionToken, limit = 30 }) {
  return requestEscouade(`/escouade/batch/history?limit=${encodeURIComponent(limit)}`, {
    appSessionToken,
  });
}

export function getEscouadeBatch({ appSessionToken, batchId }) {
  return requestEscouade(`/escouade/batch/${encodeURIComponent(batchId)}`, {
    appSessionToken,
  });
}

export function getEscouadeChat({ appSessionToken }) {
  return requestEscouade("/escouade/chat", {
    appSessionToken,
  });
}

export function saveEscouadeChatMessage({ appSessionToken, role, content, metadata = {} }) {
  return requestEscouade("/escouade/chat/message", {
    method: "POST",
    appSessionToken,
    body: {
      role,
      content,
      metadata,
    },
  });
}

export function parseEscouadeSetupInstruction({ appSessionToken, instruction, currentSetup, conversationHistory = [] }) {
  return requestEscouade("/escouade/setup/parse", {
    method: "POST",
    appSessionToken,
    body: {
      instruction,
      current_setup: currentSetup,
      conversation_history: conversationHistory,
    },
  });
}

export function commandEscouadeBatch({ appSessionToken, batchId, message, conversationHistory = [] }) {
  return requestEscouade("/escouade/batch/command", {
    method: "POST",
    appSessionToken,
    body: {
      batch_id: batchId,
      message,
      conversation_history: conversationHistory,
    },
  });
}

export function reviseEscouadeItems({ appSessionToken, batchId, itemIds, instruction, conversationHistory = [] }) {
  return requestEscouade("/escouade/batch/revise", {
    method: "POST",
    appSessionToken,
    body: {
      batch_id: batchId,
      item_ids: itemIds,
      instruction,
      conversation_history: conversationHistory,
    },
  });
}

export function approveEscouadeItems({ appSessionToken, batchId, itemIds }) {
  return requestEscouade("/escouade/batch/approve", {
    method: "POST",
    appSessionToken,
    body: {
      batch_id: batchId,
      item_ids: itemIds,
    },
  });
}

export function reopenEscouadeItems({ appSessionToken, batchId, itemIds }) {
  return requestEscouade("/escouade/batch/reopen", {
    method: "POST",
    appSessionToken,
    body: {
      batch_id: batchId,
      item_ids: itemIds,
    },
  });
}

export async function exportEscouadeCsv({ appSessionToken, batchId }) {
  const response = await fetchWithTimeout(getApiUrl(`/escouade/batch/export-csv?batch_id=${encodeURIComponent(batchId)}`), {
    headers: {
      Authorization: `Bearer ${appSessionToken}`,
    },
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to export CSV.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const workflowStatus = parseWorkflowStatusHeader(response);
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "escouade-export.csv";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return { filename, workflowStatus };
}
