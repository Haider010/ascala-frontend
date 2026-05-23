import { CircleAlert, Sparkles, UserRound } from "lucide-react";
import { formatTime } from "../../utils/format";

export function MessageBubble({ message, agent }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const Icon = isUser ? UserRound : isSystem ? CircleAlert : Sparkles;

  return (
    <article className={`message ${isUser ? "from-user" : ""} ${isSystem ? "from-system" : ""}`}>
      <div className="message-icon">
        <Icon size={16} />
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span>{isUser ? "You" : isSystem ? "System" : agent.name}</span>
          <time>{formatTime(message.createdAt)}</time>
        </div>
        <p>{message.content}</p>
      </div>
    </article>
  );
}
