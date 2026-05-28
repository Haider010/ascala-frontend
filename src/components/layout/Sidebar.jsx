import { Brain, Check, CircleDot, Lock, LogOut, Mic, SendHorizontal, Sparkles, Target, Users } from "lucide-react";
import { AGENT_WORKFLOW, WORKSPACES } from "../../config/agents";
import { LogoMark } from "../shared/LogoMark";

const ICONS = {
  molly: Brain,
  brandy: Mic,
  sacha: Target,
  escouade: Users,
  uply: SendHorizontal,
};

export function Sidebar({ activeAgent, workflowStatus, showLogout = true, onSelectAgent, onLogout }) {
  const steps = workflowStatus?.steps?.length ? workflowStatus.steps : AGENT_WORKFLOW;
  const completedCount = steps.filter((item) => item.completed).length;
  const progressLabel = `${completedCount}/${steps.length}`;

  return (
    <aside className="sidebar" aria-label="Ascala navigation">
      <div className="brand-stack">
        <LogoMark />
      </div>

      <div className="workflow-summary" aria-label="Agent workflow progress">
        <span>Sequence</span>
        <strong>{progressLabel}</strong>
      </div>

      <nav className="side-nav">
        {steps.map((item, index) => {
          const Icon = ICONS[item.id] || Sparkles;
          const isWorkspace = item.id in WORKSPACES;
          const isActive = isWorkspace && item.id === activeAgent.id;
          const isCompleted = item.completed || item.status === "completed";
          const isCurrent = item.status === "current";
          const isLocked = item.locked || !item.available;
          const canOpen = isWorkspace && item.available && !item.locked;
          const isUnlocked = canOpen && !isCompleted && !isCurrent;
          const StatusIcon = isCompleted ? Check : isCurrent || isUnlocked ? CircleDot : Lock;
          const stateLabel = isCompleted ? "Done" : isCurrent && item.available ? "Current" : isUnlocked ? "Available" : isCurrent ? "Next" : "Locked";

          return (
            <button
              className={[
                "nav-item",
                isActive ? "is-active" : "",
                isCompleted ? "is-complete" : "",
                isCurrent ? "is-current" : "",
                isLocked ? "is-locked" : "",
              ].filter(Boolean).join(" ")}
              key={item.id}
              type="button"
              disabled={!canOpen}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (canOpen) onSelectAgent(item.id);
              }}
            >
              <span className="nav-step-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="nav-agent-icon">
                <Icon size={19} />
              </span>
              <span className="nav-copy">
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </span>
              <span className="nav-state" title={stateLabel}>
                <StatusIcon size={15} />
              </span>
            </button>
          );
        })}
      </nav>

      {showLogout && (
        <button className="logout-button" type="button" onClick={onLogout}>
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      )}

      <footer className="sidebar-footer">
        &copy; 2025 ASCALA
        <br />
        All rights reserved.
      </footer>
    </aside>
  );
}
