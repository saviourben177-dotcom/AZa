// Featured opportunities: a small, hand-maintained list shown in its own
// section on Discover, separate from the main API-sourced `opportunities`
// pipeline. Not stored in the database — edit this file to add, remove,
// or update an entry. `id` is a stable slug used as the key for status
// tracking (featured_opportunity_status) and click logging
// (featured_opportunity_clicks), so don't change an existing id once it's
// shipped — that would orphan any status/clicks already recorded against
// the old id.
//
// `url` is opened exactly as written, with no rewriting — referral params
// on the Mercor and Ethos links must survive untouched.

export type FeaturedLinkType = "referral" | "direct";

export interface FeaturedOpportunity {
  id: string;
  title: string;
  description: string;
  categoryTag: string;
  url: string;
  linkType: FeaturedLinkType;
  /** Initials shown in the logo tile when no logo image is set below. */
  mark: string;
}

export const FEATURED_OPPORTUNITIES: FeaturedOpportunity[] = [
  {
    id: "mercor",
    title: "Mercor",
    description: "AI-vetted freelance and contract work matching you to roles at top AI labs and startups.",
    categoryTag: "AI/Training",
    url: "https://t.mercor.com/ONMzu",
    linkType: "referral",
    mark: "ME",
  },
  {
    id: "ethos",
    title: "Ethos",
    description: "Freelance AI training and data work — earn by helping improve AI models.",
    categoryTag: "AI/Training",
    url: "https://agent.askethos.com/refer/a4pvuzpm633r",
    linkType: "referral",
    mark: "ET",
  },
  {
    id: "micro1",
    title: "micro1",
    description: "AI-matched remote tech roles, from engineering to AI training work.",
    categoryTag: "AI/Training",
    url: "https://talent.micro1.ai",
    linkType: "direct",
    mark: "M1",
  },
  {
    id: "outlier",
    title: "Outlier",
    description: "Paid freelance work training AI models — flexible hours, remote.",
    categoryTag: "AI/Training",
    url: "https://outlier.ai",
    linkType: "direct",
    mark: "OU",
  },
  {
    id: "surge-ai",
    title: "Surge AI",
    description: "High-quality data labeling and AI training projects for skilled freelancers.",
    categoryTag: "AI/Training",
    url: "https://surgehq.ai",
    linkType: "direct",
    mark: "SU",
  },
  {
    id: "handshake-ai",
    title: "Handshake AI",
    description: "Connects skilled professionals with AI training and evaluation gigs.",
    categoryTag: "AI/Training",
    url: "https://handshake.ai",
    linkType: "direct",
    mark: "HA",
  },
];

export function getFeaturedOpportunity(id: string): FeaturedOpportunity | undefined {
  return FEATURED_OPPORTUNITIES.find((f) => f.id === id);
}
