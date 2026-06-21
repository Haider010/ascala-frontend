import React from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, SendHorizontal, Sparkles } from "lucide-react";
import { LogoMark } from "../../components/shared/LogoMark";
import { AGENT_WORKFLOW } from "../../config/agents";

const AGENT_COPY = {
  molly: {
    layer: "Audience Intelligence",
    headline: "Molly™",
    title: "Know exactly who you are speaking to.",
    body: "Use Molly when the offer, audience, or message still feels fuzzy.",
    input: "Messy notes, customer context, links, offers, positioning questions.",
    output: "ICA, positioning, pain points, hooks, audience language, content themes.",
  },
  brandy: {
    layer: "Brand Voice",
    headline: "Brandy™",
    title: "Make every post sound like the brand.",
    body: "Use Brandy before producing content so the system knows the voice, tone, and language boundaries.",
    input: "Websites, social profiles, voice notes, example posts, sales copy.",
    output: "Brand voice guide, tone rules, language system, voice engine.",
  },
  brandboard: {
    layer: "Brand Guidelines",
    headline: "BrandBoard 100X\u2122",
    title: "Turn strategy into brand guidelines.",
    body: "Use BrandBoard after Molly and Brandy to create a premium identity system downstream agents can reuse.",
    input: "Molly audience intelligence and Brandy brand voice strategy.",
    output: "Foundation, audience messaging, colors, typography, buttons, UI rules, imagery, voice, content rules.",
  },
  sacha: {
    layer: "Social Strategy",
    headline: "Sacha™",
    title: "Know what to post and why it matters.",
    body: "Use Sacha to turn audience and voice into a practical content operating plan.",
    input: "Business goals, offers, platforms, campaigns, ideas, constraints.",
    output: "Content pillars, campaigns, calendar direction, CTA map, production brief.",
  },
  escouade: {
    layer: "Production",
    headline: "Escouade™",
    title: "Create the actual social content batch.",
    body: "Use Escouade when the strategy is ready and you want structured drafts to review, revise, approve, and export.",
    input: "Format, platform, objective, quantity, style, CTA mode, special instructions.",
    output: "Drafts, revisions, approved content records, Escouade CSV.",
  },
  uply: {
    layer: "Publishing Prep",
    headline: "Uply™",
    title: "Prepare the B10X Social Planner upload file.",
    body: "Use Uply when approved content and media are ready for the B10X Social Planner import workflow.",
    input: "Planner CSV or XLSX and a media ZIP in matching row order.",
    output: "B10X Social Planner CSV with media links.",
  },
};

const BENEFITS = [
  {
    title: "Post consistently without guessing",
    body: "Move from scattered ideas to clear themes, series, and production-ready content batches.",
  },
  {
    title: "Keep content aligned with the brand",
    body: "Every later step uses the saved audience, voice, and strategy context instead of starting over.",
  },
  {
    title: "Spend less time preparing uploads",
    body: "Approved content can move toward B10X Social Planner CSV workflows instead of manual copy, paste, and file matching.",
  },
];

const FLOW_COPY = {
  molly: {
    title: "Audience",
    description: "Clarify who the content is for, what they care about, what they struggle with, and which messages will actually make them pay attention.",
  },
  brandy: {
    title: "Voice",
    description: "Lock the tone, language, personality, and brand rules before any content gets written, so every later output sounds consistent.",
  },
  brandboard: {
    title: "BrandBoard",
    description: "Convert audience intelligence and voice direction into reusable brand guidelines: colors, typography, UI rules, imagery, and messaging standards.",
  },
  sacha: {
    title: "Strategy",
    description: "Plan what to post and why: themes, campaigns, platform priorities, CTAs, cadence, and the production direction for the content team.",
  },
  escouade: {
    title: "Production",
    description: "Generate structured social content batches that can be reviewed, revised, approved, protected, and exported without losing the strategy.",
  },
  uply: {
    title: "Publishing",
    description: "Prepare approved content and matching media for B10X Social Planner upload by turning the final assets into a cleaner import-ready publishing file.",
  },
};

function getStepState(step) {
  if (step.completed || step.status === "completed") return "completed";
  if (step.locked || !step.available) return "locked";
  if (step.status === "current") return "current";
  return "available";
}

function FlowPill({ step, index }) {
  const copy = FLOW_COPY[step.id] || {};
  return (
    <div className="landing-flow-pill">
      <span className="landing-flow-number">{String(index + 1).padStart(2, "0")}</span>
      <strong>{copy.title || step.name}</strong>
      <small>{step.name}</small>
      <p>{copy.description}</p>
      {index < AGENT_WORKFLOW.length - 1 && <span className="landing-flow-connector" aria-hidden="true" />}
    </div>
  );
}

function AgentSection({ step, index }) {
  const copy = AGENT_COPY[step.id] || {};
  return (
    <article className="landing-agent-section">
      <div className="landing-agent-index">
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="landing-agent-copy">
        <span className="landing-agent-layer">{copy.layer || step.role}</span>
        <h3>{copy.headline || step.name}</h3>
        <p>{copy.body}</p>
        <div className="landing-agent-meta">
          <div>
            <strong>Give it</strong>
            <span>{copy.input}</span>
          </div>
          <div>
            <strong>Get back</strong>
            <span>{copy.output}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function useVisibleCardCount() {
  const [count, setCount] = React.useState(3);

  React.useEffect(() => {
    function updateCount() {
      if (window.innerWidth < 720) {
        setCount(1);
      } else if (window.innerWidth < 1180) {
        setCount(2);
      } else {
        setCount(3);
      }
    }

    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  return count;
}

function HorizontalCardRow({ label, children }) {
  const items = React.Children.toArray(children);
  const visibleCount = useVisibleCardCount();
  const [startIndex, setStartIndex] = React.useState(0);

  React.useEffect(() => {
    setStartIndex((current) => current % Math.max(1, items.length));
  }, [items.length, visibleCount]);

  const visibleItems = Array.from({ length: Math.min(visibleCount, items.length) }, (_, offset) => {
    const index = (startIndex + offset) % items.length;
    return items[index];
  });

  function move(direction) {
    if (!items.length) return;
    setStartIndex((current) => (current + direction + items.length) % items.length);
  }

  return (
    <div className="landing-horizontal-shell">
      <div className="landing-horizontal-frame" style={{ "--carousel-index": startIndex }}>
        <button
          type="button"
          className="landing-carousel-edge is-left"
          aria-label={`Show previous ${label} cards`}
          onClick={() => move(-1)}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="landing-horizontal-row" style={{ "--visible-card-count": visibleItems.length }}>
          {visibleItems.map((item, index) => (
            <div className="landing-carousel-item" key={`${label}-${startIndex}-${index}`}>
              {item}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="landing-carousel-edge is-right"
          aria-label={`Show next ${label} cards`}
          onClick={() => move(1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export function LandingPage({ workflowStatus, isSessionReady, onEnterWorkspace }) {
  const steps = workflowStatus?.steps?.length ? workflowStatus.steps : AGENT_WORKFLOW;
  const currentStep = steps.find((step) => getStepState(step) === "current") || steps.find((step) => getStepState(step) === "available");
  const completedCount = steps.filter((step) => getStepState(step) === "completed").length;

  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <LogoMark />
        <div className="landing-nav-copy">
          <strong>Social 100X</strong>
          <span>Social Media Content Acceleration</span>
        </div>
        <button type="button" disabled={!isSessionReady} onClick={onEnterWorkspace}>
          Open workspace
        </button>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker">
            <Sparkles size={16} />
            Strategy to publishing prep
          </span>
          <h1>From strategy to approved social content.</h1>
          <p>
            Create consistent, brand-safe social content faster, then prepare it for B10X Social Planner without stitching
            everything together manually.
          </p>
          <div className="landing-actions">
            <button
              className="landing-primary"
              type="button"
              disabled={!isSessionReady}
              onClick={onEnterWorkspace}
            >
              <SendHorizontal size={18} />
              {currentStep ? `Start with ${currentStep.name}` : "Open workspace"}
            </button>
            <span>{isSessionReady ? `${completedCount}/${steps.length} layers complete` : "Preparing session..."}</span>
          </div>
        </div>

        <aside className="landing-hero-panel">
          <div className="landing-current-heading">
            <span>Current layer</span>
            <strong>{currentStep?.name || "Workflow complete"}</strong>
            <p>
              {currentStep
                ? AGENT_COPY[currentStep.id]?.body
                : "Every layer has been completed. You can review outputs or continue into the app workspace."}
            </p>
          </div>
          <div className="landing-current-details">
            <div>
              <span>Progress</span>
              <strong>{completedCount}/{steps.length}</strong>
              <small>layers complete</small>
            </div>
            <div>
              <span>Next action</span>
              <strong>{currentStep ? "Continue" : "Review"}</strong>
              <small>{currentStep ? AGENT_COPY[currentStep.id]?.output : "Open workspace"}</small>
            </div>
          </div>
        </aside>
      </section>

      <section className="landing-section landing-benefits-section">
        <div className="landing-section-heading">
          <span>Why Ascala</span>
          <h2>Less blank-page pressure. More content ready to publish.</h2>
          <p>
            Ascala is built for users who need a repeatable social media workflow, not another generic AI chat.
            The app helps them clarify the strategy, produce useful content, approve what matters, and prepare
            publishing files with less manual cleanup.
          </p>
        </div>
        <div className="landing-benefits-grid">
          {BENEFITS.map((benefit) => (
            <article className="landing-benefit-card" key={benefit.title}>
              <CheckCircle2 size={18} />
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-heading">
          <span>Workflow</span>
          <h2>How Ascala gets from idea to upload-ready content.</h2>
          <p>
            Each stage creates context for the next one. The workflow starts broad, then becomes more specific
            until the user has approved content and a cleaner path to publishing.
          </p>
        </div>
        <HorizontalCardRow label="workflow">
          {steps.map((step, index) => (
            <FlowPill key={step.id} step={step} index={index} />
          ))}
        </HorizontalCardRow>
      </section>

      <section className="landing-section landing-detail-section">
        <div className="landing-section-heading">
          <span>Agents</span>
          <h2>How to use each agent properly.</h2>
          <p>
            Work through the agents in order. Start messy, approve the useful foundation, then let each next
            layer use the context already saved for the account.
          </p>
        </div>
        <HorizontalCardRow label="agents">
          {steps.map((step, index) => (
            <AgentSection key={step.id} step={step} index={index} />
          ))}
        </HorizontalCardRow>
      </section>

    </main>
  );
}
