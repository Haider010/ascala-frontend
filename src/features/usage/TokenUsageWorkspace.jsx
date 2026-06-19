import React from "react";
import { BarChart3, CircleAlert, Database, RefreshCw } from "lucide-react";
import { fetchTokenUsage } from "../../services/usage";

const AGENT_LABELS = {
  molly: "Molly",
  brandy: "Brandy",
  brandboard: "BrandBoard",
  sacha: "Sacha",
  escouade: "Escouade",
};

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function formatMonth(month) {
  if (!month) return "Unknown";
  const [year, value] = month.split("-");
  const date = new Date(Number(year), Number(value || 1) - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function TokenMetric({ label, value, tone = "default" }) {
  return (
    <div className={`usage-metric usage-metric-${tone}`}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function TokenSummaryCard({ title, subtitle, totals, icon: Icon }) {
  return (
    <section className="usage-summary-card">
      <div className="usage-card-heading">
        <span className="usage-card-icon">
          <Icon size={18} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="usage-metric-grid">
        <TokenMetric label="Fresh input" value={totals?.freshInputTokens} tone="accent" />
        <TokenMetric label="Cached input" value={totals?.cachedInputTokens} />
        <TokenMetric label="Input total" value={totals?.inputTokens} />
        <TokenMetric label="Output" value={totals?.outputTokens} />
        <TokenMetric label="Grand total" value={totals?.totalTokens} />
        <TokenMetric label="Calls" value={totals?.callCount} />
      </div>
    </section>
  );
}

export function TokenUsageWorkspace({ appSessionToken }) {
  const [usage, setUsage] = React.useState(null);
  const [status, setStatus] = React.useState("idle");
  const [error, setError] = React.useState("");

  const loadUsage = React.useCallback(
    async ({ signal } = {}) => {
      if (!appSessionToken) return;
      setStatus("loading");
      setError("");
      try {
        const result = await fetchTokenUsage({ appSessionToken, signal });
        setUsage(result);
        setStatus("ready");
      } catch (usageError) {
        if (usageError.name === "AbortError") return;
        setError(usageError.message || "Unable to load token usage.");
        setStatus("error");
      }
    },
    [appSessionToken],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadUsage({ signal: controller.signal });
    return () => controller.abort();
  }, [loadUsage]);

  const rawMonths = usage?.months || [];
  const hasCurrentMonthUsage = Boolean(
    usage?.currentMonthKey
      && (
        Number(usage?.currentMonth?.inputTokens || 0)
        || Number(usage?.currentMonth?.outputTokens || 0)
        || Number(usage?.currentMonth?.totalTokens || 0)
        || Number(usage?.currentMonth?.callCount || 0)
      ),
  );
  const months = rawMonths.length
    ? rawMonths
    : hasCurrentMonthUsage
      ? [{ month: usage.currentMonthKey, ...usage.currentMonth }]
      : [];
  const agents = usage?.agents || [];
  const recentEvents = usage?.recentEvents || [];

  return (
    <section className="usage-workspace">
      <div className="usage-header">
        <div>
          <h2>Token Consumption</h2>
          <p>Monthly and all-time usage across every user in this account.</p>
        </div>
        <button
          className="usage-refresh-button"
          type="button"
          disabled={status === "loading" || !appSessionToken}
          onClick={() => loadUsage()}
        >
          <RefreshCw size={15} className={status === "loading" ? "is-spinning" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="usage-error" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      {status === "loading" && !usage ? (
        <div className="usage-loading" role="status" aria-label="Loading token usage">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <>
          <div className="usage-summary-grid">
            <TokenSummaryCard
              title="Current Month"
              subtitle={formatMonth(usage?.currentMonthKey)}
              totals={usage?.currentMonth}
              icon={BarChart3}
            />
            <TokenSummaryCard
              title="All Time"
              subtitle="Total usage recorded across all months"
              totals={usage?.allTime}
              icon={Database}
            />
          </div>

          <section className="usage-table-section">
            <div className="usage-section-heading">
              <h3>Monthly Breakdown</h3>
              <span>{months.length ? `${months.length} month${months.length === 1 ? "" : "s"}` : "No usage yet"}</span>
            </div>
            <div className="usage-table-wrap">
              <table className="usage-table usage-table-months">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Fresh input</th>
                    <th>Cached input</th>
                    <th>Input total</th>
                    <th>Output</th>
                    <th>Grand total</th>
                    <th>Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {months.length ? (
                    months.map((month) => (
                      <tr key={month.month}>
                        <td>{formatMonth(month.month)}</td>
                        <td>{formatNumber(month.freshInputTokens)}</td>
                        <td>{formatNumber(month.cachedInputTokens)}</td>
                        <td>{formatNumber(month.inputTokens)}</td>
                        <td>{formatNumber(month.outputTokens)}</td>
                        <td>{formatNumber(month.totalTokens)}</td>
                        <td>{formatNumber(month.callCount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">No token usage has been recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="usage-table-section">
            <div className="usage-section-heading">
              <h3>Agent Breakdown</h3>
              <span>{agents.length ? `${agents.length} row${agents.length === 1 ? "" : "s"}` : "No usage yet"}</span>
            </div>
            <div className="usage-table-wrap">
              <table className="usage-table usage-table-agents">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Month</th>
                    <th>Model</th>
                    <th>Fresh input</th>
                    <th>Cached input</th>
                    <th>Input total</th>
                    <th>Output</th>
                    <th>Grand total</th>
                    <th>Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length ? (
                    agents.map((agent) => (
                      <tr key={`${agent.agentId}-${agent.month}`}>
                        <td>{AGENT_LABELS[agent.agentId] || agent.agentId}</td>
                        <td>{formatMonth(agent.month)}</td>
                        <td>{agent.model || "Unknown"}</td>
                        <td>{formatNumber(agent.freshInputTokens)}</td>
                        <td>{formatNumber(agent.cachedInputTokens)}</td>
                        <td>{formatNumber(agent.inputTokens)}</td>
                        <td>{formatNumber(agent.outputTokens)}</td>
                        <td>{formatNumber(agent.totalTokens)}</td>
                        <td>{formatNumber(agent.callCount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No agent usage has been recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="usage-table-section">
            <div className="usage-section-heading">
              <h3>Recent Calls</h3>
              <span>{recentEvents.length ? `Latest ${recentEvents.length}` : "No call events yet"}</span>
            </div>
            <div className="usage-table-wrap">
              <table className="usage-table usage-table-events">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Agent</th>
                    <th>Model</th>
                    <th>Fresh input</th>
                    <th>Cached input</th>
                    <th>Input total</th>
                    <th>Output</th>
                    <th>Grand total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.length ? (
                    recentEvents.map((event, index) => (
                      <tr key={`${event.responseId || "event"}-${event.recordedAt || index}`}>
                        <td>{formatDateTime(event.recordedAt)}</td>
                        <td>{AGENT_LABELS[event.agentId] || event.agentId}</td>
                        <td>{event.model || "Unknown"}</td>
                        <td>{formatNumber(event.freshInputTokens)}</td>
                        <td>{formatNumber(event.cachedInputTokens)}</td>
                        <td>{formatNumber(event.inputTokens)}</td>
                        <td>{formatNumber(event.outputTokens)}</td>
                        <td>{formatNumber(event.totalTokens)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">New AI calls will appear here after the event ledger is active.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
