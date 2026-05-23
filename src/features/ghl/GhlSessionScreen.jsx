import { CircleAlert, Loader2 } from "lucide-react";

export function GhlSessionScreen({ status, error }) {
  const isError = status === "error";

  return (
    <main className="login-shell session-shell">
      <section className="login-panel session-panel" aria-labelledby="session-title">
        <div className="login-mark">
          {isError ? <CircleAlert size={24} /> : <Loader2 className="spin" size={24} />}
        </div>
        <div>
          <p className="eyebrow">HighLevel Session</p>
          <h2 id="session-title">{isError ? "Access unavailable" : "Connecting to GHL"}</h2>
        </div>
        <p className="session-copy">
          {isError
            ? error || "Unable to verify this HighLevel account."
            : "Verifying your signed HighLevel context and loading the correct workspace."}
        </p>
      </section>
    </main>
  );
}
