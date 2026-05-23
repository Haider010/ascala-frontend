import { Brain, LogOut, Mic } from "lucide-react";
import { AGENTS } from "../../config/agents";
import { LogoMark } from "../shared/LogoMark";

export function Sidebar({ activeAgent, onSelectAgent, onLogout }) {
  const navItems = [
    { id: "molly", label: "Molly\u2122", sublabel: AGENTS.molly.role, icon: Brain },
    { id: "brandy", label: "Brandy\u2122", sublabel: AGENTS.brandy.role, icon: Mic },
  ];

  return (
    <aside className="sidebar" aria-label="Ascala navigation">
      <div className="brand-stack">
        <LogoMark />
      </div>

      <nav className="side-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isAgent = item.id in AGENTS;
          const isActive = isAgent && item.id === activeAgent.id;

          return (
            <button
              className={`nav-item ${isActive ? "is-active" : ""}`}
              key={item.id}
              type="button"
              onClick={() => {
                if (isAgent) onSelectAgent(item.id);
              }}
            >
              <Icon size={22} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.sublabel}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <button className="logout-button" type="button" onClick={onLogout}>
        <LogOut size={17} />
        <span>Logout</span>
      </button>

      <footer className="sidebar-footer">
        &copy; 2025 ASCALA
        <br />
        All rights reserved.
      </footer>
    </aside>
  );
}
