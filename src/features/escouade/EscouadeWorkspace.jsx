import React from "react";
import { Check, Download, Loader2, RotateCcw, Send, WandSparkles } from "lucide-react";
import {
  approveEscouadeItems,
  commandEscouadeBatch,
  exportEscouadeCsv,
  generateEscouadeBatch,
  reopenEscouadeItems,
  reviseEscouadeItems,
} from "../../services/escouade";

const MEMBER_TYPES = [
  ["image_post", "Image Posts"],
  ["carrousel", "Carrousel"],
  ["reel", "Reel"],
  ["stories", "Stories"],
  ["text_post", "Text Posts"],
];

const OPTIONS = {
  sourceType: ["Sacha Series", "Sacha Theme", "Sacha Weekly Plan", "Sacha Content Idea", "Custom Topic", "Selected Reference"],
  quantity: [5, 10, 15, 20, 30],
  platform: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube Shorts", "Multi-platform"],
  objective: ["Visibility", "Engagement", "Follower growth", "Lead Generation", "Sales", "Authority building", "Community growth", "Appointment bookings", "Webinar registrations"],
  language: ["English", "French Québec", "Bilingual", "Use brand default"],
  contentStyle: ["Educational", "Premium", "Friendly", "Bold", "Playful", "Thought leadership", "Soft-sell", "Direct response", "Practical/how-to", "Myth-busting", "Behind-the-scenes", "Story-driven", "Conversion-focused"],
  ctaPreference: ["No CTA", "Soft CTA", "Engagement CTA", "Lead generation CTA", "Sales CTA", "Custom CTA"],
  interactionStyle: ["Fast & Efficient", "Creative Partner", "Strategic Coach", "Social Media Manager Mode", "Friendly Best Buddy", "Premium Brand Editor", "Direct Response Copywriter"],
  referenceMode: ["Use app knowledge", "Use Molly™, Brandy™, Sacha™ only", "Use selected files/references", "Use selected company info", "Use custom notes", "No additional reference"],
};

const FORMAT_OPTIONS = {
  carrousel: {
    slide_structure: ["5 slides", "7 slides", "10 slides"],
    carousel_type: ["Educational", "Step-by-step", "Myth-busting", "List-style", "FAQ", "Offer explanation", "Authority post", "Objection handling", "Client transformation"],
    cta_slide: ["Use only if appropriate", "Yes", "No"],
  },
  reel: {
    field_count: ["3 fields", "5 fields", "7 fields", "10 fields"],
    target_length: ["15 sec", "30 sec", "45 sec"],
    voiceover: ["Optional", "Yes", "No"],
    reel_type: ["Talking-head", "Text overlay", "B-roll", "Educational", "Myth-busting", "Storytelling", "Trend-inspired", "Objection handling", "Quick tip"],
  },
  image_post: {
    image_post_type: ["Quote", "Bold statement", "Insight", "Question", "Tip", "Reminder", "Educational", "Founder thought", "Myth", "Mini CTA"],
    overlay_length: ["Short", "Medium"],
    supporting_caption: ["Short", "Medium", "Long"],
  },
  stories: {
    story_sequence_length: ["3 slides", "5 slides"],
    story_type: ["Poll", "Question", "Quiz", "Soft-sell", "Reminder", "Behind-the-scenes", "Mini training", "FAQ", "Objection", "Engagement check-in"],
    link_cta_instruction: ["No link", "Link sticker", "DM prompt", "Comment prompt", "Custom"],
  },
  text_post: {
    text_post_type: ["Authority", "Founder perspective", "Educational", "Case study", "Storytelling", "Opinion", "Lesson learned", "FAQ answer", "Objection handling", "Thought leadership", "Soft-sell"],
    length: ["Short", "Medium", "Long"],
    supporting_visual: ["No", "Optional image suggestion", "Create image post field too"],
  },
};

function defaultFormatFilters(memberType) {
  return Object.fromEntries(Object.entries(FORMAT_OPTIONS[memberType] || {}).map(([key, values]) => [key, values[0]]));
}

function itemTitle(item) {
  const content = item.content || {};
  return content.overlay_text || content.cover_headline || content.hook || content.sequence_name || item.post_id;
}

function itemBody(item) {
  const content = item.content || {};
  if (content.slides?.length) {
    return `${content.slides.length} slides · ${content.strategic_note || content.objective || ""}`.trim();
  }
  return content.caption || content.script || content.body || content.final_cta || "";
}

function SelectControl({ label, value, options, onChange }) {
  return (
    <div className="escouade-control">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function DashboardCounter({ label, value }) {
  return (
    <div className="escouade-counter">
      <strong>{value || 0}</strong>
      <span>{label}</span>
    </div>
  );
}

export function EscouadeWorkspace({ appSessionToken, onWorkflowStatus }) {
  const [memberType, setMemberType] = React.useState("image_post");
  const [batchName, setBatchName] = React.useState("Visibility Batch");
  const [sourceType, setSourceType] = React.useState("Sacha Theme");
  const [sourceLabel, setSourceLabel] = React.useState("Manual chaos into clean systems");
  const [quantity, setQuantity] = React.useState(5);
  const [platform, setPlatform] = React.useState("Instagram");
  const [objective, setObjective] = React.useState("Lead Generation");
  const [contentStyle, setContentStyle] = React.useState("Premium");
  const [ctaPreference, setCtaPreference] = React.useState("Soft CTA");
  const [language, setLanguage] = React.useState("English");
  const [interactionStyle, setInteractionStyle] = React.useState("Social Media Manager Mode");
  const [referenceMode, setReferenceMode] = React.useState("Use Molly™, Brandy™, Sacha™ only");
  const [formatFilters, setFormatFilters] = React.useState(defaultFormatFilters("image_post"));
  const [message, setMessage] = React.useState("Create a polished batch using the approved strategy.");
  const [command, setCommand] = React.useState("");
  const [batch, setBatch] = React.useState(null);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [pendingAction, setPendingAction] = React.useState("");

  const dashboard = batch?.dashboard || {};
  const counts = dashboard.counts || {};
  const selectedCount = selectedIds.length;
  const approvedCount = counts.approved || 0;
  const activeItems = batch?.items?.filter((item) => item.status !== "exported") || [];
  const approvedItems = batch?.items?.filter((item) => item.status === "approved") || [];

  function changeMember(nextMemberType) {
    setMemberType(nextMemberType);
    setFormatFilters(defaultFormatFilters(nextMemberType));
    setSelectedIds([]);
  }

  function filters() {
    return {
      source_type: sourceType,
      source_label: sourceLabel,
      platforms: [platform],
      primary_platform: platform,
      objective,
      content_style: [contentStyle],
      quantity: Number(quantity) || 1,
      cta_preference: ctaPreference,
      language,
      interaction_style: interactionStyle,
      reference_mode: [referenceMode],
      special_instructions: message,
      format_filters: formatFilters,
    };
  }

  function updateBatch(response) {
    if (response.workflowStatus) onWorkflowStatus(response.workflowStatus, false);
    setBatch(response.batch);
    setSelectedIds([]);
    setStatus(response.message || "");
  }

  function applyExportWorkflowStatus(response) {
    if (response?.workflowStatus) onWorkflowStatus(response.workflowStatus, true);
  }

  async function runAction(actionName, task) {
    setPendingAction(actionName);
    setError("");
    setStatus("");
    try {
      await task();
    } catch (actionError) {
      setError(actionError.message || "Escouade request failed.");
    } finally {
      setPendingAction("");
    }
  }

  function toggleItem(itemId) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  function setFormatValue(key, value) {
    setFormatFilters((current) => ({ ...current, [key]: value }));
  }

  function markApprovedItemsExported() {
    setBatch((current) => {
      if (!current) return current;
      const updatedItems = current.items.map((item) => item.status === "approved" ? { ...item, status: "exported" } : item);
      const updatedCounts = updatedItems.reduce((accumulator, item) => {
        accumulator[item.status] = (accumulator[item.status] || 0) + 1;
        return accumulator;
      }, { draft: 0, needs_revision: 0, approved: 0, exported: 0 });

      return {
        ...current,
        status: "exported",
        items: updatedItems,
        dashboard: current.dashboard ? { ...current.dashboard, counts: updatedCounts } : current.dashboard,
      };
    });
  }

  async function handleInstruction() {
    const trimmedCommand = command.trim();
    if (!trimmedCommand || !batch || pendingAction) return;

    const lower = trimmedCommand.toLowerCase();
    const mentionsSpecificPost = /\b[a-z]+-\d{3,}\b/i.test(trimmedCommand);
    const wantsExport = lower.includes("export") || lower.includes("download");
    const wantsApprove = lower.includes("approve");
    const wantsReopen = lower.includes("reopen");
    const shouldUseSelectedItems = selectedCount > 0 && !mentionsSpecificPost;

    await runAction("instruction", async () => {
      if (wantsExport) {
        const response = await exportEscouadeCsv({ appSessionToken, batchId: batch.id });
        markApprovedItemsExported();
        applyExportWorkflowStatus(response);
        setCommand("");
        setStatus("Approved items exported as CSV.");
        return;
      }

      if (shouldUseSelectedItems && wantsApprove) {
        updateBatch(await approveEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds }));
        setCommand("");
        return;
      }

      if (shouldUseSelectedItems && wantsReopen) {
        updateBatch(await reopenEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds }));
        setCommand("");
        return;
      }

      if (shouldUseSelectedItems) {
        updateBatch(await reviseEscouadeItems({
          appSessionToken,
          batchId: batch.id,
          itemIds: selectedIds,
          instruction: trimmedCommand,
        }));
        setCommand("");
        return;
      }

      updateBatch(await commandEscouadeBatch({ appSessionToken, batchId: batch.id, message: trimmedCommand }));
      setCommand("");
    });
  }

  return (
    <section className="escouade-console">
      <div className="escouade-setup">
        <div className="escouade-member-buttons" role="tablist" aria-label="Escouade member type">
          {MEMBER_TYPES.map(([value, label]) => (
            <button
              className={value === memberType ? "is-active" : ""}
              key={value}
              type="button"
              onClick={() => changeMember(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="escouade-control">
          <label>Batch name</label>
          <input value={batchName} onChange={(event) => setBatchName(event.target.value)} />
        </div>

        <SelectControl label="Source" value={sourceType} options={OPTIONS.sourceType} onChange={setSourceType} />

        <div className="escouade-control">
          <label>Source label</label>
          <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} />
        </div>

        <SelectControl label="Quantity" value={String(quantity)} options={OPTIONS.quantity.map(String)} onChange={setQuantity} />
        <SelectControl label="Platform" value={platform} options={OPTIONS.platform} onChange={setPlatform} />
        <SelectControl label="Objective" value={objective} options={OPTIONS.objective} onChange={setObjective} />
        <SelectControl label="Language" value={language} options={OPTIONS.language} onChange={setLanguage} />
        <SelectControl label="Content style" value={contentStyle} options={OPTIONS.contentStyle} onChange={setContentStyle} />
        <SelectControl label="CTA preference" value={ctaPreference} options={OPTIONS.ctaPreference} onChange={setCtaPreference} />
        <SelectControl label="Interaction style" value={interactionStyle} options={OPTIONS.interactionStyle} onChange={setInteractionStyle} />
        <SelectControl label="Reference mode" value={referenceMode} options={OPTIONS.referenceMode} onChange={setReferenceMode} />

        <div className="escouade-format-group">
          <span>Format controls</span>
          {Object.entries(FORMAT_OPTIONS[memberType] || {}).map(([key, values]) => (
            <SelectControl
              key={key}
              label={key.replaceAll("_", " ")}
              value={formatFilters[key] || values[0]}
              options={values}
              onChange={(value) => setFormatValue(key, value)}
            />
          ))}
        </div>

        <div className="escouade-control full">
          <label>Special instructions</label>
          <textarea value={message} rows={4} onChange={(event) => setMessage(event.target.value)} />
        </div>

        <button
          className="escouade-primary"
          type="button"
          disabled={Boolean(pendingAction)}
          onClick={() =>
            runAction("generate", async () => {
              const response = await generateEscouadeBatch({
                appSessionToken,
                memberType,
                batchName,
                sourceType,
                sourceLabel,
                filters: filters(),
                message,
              });
              updateBatch(response);
            })
          }
        >
          {pendingAction === "generate" ? <Loader2 className="spin" size={18} /> : <WandSparkles size={18} />}
          <span>Generate Batch</span>
        </button>
      </div>

      <div className="escouade-output-panel">
        {(status || error) && (
          <div className={`escouade-status ${error ? "is-error" : ""}`}>
            {error || status}
          </div>
        )}

        {batch ? (
          <div className="escouade-batch">
            <div className="escouade-batch-toolbar">
              <div>
                <strong>{batch.batch_name || batch.member_type.replace("_", " ")}</strong>
                <span>{batch.source_label || batch.source_type} · {batch.member_type.replace("_", " ")}</span>
              </div>
              <div className="escouade-actions">
                <button type="button" disabled={!selectedCount || Boolean(pendingAction)} onClick={() => runAction("approve", async () => updateBatch(await approveEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds })))}>
                  <Check size={16} />
                  Approve
                </button>
                <button type="button" disabled={!selectedCount || Boolean(pendingAction)} onClick={() => runAction("reopen", async () => updateBatch(await reopenEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds })))}>
                  <RotateCcw size={16} />
                  Reopen
                </button>
                <button type="button" disabled={!approvedCount || Boolean(pendingAction)} onClick={() => runAction("export", async () => {
                  const response = await exportEscouadeCsv({ appSessionToken, batchId: batch.id });
                  markApprovedItemsExported();
                  applyExportWorkflowStatus(response);
                  setStatus("Approved items exported as CSV.");
                })}>
                  {pendingAction === "export" ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
                  {pendingAction === "export" ? "Exporting..." : "Export CSV"}
                </button>
              </div>
            </div>

            <div className="escouade-dashboard-strip">
              <DashboardCounter label="Draft" value={counts.draft} />
              <DashboardCounter label="Needs Revision" value={counts.needs_revision} />
              <DashboardCounter label="Approved" value={counts.approved} />
              <DashboardCounter label="Exported" value={counts.exported} />
            </div>

            <div className="escouade-command-row">
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder={selectedCount ? "Instruction for selected items, or command: approve selected, reopen selected, export approved..." : "Write an instruction or command: make drafts stronger, approve IMG-001, export approved..."}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleInstruction();
                  }
                }}
              />
              <button type="button" disabled={!command.trim() || Boolean(pendingAction)} onClick={handleInstruction}>
                {pendingAction === "instruction" ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                {pendingAction === "instruction" ? "Working..." : "Run"}
              </button>
            </div>

            <div className="escouade-items">
              <div className="escouade-section-label">Active items</div>
              {activeItems.map((item) => (
                <article className={`escouade-item is-${item.status}`} key={item.id}>
                  <label className="escouade-item-check">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleItem(item.id)} />
                    <span>{item.post_id}</span>
                  </label>
                  <div className="escouade-item-body">
                    <div className="escouade-item-head">
                      <strong>{itemTitle(item)}</strong>
                      <small>{item.status}</small>
                    </div>
                    {itemBody(item) && <p>{itemBody(item)}</p>}
                  </div>
                </article>
              ))}

              {!!approvedItems.length && (
                <>
                  <div className="escouade-section-label">Approved elements</div>
                  {approvedItems.map((item) => (
                    <article className="escouade-item is-approved is-compact" key={`approved-${item.id}`}>
                      <span className="escouade-approved-id">{item.post_id}</span>
                      <div className="escouade-item-body">
                        <div className="escouade-item-head">
                          <strong>{itemTitle(item)}</strong>
                          <small>approved</small>
                        </div>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="escouade-empty-state">
            <strong>No batch generated yet</strong>
            <span>Choose a member, set the production filters, and generate a draft batch.</span>
          </div>
        )}
      </div>
    </section>
  );
}
