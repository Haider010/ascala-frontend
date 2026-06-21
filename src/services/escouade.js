import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";
import { AGENT_REQUEST_TIMEOUT_MS } from "../config/runtime";

const ESCOUADE_REQUEST_TIMEOUT_MS = AGENT_REQUEST_TIMEOUT_MS;

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

export function generateEscouadeBatch({ appSessionToken, memberType, batchName, sourceType, sourceLabel, filters, message }) {
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
    },
  });
}

export function commandEscouadeBatch({ appSessionToken, batchId, message }) {
  return requestEscouade("/escouade/batch/command", {
    method: "POST",
    appSessionToken,
    body: {
      batch_id: batchId,
      message,
    },
  });
}

export function reviseEscouadeItems({ appSessionToken, batchId, itemIds, instruction }) {
  return requestEscouade("/escouade/batch/revise", {
    method: "POST",
    appSessionToken,
    body: {
      batch_id: batchId,
      item_ids: itemIds,
      instruction,
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
