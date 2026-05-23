import { Brain, Mic } from "lucide-react";
import { AGENTS } from "../../config/agents";

export function TeamMembers({ activeAgent, onSelectAgent }) {
  return (
    <section className="team-strip" aria-labelledby="team-title">
      <p id="team-title">ESCOUADE TEAM MEMBERS</p>
      <div className="agent-orbs">
        {Object.values(AGENTS).map((agent, index) => (
          <button
            className={`agent-card ${agent.id === activeAgent.id ? "is-active" : ""}`}
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
            style={{ "--orb-delay": `${index * 90}ms` }}
          >
            <span className="agent-orb">
              <span className="orb-ring" />
              <span className="orb-face">
                {agent.id === "molly" ? <Brain size={44} /> : <Mic size={44} />}
              </span>
            </span>
            <strong>{agent.name}</strong>
            <small>{agent.role}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
