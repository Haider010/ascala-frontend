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
};

export const DEFAULT_AGENT_ID = "molly";
