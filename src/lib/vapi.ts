import Vapi from "@vapi-ai/web";

export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_KEY!);

export type Persona = {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  personality: string;
  setupLine: string;
};

export const PERSONAS: Record<string, Persona> = {
  sarah: {
    id: "sarah",
    name: "Sarah K.",
    title: "CFO",
    company: "TechVentures Inc.",
    industry: "Technology",
    personality: "Skeptical, busy, cuts to the chase",
    setupLine:
      "Sarah is the CFO at a $50M tech company. She's skeptical of cold callers, busy, and will interrupt you if she thinks your call is a waste of her time. You have 30 seconds. Go.",
  },
  marcus: {
    id: "marcus",
    name: "Marcus T.",
    title: "VP of Operations",
    company: "Private Equity Partners",
    industry: "Finance",
    personality: "Professional, guarded, asks hard questions",
    setupLine:
      "Marcus is the VP of Ops at a PE firm. He's professional but guarded. He'll probe your credibility before engaging. 30 seconds to qualify yourself. Go.",
  },
  priya: {
    id: "priya",
    name: "Priya M.",
    title: "Landlord",
    company: "Independent",
    industry: "Real Estate",
    personality: "Busy, practical, no-nonsense",
    setupLine:
      "Priya owns 12 rental units and gets 10 cold calls a week. She's practical and will hang up if you sound like everyone else. 30 seconds to stand out. Go.",
  },
};

export function getPersona(id: string): Persona {
  return PERSONAS[id] || PERSONAS.sarah;
}
