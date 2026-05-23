export function createSessionId(agentId) {
  if (globalThis.crypto?.randomUUID) {
    return `${agentId}-${globalThis.crypto.randomUUID()}`;
  }

  return `${agentId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


export function isEmbeddedInFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}


export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}


export function sanitizeStorageScope(value) {
  return String(value || "direct")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 160);
}
