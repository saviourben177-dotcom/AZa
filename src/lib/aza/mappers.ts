import type { Opportunity as PrototypeOpportunity, Idea as PrototypeIdea } from "@/lib/aza-data";

export function mapDbOpportunityToPrototype(
  o: any,
  isSaved = false,
): PrototypeOpportunity {
  const daysLeft = o.deadline
    ? Math.max(0, Math.ceil((new Date(o.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  const orgMark = (o.org || "AZ")
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w.charAt(0).toUpperCase())
    .join("") || "AZ";

  return {
    id: o.id,
    title: o.title,
    org: o.org,
    orgMark,
    verified: o.curator_verified ?? o.verified ?? true,
    category: o.category ? o.category.charAt(0).toUpperCase() + o.category.slice(1).replace("_", " ") : "Grant",
    location: o.location || "Nigeria",
    daysLeft,
    amount: o.amount_display || undefined,
    summary: o.summary || o.description || "",
    eligibility: o.eligibility || "Open to all qualified applicants.",
    applyUrl: o.apply_url || "#",
    saved: isSaved,
  };
}

export function mapDbIdeaToPrototype(i: any): PrototypeIdea {
  const hoursAgo = Math.max(
    1,
    Math.round((Date.now() - new Date(i.created_at || Date.now()).getTime()) / (1000 * 60 * 60)),
  );

  return {
    id: i.id,
    author: i.author_id || "ada",
    hoursAgo,
    ask: i.looking_for_collaborators ? "Seeking Co-Founder" : "Feedback Wanted",
    stage: i.stage || "Validating",
    pitch: i.description || i.title || "",
    upvotes: i.upvotes_count || 0,
    comments: (i.comments || []).map((c: any) => ({
      id: c.id,
      author: c.user_id || "ada",
      body: c.body || c.content || "",
      hoursAgo: Math.max(
        1,
        Math.round((Date.now() - new Date(c.created_at || Date.now()).getTime()) / (1000 * 60 * 60)),
      ),
      replies: (c.replies || []).map((r: any) => ({
        id: r.id,
        author: r.user_id || "ada",
        body: r.body || r.content || "",
        hoursAgo: Math.max(
          1,
          Math.round((Date.now() - new Date(r.created_at || Date.now()).getTime()) / (1000 * 60 * 60)),
        ),
      })),
    })),
  };
}
