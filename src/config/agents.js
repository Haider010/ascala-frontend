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
      "Hi, I am Molly\u2122, your ideal client strategist!\n\nI help you figure out who your ideal client really is: the person most likely to need your offer, care about your message, and eventually buy.\n\nNo need to have it all figured out. Type \u201cGo\u201d and I\u2019ll ask you the right questions.",
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
      "Hi, I'm Sacha\u2122.\n\nNow that Molly and Brandy have helped define your audience, positioning and brand foundation, I'll help transform that information into a complete social media strategy aligned with your business goals.\n\nI'll review your existing content and social media activity, identify opportunities, and help build your content pillars, themes, recurring series, campaigns, posting rhythm and content calendar.\n\nTogether, we'll create scalable content systems, bulk-production opportunities and repurposing strategies that make content creation easier, more consistent and more effective.\n\nMy goal is simple: help you stop posting randomly and start building a strategic content engine that supports visibility, engagement, leads and business growth.",
  },
};

export const WORKSPACES = {
  ...AGENTS,
  brandboard: {
    id: "brandboard",
    name: "BrandBoard 100X\u2122",
    role: "Brand Guidelines",
    accent: "#d6a6ff",
    accentSoft: "#7b2cff",
    mode: "Brand Guidelines",
    specialty: "Premium identity system and source of truth",
    prompt: "Generate premium brand guidelines from Molly and Brandy.",
    welcome: "BrandBoard 100X\u2122 is ready to turn audience and brand voice into a client-facing brand guidelines system.",
    kind: "brandboard",
  },
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
  usage: {
    id: "usage",
    name: "Usage",
    role: "Token Analytics",
    accent: "#a78bfa",
    accentSoft: "#6d28d9",
    mode: "Token Analytics",
    specialty: "Monthly input and output token tracking",
    prompt: "Review token consumption.",
    welcome: "Token usage is ready.",
    kind: "utility",
  },
};

export const DEFAULT_AGENT_ID = "molly";

export const AGENT_WORKFLOW = [
  { id: "molly", name: "Molly\u2122", role: "Audience Intelligence", available: true },
  { id: "brandy", name: "Brandy\u2122", role: "Brand Voice", available: true },
  { id: "brandboard", name: "BrandBoard 100X\u2122", role: "Brand Guidelines", available: true },
  { id: "sacha", name: "Sacha\u2122", role: "Strategy Director", available: true },
  { id: "escouade", name: "Escouade\u2122", role: "AI Production Team", available: true },
  { id: "uply", name: "Uply\u2122", role: "Publishing Assistant", available: true },
];
