import React from "react";
import { FileStack, Maximize2, Minimize2, RefreshCw, Sparkles } from "lucide-react";
import { fetchBrandBoard, generateBrandBoard } from "../../services/brandboard";

function listItems(items, className = "") {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="brandboard-section">
      <div className="brandboard-section-head">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function RuleGrid({ doItems = [], neverItems = [] }) {
  if (!doItems.length && !neverItems.length) return null;
  return (
    <div className="brandboard-rule-grid">
      {doItems.slice(0, 3).map((item, index) => (
        <div className="brandboard-rule is-do" key={`do-${index}`}>
          <span>Always</span>
          <p>{item}</p>
        </div>
      ))}
      {neverItems.slice(0, 3).map((item, index) => (
        <div className="brandboard-rule is-never" key={`never-${index}`}>
          <span>Never</span>
          <p>{item}</p>
        </div>
      ))}
    </div>
  );
}

function Swatch({ token }) {
  if (!token) return null;
  return (
    <div className="brandboard-swatch">
      <div className="brandboard-swatch-color" style={{ background: token.hex || "#7c3aed" }} />
      <div className="brandboard-swatch-info">
        <strong>{token.name}</strong>
        <span>{token.hex}</span>
        <p>{token.role}</p>
      </div>
    </div>
  );
}

function ButtonPreview({ style }) {
  const buttonStyle = {
    background: style.background || "transparent",
    color: style.text_color || "#ffffff",
    border: style.border || "1px solid rgba(255,255,255,0.2)",
    borderRadius: style.radius || "10px",
  };

  return (
    <div className="brandboard-button-card">
      <div>
        <span>{style.role}</span>
        <strong>{style.name}</strong>
      </div>
      <div className="brandboard-button-row">
        {(style.label_examples || ["Get started"]).slice(0, 3).map((label, index) => (
          <button type="button" style={buttonStyle} key={`${label}-${index}`}>{label}</button>
        ))}
      </div>
      <p>{style.usage_note}</p>
    </div>
  );
}

function BrandBoardDocument({ output }) {
  const cover = output?.cover || {};
  const foundation = output?.brand_foundation || {};
  const audience = output?.audience_messaging || {};
  const colors = output?.color_system || {};
  const typography = output?.typography_system || {};
  const buttons = output?.button_system || {};
  const spacing = output?.spacing_radius_system || {};
  const components = output?.ui_component_system || {};
  const imagery = output?.imagery_system || {};
  const voice = output?.voice_tone_system || {};
  const content = output?.content_application_system || {};
  const theme = output?.theme_selection || {};

  return (
    <article className={`brandboard-document theme-${theme.theme || "premium_dark"}`}>
      <header className="brandboard-cover">
        <div className="brandboard-cover-top">
          <span className="brandboard-kicker">{cover.eyebrow || "Brand Guidelines"}</span>
          <span>{cover.version_label || "BrandBoard 100X"}</span>
        </div>
        <div className="brandboard-cover-body">
          <h2>{cover.document_title || "Brand Guidelines"}</h2>
          <p>{cover.subtitle || "A practical reference for how the brand looks, feels, and communicates."}</p>
        </div>
        <div className="brandboard-cover-grid">
          <div>
            <span>Mission</span>
            <strong>{foundation.mission}</strong>
          </div>
          <div>
            <span>Positioning</span>
            <strong>{foundation.positioning}</strong>
          </div>
          <div>
            <span>Promise</span>
            <strong>{foundation.brand_promise}</strong>
          </div>
        </div>
      </header>

      <Section eyebrow="01" title="Brand Foundation">
        <div className="brandboard-guideline-grid">
          <div className="brandboard-large-card">
            <span>Transformation</span>
            <p>{foundation.transformation}</p>
          </div>
          <div>
            <span>Personality</span>
            {listItems(foundation.personality, "brandboard-pill-list")}
          </div>
          <div>
            <span>Strategic principles</span>
            {listItems(foundation.strategic_principles)}
          </div>
        </div>
      </Section>

      <Section eyebrow="02" title="Audience & Messaging">
        <p className="brandboard-lede">{audience.primary_audience}</p>
        <div className="brandboard-columns">
          <div>
            <strong>Audience wants</strong>
            {listItems(audience.audience_desires)}
          </div>
          <div>
            <strong>Pain language</strong>
            {listItems(audience.audience_pains)}
          </div>
          <div>
            <strong>Buying triggers</strong>
            {listItems(audience.buying_triggers)}
          </div>
        </div>
        <div className="brandboard-quotes">
          {(audience.hero_message_examples || []).slice(0, 4).map((message, index) => (
            <blockquote key={`${message}-${index}`}>{message}</blockquote>
          ))}
        </div>
      </Section>

      <Section eyebrow="03" title="Color System">
        <div className="brandboard-swatch-grid">
          {(colors.palette || []).map((token, index) => <Swatch token={token} key={`${token.name}-${index}`} />)}
        </div>
        <div className="brandboard-text-color-grid">
          {["primary", "body", "muted"].map((key) => {
            const token = colors.text_colors?.[key];
            if (!token) return null;
            return (
              <div key={key}>
                <span>{key}</span>
                <strong style={{ color: token.hex }}>{token.hex}</strong>
                <p>{token.usage_note}</p>
              </div>
            );
          })}
        </div>
        {(colors.gradients || []).length > 0 && (
          <div className="brandboard-gradient-grid">
            {colors.gradients.map((gradient, index) => (
              <div className="brandboard-gradient-card" key={`${gradient.name}-${index}`}>
                <div style={{ background: gradient.css_value }} />
                <strong>{gradient.name}</strong>
                <p>{gradient.role}</p>
              </div>
            ))}
          </div>
        )}
        <RuleGrid doItems={colors.rules_do} neverItems={colors.rules_never} />
      </Section>

      <Section eyebrow="04" title="Typography">
        <div className="brandboard-typeface-grid">
          <div>
            <span>Primary typeface</span>
            <strong>{typography.primary_typeface?.name}</strong>
            <p>{typography.primary_typeface?.rationale}</p>
            <small>{typography.primary_typeface?.weights}</small>
          </div>
          <div>
            <span>Accent typeface</span>
            <strong>{typography.accent_typeface?.name}</strong>
            <p>{typography.accent_typeface?.rationale}</p>
            <small>{typography.accent_typeface?.weights}</small>
          </div>
        </div>
        <div className="brandboard-type-scale">
          {(typography.type_scale || []).map((item, index) => (
            <div className="brandboard-type-row" key={`${item.label}-${index}`}>
              <div>
                <span>{item.label}</span>
                <small>{item.font_size} · {item.weight} · LH {item.line_height}</small>
              </div>
              <strong>{item.example}</strong>
              <p>{item.usage}</p>
            </div>
          ))}
        </div>
        <RuleGrid doItems={typography.rules_do} neverItems={typography.rules_never} />
      </Section>

      <Section eyebrow="05" title="Buttons & CTAs">
        <div className="brandboard-button-grid">
          {(buttons.styles || []).map((style, index) => <ButtonPreview style={style} key={`${style.name}-${index}`} />)}
        </div>
        <div className="brandboard-callout">
          <span>CTA language</span>
          {listItems(buttons.cta_language, "brandboard-pill-list")}
        </div>
        <RuleGrid doItems={buttons.rules_do} neverItems={buttons.rules_never} />
      </Section>

      <Section eyebrow="06" title="Spacing & Radius">
        <div className="brandboard-token-grid">
          <div>
            <span>Spacing scale</span>
            {(spacing.spacing_scale || []).map((token, index) => (
              <div className="brandboard-token-row" key={`${token.token}-${index}`}>
                <strong>{token.token}</strong>
                <small>{token.value}</small>
                <div><i style={{ width: `${Math.min(180, 10 + index * 22)}px` }} /></div>
                <p>{token.usage}</p>
              </div>
            ))}
          </div>
          <div>
            <span>Radius scale</span>
            <div className="brandboard-radius-grid">
              {(spacing.radius_scale || []).map((token, index) => (
                <div className="brandboard-radius-card" key={`${token.token}-${index}`}>
                  <i style={{ borderRadius: token.value }} />
                  <strong>{token.token}</strong>
                  <small>{token.value}</small>
                  <p>{token.usage}</p>
                </div>
              ))}
            </div>
            {listItems(spacing.layout_rules)}
          </div>
        </div>
      </Section>

      <Section eyebrow="07" title="UI Components">
        <div className="brandboard-component-grid">
          {(components.patterns || []).map((pattern, index) => (
            <div className="brandboard-component-card" key={`${pattern.name}-${index}`}>
              <span>{pattern.purpose}</span>
              <strong>{pattern.name}</strong>
              <p>{pattern.structure}</p>
              {listItems(pattern.style_notes)}
            </div>
          ))}
        </div>
        <div className="brandboard-columns">
          <div>
            <strong>Surface rules</strong>
            {listItems(components.surface_rules)}
          </div>
          <div>
            <strong>Interaction rules</strong>
            {listItems(components.interaction_rules)}
          </div>
        </div>
      </Section>

      <Section eyebrow="08" title="Imagery Direction">
        <div className="brandboard-imagery-grid">
          <div>
            <span>Photography</span>
            <p>{imagery.photography_direction}</p>
          </div>
          <div>
            <span>Environment</span>
            <p>{imagery.environment_direction}</p>
          </div>
          <div>
            <span>Composition</span>
            <p>{imagery.composition_direction}</p>
          </div>
        </div>
        <div className="brandboard-callout">
          <span>Visual metaphors</span>
          {listItems(imagery.visual_metaphors, "brandboard-pill-list")}
        </div>
        <RuleGrid doItems={imagery.image_do} neverItems={imagery.image_never} />
      </Section>

      <Section eyebrow="09" title="Voice & Tone">
        <div className="brandboard-voice-grid">
          {(voice.voice_traits || []).slice(0, 6).map((trait, index) => (
            <div className="brandboard-voice-card" key={`${trait}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{trait}</strong>
            </div>
          ))}
        </div>
        <p className="brandboard-lede">{voice.tone_description}</p>
        <div className="brandboard-say-grid">
          <div>
            <strong>Write this</strong>
            {listItems(voice.write_this)}
          </div>
          <div>
            <strong>Not this</strong>
            {listItems(voice.not_this)}
          </div>
        </div>
      </Section>

      <Section eyebrow="10" title="Content Application">
        <div className="brandboard-columns">
          <div>
            <strong>Social posts</strong>
            {listItems(content.social_post_rules)}
          </div>
          <div>
            <strong>Landing pages</strong>
            {listItems(content.landing_page_rules)}
          </div>
          <div>
            <strong>Email</strong>
            {listItems(content.email_rules)}
          </div>
        </div>
        <div className="brandboard-callout">
          <span>Content pillars</span>
          {listItems(content.content_pillars, "brandboard-pill-list")}
        </div>
      </Section>
    </article>
  );
}

function isGuidelineOutput(output) {
  return Boolean(output?.cover && output?.color_system && output?.typography_system);
}

export function BrandBoardWorkspace({ appSessionToken, onWorkflowStatus }) {
  const [output, setOutput] = React.useState(null);
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationStatus, setGenerationStatus] = React.useState("");
  const [generationInstruction, setGenerationInstruction] = React.useState("");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!appSessionToken) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    fetchBrandBoard({ appSessionToken, signal: controller.signal })
      .then((payload) => {
        setOutput(payload.output || null);
        setUpdatedAt(payload.updatedAt || null);
        if (payload.workflowStatus) onWorkflowStatus(payload.workflowStatus, false, false);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(requestError.message || "Unable to load BrandBoard.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appSessionToken]);

  async function handleGenerate() {
    if (isGenerating) return;

    if (!appSessionToken) {
      setError("Backend account session is not ready yet.");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus(output ? "Regeneration request sent..." : "Generation request sent...");
    setError("");
    const startedAt = Date.now();

    try {
      console.info("[Ascala] BrandBoard generation started");
      const payload = await generateBrandBoard({
        appSessionToken,
        instruction: generationInstruction.trim(),
      });
      const minimumVisibleDelay = Math.max(0, 650 - (Date.now() - startedAt));
      if (minimumVisibleDelay) {
        await new Promise((resolve) => window.setTimeout(resolve, minimumVisibleDelay));
      }
      setOutput(payload.output || null);
      setUpdatedAt(payload.updatedAt || null);
      if (payload.workflowStatus) onWorkflowStatus(payload.workflowStatus, false, true);
      setGenerationStatus(payload.output ? "Brand guidelines regenerated." : "BrandBoard request completed.");
      console.info("[Ascala] BrandBoard generation completed", {
        hasOutput: Boolean(payload.output),
        updatedAt: payload.updatedAt,
      });
    } catch (requestError) {
      const message = requestError.message || "Unable to generate BrandBoard.";
      setGenerationStatus("");
      setError(message);
      console.error("[Ascala] BrandBoard generation failed", requestError);
    } finally {
      window.setTimeout(() => {
        setIsGenerating(false);
        setGenerationStatus("");
      }, 450);
    }
  }

  React.useEffect(() => {
    if (!isFullscreen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const actionDisabled = isGenerating;

  return (
    <section className={isFullscreen ? "brandboard-workspace is-fullscreen" : "brandboard-workspace"}>
      <header className="brandboard-toolbar">
        <div>
          <span>Strategic source of truth</span>
          <h2>BrandBoard 100X™</h2>
          <p>
            A premium brand guidelines system generated from Molly’s audience intelligence and Brandy’s brand voice.
          </p>
        </div>
        <div className="brandboard-toolbar-actions">
          {!isFullscreen && output && isGuidelineOutput(output) && (
            <>
              <label className="brandboard-instruction-field">
                <span>Instruction</span>
                <input
                  type="text"
                  value={generationInstruction}
                  disabled={actionDisabled}
                  maxLength={2000}
                  placeholder="Make it more luxury, warmer, cleaner, bolder..."
                  onChange={(event) => setGenerationInstruction(event.target.value)}
                />
              </label>
              <button
                type="button"
                className={isGenerating ? "is-loading" : ""}
                disabled={actionDisabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleGenerate();
                }}
              >
                {isGenerating ? <RefreshCw className="is-spinning" size={17} /> : <Sparkles size={17} />}
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </>
          )}
          {output && isFullscreen && (
            <button
              type="button"
              className="brandboard-fullscreen-close"
              aria-label="Close full screen"
              onClick={() => setIsFullscreen(false)}
            >
              <Minimize2 size={18} />
            </button>
          )}
        </div>
      </header>

      {!isFullscreen && error && <div className="brandboard-error" role="alert">{error}</div>}
      {!isFullscreen && isGenerating && (
        <div className="brandboard-generating" role="status" aria-live="polite">
          <RefreshCw className="is-spinning" size={16} />
          <span>{generationStatus || "Regenerating brand guidelines. This can take a moment while the system is rebuilt."}</span>
        </div>
      )}

      {isLoading ? (
        <div className="brandboard-empty" role="status">
          <span className="history-loader" aria-hidden="true"><span /><span /><span /></span>
        </div>
      ) : output && isGuidelineOutput(output) ? (
        <>
          {!isFullscreen && updatedAt && (
            <div className="brandboard-updated-row">
              <div className="brandboard-updated">Last generated {new Date(updatedAt).toLocaleString()}</div>
              <button
                type="button"
                className="brandboard-secondary-action brandboard-inline-fullscreen"
                aria-label="Open full screen"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 size={17} />
                Full screen
              </button>
            </div>
          )}
          <div className={isGenerating ? "brandboard-document-shell is-regenerating" : "brandboard-document-shell"}>
            <BrandBoardDocument output={output} />
          </div>
        </>
      ) : output ? (
        <div className="brandboard-empty">
          <FileStack size={34} />
          <strong>BrandBoard needs regeneration.</strong>
          <p>
            The saved BrandBoard uses the older strategy format. Regenerate it to create the new brand guidelines system.
          </p>
          <div className="brandboard-empty-actions">
            <label className="brandboard-instruction-field">
              <span>Regeneration instruction</span>
              <input
                type="text"
                value={generationInstruction}
                disabled={actionDisabled}
                maxLength={2000}
                placeholder="Optional: describe what should change..."
                onChange={(event) => setGenerationInstruction(event.target.value)}
              />
            </label>
            <button type="button" disabled={actionDisabled} onClick={handleGenerate}>
              {isGenerating ? "Regenerating..." : "Regenerate BrandBoard"}
            </button>
          </div>
        </div>
      ) : (
        <div className="brandboard-empty">
          <FileStack size={34} />
          <strong>BrandBoard is ready to generate.</strong>
          <p>
            Molly and Brandy are complete. Generate the brand guidelines system that Sacha and future agents can use.
          </p>
          <div className="brandboard-empty-actions">
            <label className="brandboard-instruction-field">
              <span>Generation instruction</span>
              <input
                type="text"
                value={generationInstruction}
                disabled={actionDisabled}
                maxLength={2000}
                placeholder="Optional: describe the preferred style..."
                onChange={(event) => setGenerationInstruction(event.target.value)}
              />
            </label>
            <button type="button" disabled={actionDisabled} onClick={handleGenerate}>
              {isGenerating ? "Generating..." : "Generate BrandBoard"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
