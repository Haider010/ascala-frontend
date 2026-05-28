import { CircleAlert, Sparkles, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripAscalaMarkers } from "../../utils/format";

function MessageMarkdown({ content }) {
  return (
    <div className="message-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {stripAscalaMarkers(content)}
      </ReactMarkdown>
    </div>
  );
}

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
        {isUser ? <p>{message.content}</p> : <MessageMarkdown content={message.content} />}
      </div>
    </article>
  );
}
