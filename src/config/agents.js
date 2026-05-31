export const AGENTS = {
  molly: {
    id: "molly",
    name: "Molly\u2122",
    role: "Audience Intelligence",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/08d8a0f2-afb8-4e80-91d6-0efa25d5f85e/chat",
    accent: "#b45cff",
    accentSoft: "#6d28d9",
    mode: "Audience Intelligence",
    specialty: "Research, segmentation, audience insight",
    prompt: "Ask Molly about audience research, customer psychology, or market insight.",
    welcome:
      "Molly\u2122 is online. Send audience context, customer notes, or market details and I will map the intelligence.",
  },
  brandy: {
    id: "brandy",
    name: "Brandy\u2122",
    role: "Brand Voice",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/c65bf43d-45d3-42b5-9333-65e02bcd8835/chat",
    accent: "#8f3cff",
    accentSoft: "#4c1d95",
    mode: "Brand Voice",
    specialty: "Messaging, positioning, creative direction",
    prompt: "Ask Brandy about brand voice, client context, or campaign messaging.",
    welcome:
      "Brandy\u2122 is online. Send the offer, audience, or campaign context and I will shape the brand direction.",
  },
  sacha: {
    id: "sacha",
    name: "Sacha\u2122",
    role: "Strategy Director",
    endpoint:
      "https://primary-production-b3410.up.railway.app/webhook/337039eb-d240-4139-965f-75ef3a625b3b/chat",
    accent: "#c084fc",
    accentSoft: "#6b21a8",
    mode: "Strategy Director",
    specialty: "Campaign strategy, direction, execution planning",
    prompt: "Ask Sacha to turn approved strategy and brand voice into a clear execution direction.",
    welcome:
      "Sacha\u2122 is online. Once Molly and Brandy have locked the foundation, I will shape the strategic direction for execution.",
  },
};

export const WORKSPACES = {
  ...AGENTS,
  escouade: {
    id: "escouade",
    name: "Escouade\u2122",
    role: "AI Production Team",
    accent: "#d8b4fe",
    accentSoft: "#7e22ce",
    mode: "AI Production Team",
    specialty: "Batch content generation, approval, export",
    prompt: "Set up a content batch for Escouade.",
    welcome: "Escouade\u2122 is ready to turn approved strategy into production-ready content batches.",
    kind: "production",
  },
  uply: {
    id: "uply",
    name: "Uply\u2122",
    role: "Publishing Assistant",
    accent: "#e9d5ff",
    accentSoft: "#9333ea",
    mode: "Publishing Assistant",
    specialty: "Publishing workflow and distribution",
    prompt: "Prepare approved content for publishing.",
    welcome: "Uply\u2122 is coming soon.",
    kind: "coming-soon",
  },
};

export const DEFAULT_AGENT_ID = "molly";

export const AGENT_WORKFLOW = [
  { id: "molly", name: "Molly\u2122", role: "Audience Intelligence", available: true },
  { id: "brandy", name: "Brandy\u2122", role: "Brand Voice", available: true },
  { id: "sacha", name: "Sacha\u2122", role: "Strategy Director", available: true },
  { id: "escouade", name: "Escouade\u2122", role: "AI Production Team", available: true },
  { id: "uply", name: "Uply\u2122", role: "Publishing Assistant", available: true },
];
