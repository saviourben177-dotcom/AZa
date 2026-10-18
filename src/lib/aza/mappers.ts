import type { Opportunity as PrototypeOpportunity, Idea as PrototypeIdea } from "@/lib/aza-data";

export function mapDbOpportunityToPrototype(
  o: any,
  isSaved = false,
): PrototypeOpportunity {
  // A missing deadline means "no deadline" / rolling — it must not be
  // rendered as a real number of days, which previously defaulted every
  // such row to exactly 30 and made coincidental runs of real opportunities
  // (all with null deadline) look identical and suspicious.
  const daysLeft = o.deadline
    ? Math.max(0, Math.ceil((new Date(o.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

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
    // Only a real curator_verified flag counts as verified — previously
    // this defaulted to true whenever the column was absent, so every
    // real (unverified) opportunity still showed a verified badge.
    verified: o.curator_verified ?? false,
    category: o.category ? o.category.charAt(0).toUpperCase() + o.category.slice(1).replace("_", " ") : "Grant",
    location: o.location || "Nigeria",
    daysLeft,
    amount: o.amount_display || undefined,
    summary: o.summary || o.description || "",
    // No invented default — real missing eligibility is shown as
    // genuinely unspecified, not a plausible-sounding made-up line.
    eligibility: o.eligibility || null,
    applyUrl: o.apply_url || null,
    saved: isSaved,
  };
}

export function mapDbIdeaToPrototype(i: any): PrototypeIdea {
  const hoursAgo = Math.max(
    1,
    Math.round((Date.now() - new Date(i.created_at || Date.now()).getTime()) / (1000 * 60 * 60)),
  );

  // Real ideas carry a real Supabase user id in author_id. If the query
  // joined profiles (or author_name/author_avatar_url was attached
  // manually, e.g. on the public profile page where we already know
  // the author), pass that through so AuthorLine can show/link the
  // real person instead of falling back to the mock `people` dict.
  const joinedProfile = i.profiles ?? i.author;
  const authorName: string | undefined =
    i.author_name ?? (typeof joinedProfile === "object" ? joinedProfile?.full_name : undefined) ?? undefined;
  const authorAvatarUrl: string | null | undefined =
    i.author_avatar_url ?? (typeof joinedProfile === "object" ? joinedProfile?.avatar_url : undefined);

  return {
    id: i.id,
    // Real ideas carry their author in user_id (not author_id — that
    // field was wrong and silently fell back to mock data for every
    // real idea; see mapper fix notes).
    author: i.user_id || i.author_id || "ada",
    authorName,
    authorAvatarUrl,
    isUpvoted: i.is_upvoted ?? false,
    isSaved: i.is_saved ?? false,
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
