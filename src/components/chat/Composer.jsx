import { ArrowRight, Loader2, Send } from "lucide-react";

export function Composer({ activeAgent, draft, pendingAgentId, onDraftChange, onKeyDown, onSend }) {
  return (
    <form className="composer" onSubmit={onSend}>
      <label className="sr-only" htmlFor="message-input">
        Message {activeAgent.name}
      </label>
      <textarea
        id="message-input"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={activeAgent.prompt}
        rows={2}
      />
      <button className="primary-action" type="submit" disabled={!draft.trim() || Boolean(pendingAgentId)}>
        {pendingAgentId ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        <span>Send to {activeAgent.name.replace("\u2122", "")}</span>
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
