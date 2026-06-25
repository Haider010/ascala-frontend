import React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Download, History, Loader2, Maximize2, RotateCcw, Send, X } from "lucide-react";
import {
  approveEscouadeItems,
  commandEscouadeBatch,
  getEscouadeWorkspaceCache,
  getEscouadeBatch,
  getEscouadeChat,
  exportEscouadeCsv,
  generateEscouadeBatch,
  getLatestEscouadeBatch,
  getEscouadeProductionBrief,
  listEscouadeBatches,
  parseEscouadeSetupInstruction,
  reopenEscouadeItems,
  reviseEscouadeItems,
  saveEscouadeChatMessage,
  setEscouadeWorkspaceCache,
} from "../../services/escouade";
import { ESCOUADE_MEMBER_ORBS } from "../../config/agentOrbs";

const MEMBER_TYPES = [
  ["image_post", "Image Posts"],
  ["carrousel", "Carrousel"],
  ["reel", "Reel"],
  ["stories", "Stories"],
  ["text_post", "Text Posts"],
];

const OPTIONS = {
  sourceType: ["Sacha Series", "Sacha Theme", "Sacha Weekly Plan", "Sacha Content Idea", "Custom Topic", "Selected Reference"],
  outputTarget: ["Escouade Structured CSV", "Canva Bulk Create CSV", "Custom CSV"],
  quantity: [5, 10, 15, 20, 30],
  platform: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube Shorts", "Multi-platform"],
  objective: ["Visibility", "Engagement", "Follower growth", "Lead Generation", "Sales", "Authority building", "Community growth", "Appointment bookings", "Webinar registrations"],
  language: ["English", "French QuÃ©bec", "Bilingual", "Use brand default"],
  contentStyle: ["Educational", "Premium", "Friendly", "Bold", "Playful", "Thought leadership", "Soft-sell", "Direct response", "Practical/how-to", "Myth-busting", "Behind-the-scenes", "Story-driven", "Conversion-focused"],
  ctaPreference: ["No CTA", "Soft CTA", "Engagement CTA", "Lead generation CTA", "Sales CTA", "Custom CTA"],
  interactionStyle: ["Fast & Efficient", "Creative Partner", "Strategic Coach", "Social Media Manager Mode", "Friendly Best Buddy", "Premium Brand Editor", "Direct Response Copywriter"],
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

const SETUP_DECISION_KEYS = [
  "source_label",
  "member_type",
  "quantity",
  "primary_platform",
  "objective",
  "cta_preference",
  "output_target",
];

function defaultFormatFilters(memberType) {
  return Object.fromEntries(Object.entries(FORMAT_OPTIONS[memberType] || {}).map(([key, values]) => [key, values[0]]));
}

function defaultFormatFilterState() {
  return Object.fromEntries(MEMBER_TYPES.map(([memberType]) => [memberType, defaultFormatFilters(memberType)]));
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

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length));
}

function optionOrFallback(value, options, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  const match = options.find((option) => String(option).trim().toLowerCase() === normalized);
  return match || value;
}

function firstArrayValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function uniqueOptions(options, value) {
  if (value === undefined || value === null || value === "") return options;
  const stringValue = String(value);
  return options.map(String).includes(stringValue) ? options : [value, ...options];
}

function memberTypeLabel(value) {
  return MEMBER_TYPES.find(([memberType]) => memberType === value)?.[1] || String(value || "Format").replaceAll("_", " ");
}

function briefTitle(item, index = 0) {
  return item?.title || item?.brief?.batch_name || item?.brief?.source_label || `Production Brief ${index + 1}`;
}

function menuFromBriefPayload(payload) {
  const menu = Array.isArray(payload?.menu)
    ? payload.menu.filter(Boolean).map((item, index) => ({
        ...item,
        id: String(item.id || `brief_${String(index + 1).padStart(3, "0")}`),
      }))
    : [];
  if (menu.length) return menu;

  if (!payload?.brief) return [];

  return [
    {
      id: "brief_001",
      title: payload.brief.batch_name || payload.brief.source_label || "Sacha production brief",
      type: "Production Opportunity",
      primary_member_type: payload.brief.member_type,
      source_type: payload.brief.source_type,
      source_label: payload.brief.source_label,
      objective: payload.brief.filters?.objective,
      primary_platform: payload.brief.filters?.primary_platform,
      suggested_quantity: payload.brief.filters?.quantity,
      cta_direction: payload.brief.filters?.cta_preference,
      language: payload.brief.filters?.language,
      production_notes: payload.brief.message || payload.brief.filters?.special_instructions,
      brief: payload.brief,
    },
  ];
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findMentionedOption(text, options) {
  const normalizedText = normalizeText(text);
  return options.find((option) => {
    const normalizedOption = normalizeText(option);
    return normalizedOption && normalizedText.includes(normalizedOption);
  });
}

function findMentionedMemberType(text) {
  const normalizedText = normalizeText(text);
  const aliases = [
    ["carrousel", ["carrousel", "carousel", "carousels"]],
    ["reel", ["reel", "reels", "short video", "short videos"]],
    ["image_post", ["image post", "image posts", "static post", "static posts"]],
    ["stories", ["story", "stories"]],
    ["text_post", ["text post", "text posts", "linkedin post", "long form"]],
  ];
  return aliases.find(([, names]) => names.some((name) => normalizedText.includes(name)))?.[0] || null;
}

function findMentionedQuantity(text) {
  const match = normalizeText(text).match(/\b(5|10|15|20|30)\b/);
  return match ? Number(match[1]) : null;
}

function parseListText(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseKeyValueText(value) {
  return Object.fromEntries(
    String(value || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(/[:=]/);
        return [key.trim(), rest.join(":").trim()];
      })
      .filter(([key]) => Boolean(key)),
  );
}

function columnTypeFromLabel(label) {
  const normalized = normalizeText(label);
  if (/\b(image|media|video|visual|photo|file)\b/.test(normalized)) return "media_placeholder";
  if (/\b(cta|call to action)\b/.test(normalized)) return "cta";
  if (/\b(hashtag|hashtags)\b/.test(normalized)) return "hashtags";
  if (/\b(caption|body|script|description|notes|copy)\b/.test(normalized)) return "long_text";
  return "text";
}

function columnsFromText(value) {
  return parseListText(value).map((label) => ({
    key: normalizeText(label).replaceAll(" ", "_") || "column",
    label,
    type: columnTypeFromLabel(label),
  }));
}

function columnsToText(columns) {
  return Array.isArray(columns)
    ? columns.map((column) => column?.label || column?.key).filter(Boolean).join("\n")
    : "";
}

function fixedFieldsToText(fields) {
  if (!fields || typeof fields !== "object") return "";
  return Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join("\n");
}

function exportTargetLabel(value) {
  const normalized = normalizeText(value);
  if (normalized.includes("canva")) return "Canva Bulk Create CSV";
  if (normalized.includes("custom")) return "Custom CSV";
  if (normalized.includes("b10x") || normalized.includes("social planner")) return "B10X prep CSV";
  return "Escouade structured CSV";
}

function statusLabel(status) {
  const labels = {
    draft: "Draft",
    needs_revision: "Needs revision",
    revised: "Revised",
    approved: "Approved",
    exported: "Exported",
  };
  return labels[status] || status;
}

function formatBatchDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function historyItemLabel(item) {
  const title = item?.batch_name || item?.source_label || "Untitled batch";
  const member = memberTypeLabel(item?.member_type);
  const date = formatBatchDate(item?.updated_at || item?.created_at);
  return [title, member, date].filter(Boolean).join(" · ");
}

function historyItemMeta(item) {
  const counts = item?.dashboard?.counts || {};
  const total = item?.dashboard?.total_count || Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  const approved = counts.approved || 0;
  const exported = counts.exported || 0;
  const rows = item?.production_table?.rows_count || 0;
  return `${total} items · ${approved} approved · ${exported} exported · ${rows} rows`;
}

function productionTableRows(batch) {
  const table = batch?.production_table;
  if (!table?.columns?.length || !table?.rows?.length) return [];
  const statusByItemId = Object.fromEntries((batch.items || []).map((item) => [String(item.id), item.status]));
  return table.rows
    .filter((row) => statusByItemId[String(row.item_id)] !== "exported")
    .map((row) => ({
      ...row,
      status: statusByItemId[String(row.item_id)] || row.status,
    }));
}

function compactCellValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function createEscouadeChatMessage(role, content) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

const ESCOUADE_INTRO_MESSAGE =
  "Ready to create your batch? Type **Generate** and I’ll confirm the current setup before producing drafts. You can also send instructions first, like “use the Guardrails Library” or “make 10 image posts, no CTA.”";

function renderEscouadeChatContent(content) {
  return String(content || "").split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function normalizeEscouadeChatMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) return initialEscouadeChatMessages();
  const [firstMessage, ...rest] = messages;
  if (firstMessage?.role !== "assistant") return messages;

  const oldIntroMessages = [
    "Tell me what you want to produce. I can update the setup, use a Sacha series, **Generate** a batch, revise selected rows, approve items, or export approved content.",
    "Tell me what you want to produce. I can update the setup, use a Sacha series, generate a batch, revise selected rows, approve items, or export approved content.",
    "Use this chat to guide Escouade. You can type instructions such as “use the Guardrails Library, make 10 image posts, no CTA,” or type “generate” when you are ready to create the batch.",
  ];
  if (!oldIntroMessages.includes(firstMessage.content)) return messages;

  return [{ ...firstMessage, content: ESCOUADE_INTRO_MESSAGE }, ...rest];
}

function chatMessagesFromApi(messages) {
  const normalized = (messages || []).map((message) => ({
    id: String(message.id),
    role: message.role,
    content: message.content,
  }));
  return normalizeEscouadeChatMessages(normalized.length ? normalized : initialEscouadeChatMessages());
}

function initialEscouadeChatMessages() {
  return [
    createEscouadeChatMessage(
      "assistant",
      ESCOUADE_INTRO_MESSAGE,
    ),
  ];
}

export function EscouadeWorkspace({
  appSessionToken,
  onWorkflowStatus,
  isMainSidebarCollapsed = false,
  onMainSidebarCollapsedChange,
  onNewBatchReady,
}) {
  const hasAppliedBriefRef = React.useRef(false);
  const chatMessagesRef = React.useRef(null);
  const startNewBatchRef = React.useRef(null);
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
  const [outputTarget, setOutputTarget] = React.useState("Escouade Structured CSV");
  const [productionColumnsText, setProductionColumnsText] = React.useState("");
  const [fixedFieldsText, setFixedFieldsText] = React.useState("");
  const [variableFieldsText, setVariableFieldsText] = React.useState("");
  const [mediaPlaceholdersText, setMediaPlaceholdersText] = React.useState("");
  const [formatFiltersByMember, setFormatFiltersByMember] = React.useState(defaultFormatFilterState);
  const [message, setMessage] = React.useState("Create a polished batch using the approved strategy.");
  const [command, setCommand] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState(initialEscouadeChatMessages);
  const [batch, setBatch] = React.useState(null);
  const [batchHistory, setBatchHistory] = React.useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [pendingAction, setPendingAction] = React.useState("");
  const [productionBrief, setProductionBrief] = React.useState(null);
  const [productionBriefMenu, setProductionBriefMenu] = React.useState([]);
  const [selectedBriefId, setSelectedBriefId] = React.useState("");
  const [isBriefLoading, setIsBriefLoading] = React.useState(false);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = React.useState(false);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const [isSetupCollapsed, setIsSetupCollapsed] = React.useState(false);
  const [isAdvancedSetupOpen, setIsAdvancedSetupOpen] = React.useState(false);
  const [isStrategySetupOpen, setIsStrategySetupOpen] = React.useState(true);
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = React.useState(true);
  const [isTableModalOpen, setIsTableModalOpen] = React.useState(false);
  const [confirmedSetupKey, setConfirmedSetupKey] = React.useState("");
  const [queuedSetupConfirmationLead, setQueuedSetupConfirmationLead] = React.useState("");
  const [setupTouched, setSetupTouched] = React.useState({});

  const dashboard = batch?.dashboard || {};
  const counts = dashboard.counts || {};
  const selectedCount = selectedIds.length;
  const approvedCount = counts.approved || 0;
  const activeItems = batch?.items?.filter((item) => item.status !== "exported") || [];
  const tableColumns = batch?.production_table?.columns || [];
  const tableRows = productionTableRows(batch);
  const activeItemIds = tableRows.length
    ? tableRows.map((row) => row.item_id).filter((itemId) => itemId !== undefined && itemId !== null)
    : activeItems.map((item) => item.id);
  const selectableCount = activeItemIds.length;
  const isItemSelected = React.useCallback(
    (itemId) => selectedIds.some((id) => String(id) === String(itemId)),
    [selectedIds],
  );
  const allActiveSelected = selectableCount > 0 && activeItemIds.every((id) => isItemSelected(id));
  const formatFilters = formatFiltersByMember[memberType] || defaultFormatFilters(memberType);
  const selectedBriefItem =
    productionBriefMenu.find((item) => String(item.id) === String(selectedBriefId)) || productionBriefMenu[0] || null;
  const visibleBatchHistory = batch && !batchHistory.some((item) => String(item.id) === String(batch.id))
    ? [
        {
          id: batch.id,
          member_type: batch.member_type,
          batch_name: batch.batch_name,
          source_type: batch.source_type,
          source_label: batch.source_label,
          status: batch.status,
          created_at: batch.created_at,
          updated_at: batch.updated_at,
          dashboard: batch.dashboard,
          production_table: {
            columns_count: batch.production_table?.columns?.length || 0,
            rows_count: batch.production_table?.rows?.length || 0,
            export_format: batch.production_table?.export_format || null,
            version: batch.production_table?.version || null,
          },
        },
        ...batchHistory,
      ]
    : batchHistory;
  const showChatPanel = true;
  const showBatchPanel = true;
  const currentExportTarget = batch?.filters?.output_target || outputTarget;
  const currentExportLabel = exportTargetLabel(currentExportTarget);

  const setSelectAllCheckboxState = React.useCallback(
    (node) => {
      if (!node) return;
      node.indeterminate = selectedCount > 0 && !allActiveSelected;
    },
    [allActiveSelected, selectedCount],
  );

  function cacheWorkspaceState(overrides = {}) {
    if (!appSessionToken) return;
    setEscouadeWorkspaceCache(appSessionToken, {
      batch,
      batchHistory,
      productionBrief,
      productionBriefMenu,
      selectedBriefId,
      setup: setupSnapshot(),
      chatMessages,
      hasLoaded: true,
      ...overrides,
    });
  }

  function appendChatMessage(role, content, options = {}) {
    if (!content) return;
    const localMessage = createEscouadeChatMessage(role, content);
    setChatMessages((current) => [...current, localMessage]);
    if (!appSessionToken) return;
    saveEscouadeChatMessage({
      appSessionToken,
      role,
      content,
      metadata: options.metadata || {},
    }).catch(() => {});
  }

  function conversationHistoryForRequest(extraMessage = null) {
    const messages = extraMessage ? [...chatMessages, extraMessage] : chatMessages;
    return messages
      .filter((chatMessage) => chatMessage?.role && chatMessage?.content)
      .map((chatMessage) => ({
        role: chatMessage.role,
        content: chatMessage.content,
      }));
  }

  async function refreshBatchHistory({ silent = false } = {}) {
    if (!appSessionToken) return [];
    if (!silent) {
      setIsHistoryLoading(true);
    }
    setHistoryError("");
    try {
      const payload = await listEscouadeBatches({ appSessionToken, limit: 50 });
      const nextHistory = Array.isArray(payload?.batches) ? payload.batches : [];
      setBatchHistory(nextHistory);
      cacheWorkspaceState({ batchHistory: nextHistory });
      return nextHistory;
    } catch (historyLoadError) {
      const messageText = historyLoadError.message || "Unable to load Escouade batch history.";
      setHistoryError(messageText);
      return [];
    } finally {
      if (!silent) {
        setIsHistoryLoading(false);
      }
    }
  }

  async function refreshProductionBrief({ silent = false } = {}) {
    if (!appSessionToken) return null;
    if (!silent) {
      setIsBriefLoading(true);
    }
    try {
      const payload = await getEscouadeProductionBrief({ appSessionToken });
      const nextMenu = menuFromBriefPayload(payload);
      setProductionBrief(payload);
      setProductionBriefMenu(nextMenu);
      const nextSelectedBriefId = nextMenu[0]?.id ? String(nextMenu[0].id) : "";
      setSelectedBriefId((current) => current || nextSelectedBriefId);
      setEscouadeWorkspaceCache(appSessionToken, {
        ...(getEscouadeWorkspaceCache(appSessionToken) || {}),
        productionBrief: payload,
        productionBriefMenu: nextMenu,
        selectedBriefId: nextSelectedBriefId,
        hasLoaded: true,
      });
      return payload;
    } catch {
      return null;
    } finally {
      if (!silent) {
        setIsBriefLoading(false);
      }
    }
  }

  async function loadHistoryBatch(batchId) {
    if (!appSessionToken || !batchId || String(batch?.id) === String(batchId)) return;
    setPendingAction("loadBatch");
    setError("");
    setStatus("");
    try {
      const payload = await getEscouadeBatch({ appSessionToken, batchId });
      const nextBatch = payload?.id ? payload : payload?.batch;
      if (!nextBatch?.id) {
        throw new Error("Escouade batch could not be loaded.");
      }
      setBatch(nextBatch);
      setSelectedIds([]);
      applyBatchToSetup(nextBatch);
      cacheWorkspaceState({ batch: nextBatch });
      setStatus(`Loaded batch: ${nextBatch.batch_name || nextBatch.source_label || "Escouade batch"}.`);
      refreshBatchHistory({ silent: true });
    } catch (loadError) {
      const messageText = loadError.message || "Unable to load Escouade batch.";
      setError(messageText);
    } finally {
      setPendingAction("");
    }
  }

  function startNewBatch() {
    setBatch(null);
    setSelectedIds([]);
    setError("");
    setStatus("New Escouade batch started. Add instructions or type Generate when ready.");
    setCommand("");
    setConfirmedSetupKey("");
    if (appSessionToken) {
      const cachedWorkspace = getEscouadeWorkspaceCache(appSessionToken) || {};
      setEscouadeWorkspaceCache(appSessionToken, {
        ...cachedWorkspace,
        batch: null,
        setup: setupSnapshot(),
        hasLoaded: true,
      });
    }
  }

  React.useEffect(() => {
    startNewBatchRef.current = startNewBatch;
  });

  React.useEffect(() => {
    if (!onNewBatchReady) return undefined;
    onNewBatchReady(() => () => startNewBatchRef.current?.());
    return () => onNewBatchReady(null);
  }, [onNewBatchReady]);

  function setupSnapshot() {
    return {
      outputTarget,
      productionColumnsText,
      fixedFieldsText,
      variableFieldsText,
      mediaPlaceholdersText,
      setupTouched,
    };
  }

  function applySetupSnapshot(setup) {
    if (!setup || typeof setup !== "object") return;
    setOutputTarget(optionOrFallback(setup.outputTarget, OPTIONS.outputTarget, outputTarget));
    setProductionColumnsText(setup.productionColumnsText || "");
    setFixedFieldsText(setup.fixedFieldsText || "");
    setVariableFieldsText(setup.variableFieldsText || "");
    setMediaPlaceholdersText(setup.mediaPlaceholdersText || "");
    if (setup.setupTouched && typeof setup.setupTouched === "object") {
      setSetupTouched((current) => ({ ...current, ...setup.setupTouched }));
    }
  }

  function markSetupTouched(fields, { invalidate = true } = {}) {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    const validFields = fieldList.filter(Boolean);
    if (!validFields.length) return;
    setSetupTouched((current) => {
      const next = { ...current };
      validFields.forEach((field) => {
        next[field] = true;
      });
      return next;
    });
    if (invalidate) {
      setConfirmedSetupKey("");
    }
  }

  function applyBatchToSetup(savedBatch) {
    if (!savedBatch) return;
    const savedFilters = savedBatch.filters || {};
    const savedMemberType = MEMBER_TYPES.some(([value]) => value === savedBatch.member_type) ? savedBatch.member_type : memberType;
    const nextPlatform = optionOrFallback(
      firstValue(savedFilters.primary_platform, firstArrayValue(savedFilters.platforms)),
      OPTIONS.platform,
      platform,
    );
    const nextContentStyle = optionOrFallback(firstArrayValue(savedFilters.content_style), OPTIONS.contentStyle, contentStyle);
    const nextFormatFilters = savedFilters.format_filters && typeof savedFilters.format_filters === "object"
      ? savedFilters.format_filters
      : {};

    setMemberType(savedMemberType);
    setBatchName(firstValue(savedBatch.batch_name, batchName));
    setSourceType(optionOrFallback(firstValue(savedBatch.source_type, savedFilters.source_type), OPTIONS.sourceType, sourceType));
    setSourceLabel(firstValue(savedBatch.source_label, savedFilters.source_label, sourceLabel));
    setQuantity(Number(firstValue(savedFilters.quantity, quantity)) || quantity);
    setPlatform(nextPlatform);
    setObjective(optionOrFallback(savedFilters.objective, OPTIONS.objective, objective));
    setLanguage(optionOrFallback(savedFilters.language, OPTIONS.language, language));
    setContentStyle(nextContentStyle);
    setCtaPreference(optionOrFallback(savedFilters.cta_preference, OPTIONS.ctaPreference, ctaPreference));
    setInteractionStyle(optionOrFallback(savedFilters.interaction_style, OPTIONS.interactionStyle, interactionStyle));
    setOutputTarget(optionOrFallback(savedFilters.output_target, OPTIONS.outputTarget, outputTarget));
    setProductionColumnsText(columnsToText(savedFilters.production_columns));
    setFixedFieldsText(fixedFieldsToText(savedFilters.fixed_fields));
    setVariableFieldsText(Array.isArray(savedFilters.variable_fields) ? savedFilters.variable_fields.join("\n") : "");
    setMediaPlaceholdersText(Array.isArray(savedFilters.media_placeholders) ? savedFilters.media_placeholders.join("\n") : "");
    setMessage(firstValue(savedFilters.special_instructions, message));
    setFormatFiltersByMember((current) => ({
      ...current,
      [savedMemberType]: {
        ...defaultFormatFilters(savedMemberType),
        ...(current[savedMemberType] || {}),
        ...nextFormatFilters,
      },
    }));
    markSetupTouched([
      ...SETUP_DECISION_KEYS,
      savedFilters.production_columns?.length ? "production_columns" : null,
      savedFilters.fixed_fields && Object.keys(savedFilters.fixed_fields).length ? "fixed_fields" : null,
      savedFilters.variable_fields?.length ? "variable_fields" : null,
      savedFilters.media_placeholders?.length ? "media_placeholders" : null,
    ], { invalidate: false });
  }

  function applyProductionBrief(brief, { announce = true } = {}) {
    if (!brief) return;

    const nextMemberType = MEMBER_TYPES.some(([value]) => value === brief.member_type) ? brief.member_type : memberType;
    const briefFilters = brief.filters || {};
    const nextSourceType = optionOrFallback(firstValue(brief.source_type, briefFilters.source_type), OPTIONS.sourceType, sourceType);
    const nextPlatform = optionOrFallback(
      firstValue(briefFilters.primary_platform, firstArrayValue(briefFilters.platforms)),
      OPTIONS.platform,
      platform,
    );
    const nextContentStyle = optionOrFallback(firstArrayValue(briefFilters.content_style), OPTIONS.contentStyle, contentStyle);
    const nextQuantity = Number(firstValue(briefFilters.quantity, quantity)) || quantity;
    const nextFormatFilters = briefFilters.format_filters && typeof briefFilters.format_filters === "object"
      ? briefFilters.format_filters
      : {};
    const tableSuggestion = brief.table_suggestion || briefFilters.table_suggestion || {};
    const briefProductionColumns = firstValue(briefFilters.production_columns, tableSuggestion.production_columns);
    const briefFixedFields = firstValue(briefFilters.fixed_fields, tableSuggestion.fixed_fields);
    const briefVariableFields = firstValue(briefFilters.variable_fields, tableSuggestion.variable_fields);
    const briefMediaPlaceholders = firstValue(briefFilters.media_placeholders, tableSuggestion.media_placeholders);

    setMemberType(nextMemberType);
    setBatchName(firstValue(brief.batch_name, batchName));
    setSourceType(nextSourceType);
    setSourceLabel(firstValue(brief.source_label, briefFilters.source_label, sourceLabel));
    setQuantity(nextQuantity);
    setPlatform(nextPlatform);
    setObjective(optionOrFallback(briefFilters.objective, OPTIONS.objective, objective));
    setLanguage(optionOrFallback(briefFilters.language, OPTIONS.language, language));
    setContentStyle(nextContentStyle);
    setCtaPreference(optionOrFallback(briefFilters.cta_preference, OPTIONS.ctaPreference, ctaPreference));
    setInteractionStyle(optionOrFallback(briefFilters.interaction_style, OPTIONS.interactionStyle, interactionStyle));
    setOutputTarget(optionOrFallback(firstValue(briefFilters.output_target, tableSuggestion.output_target), OPTIONS.outputTarget, outputTarget));
    setProductionColumnsText(columnsToText(briefProductionColumns));
    setFixedFieldsText(fixedFieldsToText(briefFixedFields));
    setVariableFieldsText(
      Array.isArray(briefVariableFields)
        ? briefVariableFields.join("\n")
        : "",
    );
    setMediaPlaceholdersText(
      Array.isArray(briefMediaPlaceholders)
        ? briefMediaPlaceholders.join("\n")
        : "",
    );
    setMessage(firstValue(brief.message, briefFilters.special_instructions, message));
    setFormatFiltersByMember((current) => ({
      ...current,
      [nextMemberType]: {
        ...defaultFormatFilters(nextMemberType),
        ...(current[nextMemberType] || {}),
        ...nextFormatFilters,
      },
    }));
    markSetupTouched([
      firstValue(brief.source_label, briefFilters.source_label) ? "source_label" : null,
      brief.member_type ? "member_type" : null,
      briefFilters.quantity ? "quantity" : null,
      firstValue(briefFilters.primary_platform, firstArrayValue(briefFilters.platforms)) ? "primary_platform" : null,
      briefFilters.objective ? "objective" : null,
      briefFilters.cta_preference ? "cta_preference" : null,
      firstValue(briefFilters.output_target, tableSuggestion.output_target) ? "output_target" : null,
      Array.isArray(briefProductionColumns) && briefProductionColumns.length ? "production_columns" : null,
      briefFixedFields && typeof briefFixedFields === "object" && Object.keys(briefFixedFields).length ? "fixed_fields" : null,
      Array.isArray(briefVariableFields) && briefVariableFields.length ? "variable_fields" : null,
      Array.isArray(briefMediaPlaceholders) && briefMediaPlaceholders.length ? "media_placeholders" : null,
    ]);

    if (announce) {
      setStatus("Sacha production brief applied to the batch setup.");
    }
  }

  function applyProductionMenuItem(item, { announce = true } = {}) {
    const brief = item?.brief || productionBrief?.brief;
    if (!brief) return;

    if (item?.id) {
      setSelectedBriefId(String(item.id));
    }
    applyProductionBrief(brief, { announce: false });
    cacheWorkspaceState({
      selectedBriefId: item?.id ? String(item.id) : selectedBriefId,
    });

    if (announce) {
      setStatus(`Applied Sacha brief: ${briefTitle(item)}.`);
    }
  }

  function applyMatchedSachaBrief(parsedSetup) {
    if (!parsedSetup?.matched_brief_id && !parsedSetup?.matched_brief) return false;

    const matchedItem = productionBriefMenu.find((item) => String(item.id) === String(parsedSetup.matched_brief_id));
    if (matchedItem) {
      applyProductionMenuItem(matchedItem, { announce: false });
      return true;
    }

    if (parsedSetup.matched_brief) {
      applyProductionBrief(parsedSetup.matched_brief, { announce: false });
      if (parsedSetup.matched_brief_id) {
        setSelectedBriefId(String(parsedSetup.matched_brief_id));
      }
      return true;
    }

    return false;
  }

  function selectProductionMenuItem(nextId) {
    const nextItem = productionBriefMenu.find((item) => String(item.id) === String(nextId));
    if (!nextItem) return;
    applyProductionMenuItem(nextItem);
  }

  React.useEffect(() => {
    if (!appSessionToken || hasAppliedBriefRef.current) return;

    const cachedWorkspace = getEscouadeWorkspaceCache(appSessionToken);
    if (cachedWorkspace?.hasLoaded) {
      const cachedBatch = cachedWorkspace.batch || null;
      const cachedBrief = cachedWorkspace.productionBrief || null;
      const cachedMenu = cachedWorkspace.productionBriefMenu || [];
      const cachedHistory = cachedWorkspace.batchHistory || [];

      if (cachedBatch) {
        setBatch(cachedBatch);
        applyBatchToSetup(cachedBatch);
      }
      if (Array.isArray(cachedHistory)) {
        setBatchHistory(cachedHistory);
      }
      if (cachedBrief || cachedMenu.length) {
        setProductionBrief(cachedBrief);
        setProductionBriefMenu(cachedMenu);
        setSelectedBriefId(cachedWorkspace.selectedBriefId || cachedMenu[0]?.id || "");
      } else {
        setIsBriefLoading(true);
        refreshProductionBrief({ silent: false });
      }
      if (Array.isArray(cachedWorkspace.chatMessages) && cachedWorkspace.chatMessages.length) {
        setChatMessages(normalizeEscouadeChatMessages(cachedWorkspace.chatMessages));
      }
      loadEscouadeChat();
      refreshBatchHistory({ silent: true });
      applySetupSnapshot(cachedWorkspace.setup);
      hasAppliedBriefRef.current = true;
      if (cachedBrief || cachedMenu.length) {
        setIsBriefLoading(false);
      }
      setIsWorkspaceLoading(false);
      return;
    }

    let isMounted = true;
    setIsBriefLoading(true);
    setIsWorkspaceLoading(true);
    Promise.all([
      getLatestEscouadeBatch({ appSessionToken }).catch(() => ({ batch: null })),
      getEscouadeProductionBrief({ appSessionToken }),
      listEscouadeBatches({ appSessionToken, limit: 50 }).catch(() => ({ batches: [] })),
    ])
      .then(([latestPayload, payload, historyPayload]) => {
        if (!isMounted) return;
        const latestBatch = latestPayload?.batch || null;
        const nextHistory = Array.isArray(historyPayload?.batches) ? historyPayload.batches : [];
        setBatchHistory(nextHistory);
        if (latestBatch) {
          setBatch(latestBatch);
          applyBatchToSetup(latestBatch);
        }
        loadEscouadeChat();

        const nextMenu = menuFromBriefPayload(payload);
        let nextSelectedBriefId = "";
        if (payload?.brief || nextMenu.length) {
          setProductionBrief(payload);
          setProductionBriefMenu(nextMenu);
          if (nextMenu.length && !latestBatch) {
            nextSelectedBriefId = String(nextMenu[0].id);
            setSelectedBriefId(String(nextMenu[0].id));
            applyProductionBrief(nextMenu[0].brief || payload.brief, { announce: false });
            setStatus(
              nextMenu.length > 1
                ? "Sacha production menu loaded into Escouade."
                : "Sacha production brief loaded into Escouade.",
            );
          }
        }
        setEscouadeWorkspaceCache(appSessionToken, {
          batch: latestBatch,
          batchHistory: nextHistory,
          productionBrief: payload,
          productionBriefMenu: nextMenu,
          selectedBriefId: nextSelectedBriefId,
          setup: setupSnapshot(),
          chatMessages,
          hasLoaded: true,
        });
        hasAppliedBriefRef.current = true;
      })
      .catch(() => {
        if (isMounted) hasAppliedBriefRef.current = true;
      })
      .finally(() => {
        if (isMounted) {
          setIsBriefLoading(false);
          setIsWorkspaceLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [appSessionToken]);

  React.useEffect(() => {
    if (!appSessionToken || !hasAppliedBriefRef.current) return;
    const cachedWorkspace = getEscouadeWorkspaceCache(appSessionToken) || {};
    setEscouadeWorkspaceCache(appSessionToken, {
      ...cachedWorkspace,
      setup: setupSnapshot(),
      chatMessages,
      hasLoaded: true,
    });
  }, [appSessionToken, outputTarget, productionColumnsText, fixedFieldsText, variableFieldsText, mediaPlaceholdersText, setupTouched, chatMessages]);

  React.useEffect(() => {
    if (!chatMessagesRef.current) return;
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [chatMessages, pendingAction, isChatLoading]);

  React.useEffect(() => {
    if (!queuedSetupConfirmationLead) return;
    const confirmationText = setupConfirmationMessage(queuedSetupConfirmationLead);
    appendChatMessage("assistant", confirmationText);
    setStatus(confirmationText);
    if (!setupMissingQuestions().length) {
      setConfirmedSetupKey(currentSetupKey());
    }
    setQueuedSetupConfirmationLead("");
  }, [queuedSetupConfirmationLead, memberType, batchName, sourceType, sourceLabel, quantity, platform, objective, contentStyle, ctaPreference, language, interactionStyle, outputTarget, productionColumnsText, fixedFieldsText, variableFieldsText, mediaPlaceholdersText, formatFiltersByMember, message, setupTouched]);

  function changeMember(nextMemberType) {
    setMemberType(nextMemberType);
    markSetupTouched("member_type");
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
      special_instructions: message,
      format_filters: formatFilters,
      output_target: outputTarget,
      production_columns: columnsFromText(productionColumnsText),
      fixed_fields: parseKeyValueText(fixedFieldsText),
      variable_fields: parseListText(variableFieldsText),
      media_placeholders: parseListText(mediaPlaceholdersText),
    };
  }

  function setupKeyFromSnapshot(snapshot) {
    return JSON.stringify({
      member_type: snapshot.member_type,
      batch_name: snapshot.batch_name,
      source_type: snapshot.source_type,
      source_label: snapshot.source_label,
      filters: {
        primary_platform: snapshot.filters?.primary_platform,
        objective: snapshot.filters?.objective,
        quantity: snapshot.filters?.quantity,
        cta_preference: snapshot.filters?.cta_preference,
        language: snapshot.filters?.language,
        content_style: snapshot.filters?.content_style,
        interaction_style: snapshot.filters?.interaction_style,
        output_target: snapshot.filters?.output_target,
        production_columns: snapshot.filters?.production_columns,
        fixed_fields: snapshot.filters?.fixed_fields,
        variable_fields: snapshot.filters?.variable_fields,
        media_placeholders: snapshot.filters?.media_placeholders,
        format_filters: snapshot.filters?.format_filters,
        special_instructions: snapshot.filters?.special_instructions,
      },
      decisions: setupTouched,
    });
  }

  function currentSetupKey() {
    return setupKeyFromSnapshot(currentSetupPayload());
  }

  function setupMissingQuestions(snapshot = currentSetupPayload()) {
    const missing = [];
    const needsDecision = (field) => !setupTouched[field];
    if (!snapshot.source_label || needsDecision("source_label")) missing.push("which Sacha series, saved brief, or topic to use");
    if (!snapshot.member_type || needsDecision("member_type")) missing.push("the content format, like image posts, carousels, reels, stories, or text posts");
    if (!snapshot.filters?.quantity || needsDecision("quantity")) missing.push("how many items to create");
    if (!snapshot.filters?.primary_platform || needsDecision("primary_platform")) missing.push("the main platform");
    if (!snapshot.filters?.objective || needsDecision("objective")) missing.push("the business objective");
    if (!snapshot.filters?.cta_preference || needsDecision("cta_preference")) missing.push("the CTA preference");
    if (!snapshot.filters?.output_target || needsDecision("output_target")) missing.push("the output target, like Escouade CSV or Canva Bulk Create CSV");
    return missing;
  }

  function setupConfirmationMessage(lead = "") {
    const snapshot = currentSetupPayload();
    const missing = setupMissingQuestions(snapshot);
    if (missing.length) {
      return [
        lead,
        "Before I generate, I only need these missing decisions:",
        ...missing.map((item) => `- ${item}`),
        "",
        "Reply naturally with those details and I’ll update the setup.",
      ].filter(Boolean).join("\n");
    }

    const setupFilters = snapshot.filters || {};
    const columns = setupFilters.production_columns || [];
    const fixedFields = setupFilters.fixed_fields || {};
    const variableFields = setupFilters.variable_fields || [];
    const mediaPlaceholders = setupFilters.media_placeholders || [];
    const tableLine = columns.length
      ? columns.map((column) => column.label || column.key).filter(Boolean).join(", ")
      : `smart default columns for ${memberTypeLabel(snapshot.member_type)}`;
    const fixedLine = Object.keys(fixedFields).length
      ? Object.entries(fixedFields).map(([key, value]) => `${key}: ${value}`).join("; ")
      : "none";
    const variableLine = variableFields.length ? variableFields.join(", ") : "Escouade will vary the core content naturally.";
    const mediaLine = mediaPlaceholders.length ? mediaPlaceholders.join(", ") : "none";

    return [
      lead,
      "Here’s the setup I’ll use:",
      `- Batch: ${snapshot.batch_name || "Untitled batch"}`,
      `- Source: ${snapshot.source_label || snapshot.source_type}`,
      `- Format: ${memberTypeLabel(snapshot.member_type)}`,
      `- Quantity: ${setupFilters.quantity}`,
      `- Platform: ${setupFilters.primary_platform}`,
      `- Objective: ${setupFilters.objective}`,
      `- CTA: ${setupFilters.cta_preference}`,
      `- Output: ${setupFilters.output_target}`,
      `- Production table: ${tableLine}`,
      `- Fixed fields: ${fixedLine}`,
      `- Variable fields: ${variableLine}`,
      `- Media placeholders: ${mediaLine}`,
      "",
      "Type **Generate** to create the batch, or send any changes first.",
    ].filter(Boolean).join("\n");
  }

  function currentSetupPayload() {
    return {
      member_type: memberType,
      batch_name: batchName,
      source_type: sourceType,
      source_label: sourceLabel,
      filters: filters(),
    };
  }

  function applyStructuredSetupUpdates(updates = {}) {
    const applied = [];
    const touchedFields = [];

    if (updates.member_type && MEMBER_TYPES.some(([value]) => value === updates.member_type)) {
      setMemberType(updates.member_type);
      applied.push("format");
      touchedFields.push("member_type");
    }
    if (updates.batch_name) {
      setBatchName(updates.batch_name);
      applied.push("batch name");
    }
    if (updates.source_type) {
      setSourceType(optionOrFallback(updates.source_type, OPTIONS.sourceType, sourceType));
      applied.push("source");
    }
    if (updates.source_label) {
      setSourceLabel(updates.source_label);
      applied.push("source label");
      touchedFields.push("source_label");
    }
    if (updates.quantity) {
      setQuantity(Number(updates.quantity) || quantity);
      applied.push("quantity");
      touchedFields.push("quantity");
    }
    if (updates.primary_platform) {
      setPlatform(optionOrFallback(updates.primary_platform, OPTIONS.platform, platform));
      applied.push("platform");
      touchedFields.push("primary_platform");
    }
    if (updates.objective) {
      setObjective(optionOrFallback(updates.objective, OPTIONS.objective, objective));
      applied.push("objective");
      touchedFields.push("objective");
    }
    if (updates.language) {
      setLanguage(optionOrFallback(updates.language, OPTIONS.language, language));
      applied.push("language");
    }
    if (updates.content_style) {
      setContentStyle(optionOrFallback(updates.content_style, OPTIONS.contentStyle, contentStyle));
      applied.push("content style");
    }
    if (updates.cta_preference) {
      setCtaPreference(optionOrFallback(updates.cta_preference, OPTIONS.ctaPreference, ctaPreference));
      applied.push("CTA");
      touchedFields.push("cta_preference");
    }
    if (updates.interaction_style) {
      setInteractionStyle(optionOrFallback(updates.interaction_style, OPTIONS.interactionStyle, interactionStyle));
      applied.push("interaction style");
    }
    if (updates.output_target) {
      setOutputTarget(optionOrFallback(updates.output_target, OPTIONS.outputTarget, outputTarget));
      applied.push("output target");
      touchedFields.push("output_target");
    }
    if (Array.isArray(updates.production_columns) && updates.production_columns.length) {
      setProductionColumnsText(columnsToText(updates.production_columns));
      applied.push("columns");
      touchedFields.push("production_columns");
    }
    if (updates.fixed_fields && typeof updates.fixed_fields === "object") {
      setFixedFieldsText(fixedFieldsToText(updates.fixed_fields));
      applied.push("fixed fields");
      touchedFields.push("fixed_fields");
    }
    if (Array.isArray(updates.variable_fields) && updates.variable_fields.length) {
      setVariableFieldsText(updates.variable_fields.join("\n"));
      applied.push("variable fields");
      touchedFields.push("variable_fields");
    }
    if (Array.isArray(updates.media_placeholders) && updates.media_placeholders.length) {
      setMediaPlaceholdersText(updates.media_placeholders.join("\n"));
      applied.push("media placeholders");
      touchedFields.push("media_placeholders");
    }
    if (updates.special_instructions) {
      setMessage(updates.special_instructions);
      applied.push("instructions");
    }
    if (updates.format_filters && typeof updates.format_filters === "object") {
      setFormatFiltersByMember((current) => ({
        ...current,
        [updates.member_type || memberType]: {
          ...defaultFormatFilters(updates.member_type || memberType),
          ...(current[updates.member_type || memberType] || {}),
          ...updates.format_filters,
        },
      }));
      applied.push("format controls");
    }

    markSetupTouched(touchedFields);
    return [...new Set(applied)];
  }

  function updateBatch(response) {
    if (response.workflowStatus) onWorkflowStatus(response.workflowStatus, false);
    setBatch(response.batch);
    setSelectedIds([]);
    setStatus(response.message || "");
    cacheWorkspaceState({ batch: response.batch });
    refreshBatchHistory({ silent: true });
  }

  async function loadEscouadeChat() {
    if (!appSessionToken) return;
    setIsChatLoading(true);
    try {
      const payload = await getEscouadeChat({
        appSessionToken,
      }).catch(() => null);
      if (payload?.messages) {
        setChatMessages(chatMessagesFromApi(payload.messages));
      }
    } finally {
      setIsChatLoading(false);
    }
  }

  function applyExportWorkflowStatus(response) {
    if (response?.workflowStatus) onWorkflowStatus(response.workflowStatus, false);
  }

  async function runAction(actionName, task) {
    setPendingAction(actionName);
    setError("");
    setStatus("");
    try {
      await task();
      return true;
    } catch (actionError) {
      const messageText = actionError.message || "Escouade request failed.";
      setError(messageText);
      appendChatMessage("assistant", messageText);
      return false;
    } finally {
      setPendingAction("");
    }
  }

  function toggleItem(itemId) {
    setSelectedIds((current) =>
      current.some((id) => String(id) === String(itemId))
        ? current.filter((id) => String(id) !== String(itemId))
        : [...current, itemId],
    );
  }

  function selectAllActiveItems() {
    setSelectedIds(activeItemIds);
  }

  function clearSelectedItems() {
    setSelectedIds([]);
  }

  function setFormatValue(key, value) {
    setConfirmedSetupKey("");
    setFormatFiltersByMember((current) => ({
      ...current,
      [memberType]: {
        ...(current[memberType] || defaultFormatFilters(memberType)),
        [key]: value,
      },
    }));
  }

  function restoreCurrentFormatDefaults() {
    setConfirmedSetupKey("");
    setFormatFiltersByMember((current) => ({
      ...current,
      [memberType]: defaultFormatFilters(memberType),
    }));
  }

  function applySetupHintsFromText(text) {
    const updates = [];
    const touchedFields = [];
    const nextMemberType = findMentionedMemberType(text);
    const nextQuantity = findMentionedQuantity(text);
    const nextPlatform = findMentionedOption(text, OPTIONS.platform);
    const nextObjective = findMentionedOption(text, OPTIONS.objective);
    const nextLanguage = findMentionedOption(text, OPTIONS.language);
    const nextStyle = findMentionedOption(text, OPTIONS.contentStyle);
    const nextCta = findMentionedOption(text, OPTIONS.ctaPreference);
    const nextInteraction = findMentionedOption(text, OPTIONS.interactionStyle);

    if (nextMemberType && nextMemberType !== memberType) {
      setMemberType(nextMemberType);
      updates.push("format");
    }
    if (nextMemberType) {
      touchedFields.push("member_type");
    }
    if (nextQuantity && nextQuantity !== Number(quantity)) {
      setQuantity(nextQuantity);
      updates.push("quantity");
    }
    if (nextQuantity) {
      touchedFields.push("quantity");
    }
    if (nextPlatform && nextPlatform !== platform) {
      setPlatform(nextPlatform);
      updates.push("platform");
    }
    if (nextPlatform) {
      touchedFields.push("primary_platform");
    }
    if (nextObjective && nextObjective !== objective) {
      setObjective(nextObjective);
      updates.push("objective");
    }
    if (nextObjective) {
      touchedFields.push("objective");
    }
    if (nextLanguage && nextLanguage !== language) {
      setLanguage(nextLanguage);
      updates.push("language");
    }
    if (nextStyle && nextStyle !== contentStyle) {
      setContentStyle(nextStyle);
      updates.push("content style");
    }
    if (nextCta && nextCta !== ctaPreference) {
      setCtaPreference(nextCta);
      updates.push("CTA preference");
    }
    if (nextCta) {
      touchedFields.push("cta_preference");
    }
    if (nextInteraction && nextInteraction !== interactionStyle) {
      setInteractionStyle(nextInteraction);
      updates.push("interaction style");
    }

    markSetupTouched(touchedFields);
    return updates;
  }

  function markApprovedItemsExported() {
    setBatch((current) => {
      if (!current) return current;
      const updatedItems = current.items.map((item) => item.status === "approved" ? { ...item, status: "exported" } : item);
      const updatedCounts = updatedItems.reduce((accumulator, item) => {
        accumulator[item.status] = (accumulator[item.status] || 0) + 1;
        return accumulator;
      }, { draft: 0, needs_revision: 0, revised: 0, approved: 0, exported: 0 });

      const updatedBatch = {
        ...current,
        status: "exported",
        items: updatedItems,
        dashboard: current.dashboard ? { ...current.dashboard, counts: updatedCounts } : current.dashboard,
      };
      cacheWorkspaceState({ batch: updatedBatch });
      refreshBatchHistory({ silent: true });
      return updatedBatch;
    });
  }

  function requestSetupConfirmation(lead = "") {
    const confirmationText = setupConfirmationMessage(lead);
    appendChatMessage("assistant", confirmationText);
    setStatus(confirmationText);
    if (!setupMissingQuestions().length) {
      setConfirmedSetupKey(currentSetupKey());
    }
  }

  function canGenerateFromConfirmedSetup() {
    return !setupMissingQuestions().length && confirmedSetupKey === currentSetupKey();
  }

  async function handleInstruction(nextCommand = command) {
    const commandValue = nextCommand && typeof nextCommand === "object" && "nativeEvent" in nextCommand ? command : nextCommand;
    const trimmedCommand = String(commandValue || "").trim();
    if (!trimmedCommand || pendingAction) return;

    const lower = trimmedCommand.toLowerCase();
    const mentionsSpecificPost = /\b[a-z]+-\d{3,}\b/i.test(trimmedCommand);
    const wantsExport = lower.includes("export") || lower.includes("download");
    const wantsApprove = lower.includes("approve");
    const wantsReopen = lower.includes("reopen");
    const isPureGenerate = [
      "generate",
      "generate batch",
      "generate the batch",
      "generate drafts",
      "build the batch",
      "create the batch",
    ].includes(lower);
    const hasGenerateBatchIntent =
      /\b(generate|build|create|produce|make)\b[\s\S]{0,40}\b(batch|drafts?|posts?|content)\b/.test(lower)
      || /\b(generate|build|create|produce|make)\b[\s\S]{0,40}\b(new|next)\b[\s\S]{0,20}\bbatch\b/.test(lower);
    const wantsGenerate =
      isPureGenerate
      || hasGenerateBatchIntent
      || lower.includes("generate batch")
      || lower.includes("generate the batch")
      || lower.includes("generate drafts")
      || lower.includes("build the batch")
      || lower.includes("create the batch");
    const shouldUseSelectedItems = selectedCount > 0 && !mentionsSpecificPost;
    const canParseSetup = !isPureGenerate && !wantsExport && !wantsApprove && !wantsReopen && !shouldUseSelectedItems && !mentionsSpecificPost;

    appendChatMessage("user", trimmedCommand);
    setCommand("");
    const conversationHistory = conversationHistoryForRequest({ role: "user", content: trimmedCommand });

    if (canParseSetup) {
      let parsedSetup = null;
      const setupParsed = await runAction("setup", async () => {
        parsedSetup = await parseEscouadeSetupInstruction({
          appSessionToken,
          instruction: trimmedCommand,
          currentSetup: currentSetupPayload(),
          conversationHistory,
        });
      });
      if (!setupParsed) return;

      const matchedBriefApplied = applyMatchedSachaBrief(parsedSetup);
      const appliedUpdates = applyStructuredSetupUpdates(parsedSetup?.updates || {});
      if (matchedBriefApplied || appliedUpdates.length) {
        const responseText =
          parsedSetup?.message
            || (matchedBriefApplied ? "Applied matching Sacha brief." : `Updated setup: ${appliedUpdates.join(", ")}.`);
        setQueuedSetupConfirmationLead(responseText);
        return;
      }

      if (wantsGenerate) {
        if (!canGenerateFromConfirmedSetup()) {
          requestSetupConfirmation();
          return;
        }
        await runAction("generate", async () => {
          const response = await generateEscouadeBatch({
            appSessionToken,
            memberType,
            batchName,
            sourceType,
            sourceLabel,
            filters: filters(),
            message,
            conversationHistory,
          });
          updateBatch(response);
          appendChatMessage("assistant", response.message || "Batch generated and saved as drafts.");
        });
        setCommand("");
        return;
      }

      if (!batch) {
        const responseText = parsedSetup?.message || "No setup changes detected. Add more production details or generate a batch.";
        setStatus(responseText);
        appendChatMessage("assistant", responseText);
        return;
      }
    }

    if (wantsGenerate) {
      if (!canGenerateFromConfirmedSetup()) {
        requestSetupConfirmation();
        return;
      }
      await runAction("generate", async () => {
        const response = await generateEscouadeBatch({
          appSessionToken,
          memberType,
          batchName,
          sourceType,
          sourceLabel,
          filters: filters(),
          message,
          conversationHistory,
        });
        updateBatch(response);
        appendChatMessage("assistant", response.message || "Batch generated and saved as drafts.");
      });
      setCommand("");
      return;
    }

    await runAction("instruction", async () => {
      if (wantsExport) {
        if (!batch) throw new Error("Generate a batch before exporting.");
        const response = await exportEscouadeCsv({ appSessionToken, batchId: batch.id });
        markApprovedItemsExported();
        applyExportWorkflowStatus(response);
        setCommand("");
        setStatus(`Approved items exported as ${currentExportLabel}.`);
        appendChatMessage("assistant", `Approved items exported as ${currentExportLabel}.`);
        return;
      }

      if (shouldUseSelectedItems && wantsApprove) {
        if (!batch) throw new Error("Generate a batch before approving items.");
        const response = await approveEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds });
        updateBatch(response);
        appendChatMessage("assistant", response.message || "Selected items approved.");
        setCommand("");
        return;
      }

      if (shouldUseSelectedItems && wantsReopen) {
        if (!batch) throw new Error("Generate a batch before reopening items.");
        const response = await reopenEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds });
        updateBatch(response);
        appendChatMessage("assistant", response.message || "Selected items reopened.");
        setCommand("");
        return;
      }

      if (shouldUseSelectedItems) {
        if (!batch) throw new Error("Generate a batch before revising items.");
        const response = await reviseEscouadeItems({
          appSessionToken,
          batchId: batch.id,
          itemIds: selectedIds,
          instruction: trimmedCommand,
          conversationHistory,
        });
        updateBatch(response);
        appendChatMessage("assistant", response.message || "Selected rows revised.");
        setCommand("");
        return;
      }

      if (!batch) throw new Error("Generate a batch before sending batch commands.");
      const response = await commandEscouadeBatch({
        appSessionToken,
        batchId: batch.id,
        message: trimmedCommand,
        conversationHistory,
      });
      updateBatch(response);
      appendChatMessage("assistant", response.message || "Done.");
      setCommand("");
    });
  }

  const areSidebarsCollapsed = isSetupCollapsed && isMainSidebarCollapsed;

  function toggleEscouadeSidebars() {
    const nextCollapsed = !areSidebarsCollapsed;
    setIsSetupCollapsed(nextCollapsed);
    onMainSidebarCollapsedChange?.(nextCollapsed);
  }

  const setupToggleButton = (
    <button
      className={areSidebarsCollapsed ? "escouade-setup-toggle is-floating" : "escouade-setup-toggle"}
      type="button"
      aria-label={areSidebarsCollapsed ? "Open Escouade workspace sidebars" : "Collapse Escouade workspace sidebars"}
      aria-expanded={!areSidebarsCollapsed}
      onClick={toggleEscouadeSidebars}
    >
      {areSidebarsCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </button>
  );
  const isChatBusy = ["instruction", "setup", "generate", "loadBatch", "export", "approve", "reopen"].includes(pendingAction);
  const chatBusyMessage = {
    setup: "Updating setup...",
    generate: "Generating batch...",
    loadBatch: "Loading batch conversation...",
    export: "Exporting approved content...",
    approve: "Approving selected rows...",
    reopen: "Reopening selected rows...",
    instruction: selectedCount ? "Revising selected rows..." : "Working on it...",
  }[pendingAction] || "Working on it...";
  const sendButtonLabel = {
    setup: "Updating...",
    generate: "Generating...",
    loadBatch: "Loading...",
    export: "Exporting...",
    approve: "Approving...",
    reopen: "Reopening...",
    instruction: selectedCount ? "Revising..." : "Working...",
  }[pendingAction] || "Send";
  const chatPlaceholder = selectedCount
    ? "Tell Escouade how to revise selected rows, or say approve selected / reopen selected / export approved..."
    : "Type “Generate” to confirm the setup, or add instructions first...";

  return (
    <>
    <section className={isSetupCollapsed ? "escouade-console is-setup-collapsed" : "escouade-console"}>
      {!areSidebarsCollapsed && setupToggleButton}
      <div className="escouade-setup">
        <div className="escouade-static-section">
          <div className="escouade-static-section-header">
            <strong>Content type</strong>
          </div>
          <div className="escouade-static-section-body">
            <div className="escouade-member-buttons" role="tablist" aria-label="Escouade member type">
              {MEMBER_TYPES.map(([value, label]) => (
                <button
                  className={value === memberType ? "is-active" : ""}
                  key={value}
                  type="button"
                  onClick={() => changeMember(value)}
                >
                  <img src={ESCOUADE_MEMBER_ORBS[value]} alt="" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={isStrategySetupOpen ? "escouade-sidebar-section is-open" : "escouade-sidebar-section"}>
          <button
            className="escouade-sidebar-section-toggle"
            type="button"
            aria-expanded={isStrategySetupOpen}
            onClick={() => setIsStrategySetupOpen((current) => !current)}
          >
            <span>
              <strong>Strategy & history</strong>
            </span>
            <ChevronRight size={16} />
          </button>

          {isStrategySetupOpen && (
            <div className="escouade-sidebar-section-body">
              {(isBriefLoading || productionBriefMenu.length > 0 || productionBrief?.brief) && (
                <div className="escouade-brief-picker">
                  <div className="escouade-brief-picker-header">
                    <div>
                      <strong>Sacha production menu</strong>
                    </div>
                  </div>

                  {productionBriefMenu.length > 0 && (
                    <select value={selectedBriefId} onChange={(event) => selectProductionMenuItem(event.target.value)}>
                      {productionBriefMenu.map((item, index) => (
                        <option key={item.id || index} value={String(item.id)}>
                          {briefTitle(item, index)}
                        </option>
                      ))}
                    </select>
                  )}

                </div>
              )}

              <div className="escouade-history-panel">
                <div className="escouade-history-header">
                  <div>
                    <strong>Batch history</strong>
                  </div>
                  <button
                    type="button"
                    aria-label="Refresh batch history"
                    disabled={isHistoryLoading || Boolean(pendingAction)}
                    onClick={() => refreshBatchHistory()}
                  >
                    {isHistoryLoading ? <Loader2 className="spin" size={14} /> : <History size={14} />}
                    Refresh
                  </button>
                </div>

                {historyError && <p className="escouade-history-error">{historyError}</p>}

                {visibleBatchHistory.length ? (
                  <div className="escouade-history-select-wrap">
                    <select
                      className="escouade-history-select"
                      aria-label="Load previous Escouade batch"
                      value={batch?.id ? String(batch.id) : ""}
                      disabled={isHistoryLoading || Boolean(pendingAction)}
                      onChange={(event) => loadHistoryBatch(event.target.value)}
                    >
                      {!batch?.id && <option value="">Choose a previous batch</option>}
                      {visibleBatchHistory.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {historyItemLabel(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="escouade-history-empty">Generated batches will appear here.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={isBatchDetailsOpen ? "escouade-sidebar-section is-open" : "escouade-sidebar-section"}>
          <button
            className="escouade-sidebar-section-toggle"
            type="button"
            aria-expanded={isBatchDetailsOpen}
            onClick={() => setIsBatchDetailsOpen((current) => !current)}
          >
            <span>
              <strong>Batch details</strong>
            </span>
            <ChevronRight size={16} />
          </button>

          {isBatchDetailsOpen && (
            <div className="escouade-sidebar-section-body">
              <div className="escouade-control">
                <label>Batch name</label>
                <input
                  value={batchName}
                  onChange={(event) => {
                    setBatchName(event.target.value);
                    setConfirmedSetupKey("");
                  }}
                />
              </div>

              <SelectControl
                label="Source"
                value={sourceType}
                options={OPTIONS.sourceType}
                onChange={(value) => {
                  setSourceType(value);
                  setConfirmedSetupKey("");
                }}
              />

              <div className="escouade-control">
                <label>Source label</label>
                <input
                  value={sourceLabel}
                  onChange={(event) => {
                    setSourceLabel(event.target.value);
                    if (event.target.value.trim()) markSetupTouched("source_label");
                  }}
                />
              </div>

              <SelectControl
                label="Quantity"
                value={String(quantity)}
                options={uniqueOptions(OPTIONS.quantity, quantity).map(String)}
                onChange={(value) => {
                  setQuantity(value);
                  markSetupTouched("quantity");
                }}
              />
              <SelectControl
                label="Platform"
                value={platform}
                options={uniqueOptions(OPTIONS.platform, platform)}
                onChange={(value) => {
                  setPlatform(value);
                  markSetupTouched("primary_platform");
                }}
              />
              <SelectControl
                label="Objective"
                value={objective}
                options={OPTIONS.objective}
                onChange={(value) => {
                  setObjective(value);
                  markSetupTouched("objective");
                }}
              />
              <SelectControl
                label="Language"
                value={language}
                options={OPTIONS.language}
                onChange={(value) => {
                  setLanguage(value);
                  setConfirmedSetupKey("");
                }}
              />
              <SelectControl
                label="Content style"
                value={contentStyle}
                options={OPTIONS.contentStyle}
                onChange={(value) => {
                  setContentStyle(value);
                  setConfirmedSetupKey("");
                }}
              />
              <SelectControl
                label="CTA preference"
                value={ctaPreference}
                options={OPTIONS.ctaPreference}
                onChange={(value) => {
                  setCtaPreference(value);
                  markSetupTouched("cta_preference");
                }}
              />
              <SelectControl
                label="Interaction style"
                value={interactionStyle}
                options={OPTIONS.interactionStyle}
                onChange={(value) => {
                  setInteractionStyle(value);
                  setConfirmedSetupKey("");
                }}
              />
            </div>
          )}
        </div>

        <div className={isAdvancedSetupOpen ? "escouade-advanced-setup is-open" : "escouade-advanced-setup"}>
          <button
            className="escouade-advanced-toggle"
            type="button"
            aria-expanded={isAdvancedSetupOpen}
            onClick={() => setIsAdvancedSetupOpen((current) => !current)}
          >
            <span>
              <strong>Advanced CSV/Table Settings</strong>
            </span>
            <ChevronRight size={16} />
          </button>

          {isAdvancedSetupOpen && (
            <div className="escouade-advanced-body">
              <div className="escouade-format-group">
                <div className="escouade-format-header">
                  <span>Format controls</span>
                </div>
                {Object.entries(FORMAT_OPTIONS[memberType] || {}).map(([key, values]) => (
                  <SelectControl
                    key={key}
                    label={key.replaceAll("_", " ")}
                    value={formatFilters[key] || values[0]}
                    options={values}
                    onChange={(value) => setFormatValue(key, value)}
                  />
                ))}
                <button className="escouade-restore-defaults-button" type="button" onClick={restoreCurrentFormatDefaults}>
                  Restore defaults
                </button>
              </div>

              <div className="escouade-format-group escouade-table-setup">
                <div className="escouade-format-header">
                  <span>Production table setup</span>
                </div>
                <SelectControl
                  label="Output target"
                  value={outputTarget}
                  options={uniqueOptions(OPTIONS.outputTarget, outputTarget)}
                  onChange={(value) => {
                    setOutputTarget(value);
                    markSetupTouched("output_target");
                  }}
                />
                <div className="escouade-control full">
                  <label>Columns</label>
                  <textarea
                    value={productionColumnsText}
                    rows={4}
                    placeholder={"Title\nImage\nHeadline\nSubheadline\nCaption"}
                    onChange={(event) => {
                      setProductionColumnsText(event.target.value);
                      if (event.target.value.trim()) markSetupTouched("production_columns");
                    }}
                  />
                </div>
                <div className="escouade-control full">
                  <label>Fixed fields</label>
                  <textarea
                    value={fixedFieldsText}
                    rows={3}
                    placeholder={"Headline: Guardrail of the Week\nImage: "}
                    onChange={(event) => {
                      setFixedFieldsText(event.target.value);
                      if (event.target.value.trim()) markSetupTouched("fixed_fields");
                    }}
                  />
                </div>
                <div className="escouade-control full">
                  <label>Variable fields</label>
                  <textarea
                    value={variableFieldsText}
                    rows={3}
                    placeholder={"Subheadline\nCaption"}
                    onChange={(event) => {
                      setVariableFieldsText(event.target.value);
                      if (event.target.value.trim()) markSetupTouched("variable_fields");
                    }}
                  />
                </div>
                <div className="escouade-control full">
                  <label>Media placeholders</label>
                  <textarea
                    value={mediaPlaceholdersText}
                    rows={2}
                    placeholder={"Image\nVideo"}
                    onChange={(event) => {
                      setMediaPlaceholdersText(event.target.value);
                      if (event.target.value.trim()) markSetupTouched("media_placeholders");
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={[
        "escouade-output-panel",
        "is-panel-both",
        areSidebarsCollapsed ? "is-sidebars-collapsed" : "",
        !batch ? "is-no-batch" : "",
      ].filter(Boolean).join(" ")}>
        {error && (
          <div className="escouade-status is-error">
            {error}
          </div>
        )}

        {showChatPanel && (
          <div className="escouade-chat-panel">
            <div className="escouade-chat-messages" aria-live="polite" ref={chatMessagesRef}>
              {selectedCount > 0 && (
                <div className="escouade-chat-selection-note">
                  {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
                </div>
              )}
              {isChatLoading && (
                <div className="escouade-chat-message is-assistant is-loading">
                  <Loader2 className="spin" size={14} />
                  Loading conversation...
                </div>
              )}
              {chatMessages.map((chatMessage) => (
                <div className={`escouade-chat-message is-${chatMessage.role}`} key={chatMessage.id}>
                  {renderEscouadeChatContent(chatMessage.content)}
                </div>
              ))}
              {isChatBusy && (
                <div className="escouade-chat-message is-assistant is-loading">
                  <Loader2 className="spin" size={14} />
                  {chatBusyMessage}
                </div>
              )}
            </div>
            <div className="escouade-command-row">
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder={chatPlaceholder}
                disabled={isChatLoading}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleInstruction();
                  }
                }}
              />
              <button type="button" disabled={!command.trim() || Boolean(pendingAction) || isChatLoading} onClick={() => handleInstruction()}>
                {isChatBusy ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                {sendButtonLabel}
              </button>
            </div>
          </div>
        )}

        {showBatchPanel && batch ? (
          <div className="escouade-batch">
            <div className="escouade-batch-toolbar">
              <div className="escouade-batch-title">
                <strong>Current batch</strong>
              </div>
              <div className="escouade-batch-controls">
                <div className="escouade-compact-counters" aria-label="Batch status counts">
                  <span><strong>{counts.draft || 0}</strong> Draft</span>
                  <span><strong>{counts.needs_revision || 0}</strong> Needs revision</span>
                  <span><strong>{counts.revised || 0}</strong> Revised</span>
                  <span><strong>{counts.approved || 0}</strong> Approved</span>
                  <span><strong>{counts.exported || 0}</strong> Exported</span>
                </div>
                <div className="escouade-actions">
                  {!!tableColumns.length && !!tableRows.length && (
                    <button
                      type="button"
                      aria-label="Open production table"
                      onClick={() => setIsTableModalOpen(true)}
                    >
                      <Maximize2 size={16} />
                      Open
                    </button>
                  )}
                  <button type="button" disabled={!selectedCount || Boolean(pendingAction)} onClick={() => runAction("approve", async () => updateBatch(await approveEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds })))}>
                    {pendingAction === "approve" ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
                    {pendingAction === "approve" ? "Approving..." : "Approve"}
                  </button>
                  <button type="button" disabled={!selectedCount || Boolean(pendingAction)} onClick={() => runAction("reopen", async () => updateBatch(await reopenEscouadeItems({ appSessionToken, batchId: batch.id, itemIds: selectedIds })))}>
                    {pendingAction === "reopen" ? <Loader2 className="spin" size={16} /> : <RotateCcw size={16} />}
                    {pendingAction === "reopen" ? "Reopening..." : "Reopen"}
                  </button>
                  <button type="button" disabled={!approvedCount || Boolean(pendingAction)} onClick={() => runAction("export", async () => {
                    const response = await exportEscouadeCsv({ appSessionToken, batchId: batch.id });
                    markApprovedItemsExported();
                    applyExportWorkflowStatus(response);
                    setStatus(`Approved items exported as ${currentExportLabel}.`);
                  })}>
                    {pendingAction === "export" ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
                    {pendingAction === "export" ? "Exporting..." : "Export"}
                  </button>
                </div>
              </div>
            </div>

            {!!tableColumns.length && !!tableRows.length && (
              <div className="escouade-production-table-card">
                <div className="escouade-production-table-scroll is-preview">
                  <table>
                    <thead>
                      <tr>
                        <th className="escouade-table-select-col">
                          <input
                            ref={setSelectAllCheckboxState}
                            type="checkbox"
                            aria-label="Select all production rows"
                            checked={allActiveSelected}
                            disabled={!selectableCount || Boolean(pendingAction)}
                            onChange={(event) => {
                              if (event.target.checked) {
                                selectAllActiveItems();
                              } else {
                                clearSelectedItems();
                              }
                            }}
                          />
                        </th>
                        {tableColumns.map((column) => (
                          <th key={column.key}>{column.label || column.key}</th>
                        ))}
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          className={isItemSelected(row.item_id) ? "is-selected" : ""}
                          key={row.id || row.item_id || row.post_id}
                        >
                          <td className="escouade-table-select-col">
                            <input
                              type="checkbox"
                              aria-label={`Select ${row.post_id || "production row"}`}
                              checked={isItemSelected(row.item_id)}
                              disabled={row.item_id === undefined || row.item_id === null || Boolean(pendingAction)}
                              onChange={() => toggleItem(row.item_id)}
                            />
                          </td>
                          {tableColumns.map((column) => (
                            <td key={`${row.id || row.post_id}-${column.key}`}>
                              {compactCellValue(row.data?.[column.key])}
                            </td>
                          ))}
                          <td>
                            <span className={`escouade-table-status is-${row.status}`}>
                              {statusLabel(row.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isTableModalOpen && createPortal((
              <div className="escouade-table-modal-backdrop" role="presentation">
                <section className="escouade-table-modal" role="dialog" aria-modal="true" aria-labelledby="escouade-table-title">
                  <div className="escouade-table-modal-header">
                    <div>
                      <strong id="escouade-table-title">Production table</strong>
                      <span>
                        {currentExportLabel} · {tableColumns.length} columns · {tableRows.length} active rows
                        {selectedCount ? ` · ${selectedCount} selected` : ""}
                      </span>
                    </div>
                    <button type="button" aria-label="Close production table" onClick={() => setIsTableModalOpen(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="escouade-production-table-scroll is-modal">
                    <table>
                      <thead>
                        <tr>
                          <th className="escouade-table-select-col">
                            <input
                              ref={setSelectAllCheckboxState}
                              type="checkbox"
                              aria-label="Select all production rows"
                              checked={allActiveSelected}
                              disabled={!selectableCount || Boolean(pendingAction)}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  selectAllActiveItems();
                                } else {
                                  clearSelectedItems();
                                }
                              }}
                            />
                          </th>
                          {tableColumns.map((column) => (
                            <th key={`modal-${column.key}`}>{column.label || column.key}</th>
                          ))}
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row) => (
                          <tr
                            className={isItemSelected(row.item_id) ? "is-selected" : ""}
                            key={`modal-${row.id || row.item_id || row.post_id}`}
                          >
                            <td className="escouade-table-select-col">
                              <input
                                type="checkbox"
                                aria-label={`Select ${row.post_id || "production row"}`}
                                checked={isItemSelected(row.item_id)}
                                disabled={row.item_id === undefined || row.item_id === null || Boolean(pendingAction)}
                                onChange={() => toggleItem(row.item_id)}
                              />
                            </td>
                            {tableColumns.map((column) => (
                              <td key={`modal-${row.id || row.post_id}-${column.key}`}>
                                {compactCellValue(row.data?.[column.key])}
                              </td>
                            ))}
                            <td>
                              <span className={`escouade-table-status is-${row.status}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ), document.body)}
          </div>
        ) : showBatchPanel ? (
          <div className={(pendingAction === "generate" || isWorkspaceLoading) ? "escouade-empty-state is-generating" : "escouade-empty-state"}>
            {(pendingAction === "generate" || isWorkspaceLoading) && <Loader2 className="spin" size={24} />}
            <strong>
              {isWorkspaceLoading
                ? "Loading current batch..."
                : pendingAction === "generate"
                  ? "Generating your batch..."
                  : "No batch generated yet"}
            </strong>
            <span>
              {isWorkspaceLoading
                ? "Escouade is checking for the latest saved batch and restoring the workspace."
                : pendingAction === "generate"
                ? "Escouade is using the selected brief, filters, and saved strategy context to create draft items."
                : "Choose a member, set the production filters, and generate a draft batch."}
            </span>
          </div>
        ) : null}
      </div>
    </section>
    {areSidebarsCollapsed && createPortal(setupToggleButton, document.body)}
    </>
  );
}
