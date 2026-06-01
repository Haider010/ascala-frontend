import { getApiUrl } from "./api";
import { getResponseText } from "../utils/format";

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function parseSummaryHeader(response) {
  const summaryHeader = response.headers.get("X-Uply-Summary");
  if (!summaryHeader) return null;

  try {
    return JSON.parse(summaryHeader);
  } catch {
    return null;
  }
}

export async function prepareUplySocialPlannerCsv({ appSessionToken, scheduleFile, mediaZip }) {
  const formData = new FormData();
  formData.append("schedule_file", scheduleFile);
  formData.append("media_zip", mediaZip);

  const response = await fetch(getApiUrl("/uply/social-planner/prepare"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appSessionToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw new Error(getResponseText(payload.detail) || payload.detail || "Unable to prepare the GHL CSV.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || "uply-ghl-ready.csv";
  const summary = parseSummaryHeader(response);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return { filename, summary };
}
