import { useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";

export function Composer({ activeAgent, draft, pendingAgentId, onDraftChange, onKeyDown, onSend }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
    const verticalPadding = textarea.offsetHeight - textarea.clientHeight;
    const maxHeight = lineHeight * 5 + verticalPadding;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draft]);

  return (
    <form className="composer" onSubmit={onSend}>
      <label className="sr-only" htmlFor="message-input">
        Message {activeAgent.name}
      </label>
      <textarea
        ref={textareaRef}
        id="message-input"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={activeAgent.prompt}
        rows={1}
      />
      <button
        className="send-icon-button"
        type="submit"
        disabled={!draft.trim() || Boolean(pendingAgentId)}
        aria-label={`Send to ${activeAgent.name.replace("\u2122", "")}`}
      >
        {pendingAgentId ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
      </button>
    </form>
  );
}
