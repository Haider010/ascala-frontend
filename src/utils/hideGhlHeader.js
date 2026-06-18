const GHL_HEADER_SELECTOR = "header.hl_header.hl_header--collapse";
const STYLE_ID = "ascala-hide-ghl-header";

function installHideStyle(doc) {
  if (!doc?.head || doc.getElementById(STYLE_ID)) return;

  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    ${GHL_HEADER_SELECTOR} {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
  `;
  doc.head.appendChild(style);
}

function hideHeaderInDocument(doc) {
  if (!doc) return;

  installHideStyle(doc);
  doc.querySelectorAll(GHL_HEADER_SELECTOR).forEach((header) => {
    header.style.setProperty("display", "none", "important");
    header.style.setProperty("visibility", "hidden", "important");
    header.style.setProperty("height", "0", "important");
    header.style.setProperty("min-height", "0", "important");
    header.style.setProperty("overflow", "hidden", "important");
    header.style.setProperty("pointer-events", "none", "important");
  });
}

function observeDocument(doc) {
  if (!doc?.body) return null;

  const observer = new MutationObserver(() => hideHeaderInDocument(doc));
  observer.observe(doc.body, { childList: true, subtree: true });
  return observer;
}

export function hideGhlHeader() {
  if (typeof window === "undefined") return () => {};

  const observers = [];
  hideHeaderInDocument(window.document);
  const currentObserver = observeDocument(window.document);
  if (currentObserver) observers.push(currentObserver);

  try {
    if (window.parent && window.parent !== window && window.parent.document) {
      hideHeaderInDocument(window.parent.document);
      const parentObserver = observeDocument(window.parent.document);
      if (parentObserver) observers.push(parentObserver);
    }
  } catch {
    // GHL often renders custom pages in a cross-origin iframe. In that case
    // browser security prevents the app from styling the parent document.
  }

  return () => observers.forEach((observer) => observer.disconnect());
}
