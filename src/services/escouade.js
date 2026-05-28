import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

async function requestEscouade(path, { method = "GET", body, appSessionToken }) {
  const response = await fetch(getApiUrl(path), {
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
  const response = await fetch(getApiUrl(`/escouade/batch/export-csv?batch_id=${encodeURIComponent(batchId)}`), {
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
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "escouade-export.csv";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
