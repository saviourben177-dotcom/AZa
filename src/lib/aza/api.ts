import { askGrowthAssistant, generateBusinessPlan } from "./ai.functions";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Payload = Record<string, FormDataEntryValue>;
export type ReportType = "post" | "comment" | "message" | "opportunity" | "business" | "idea" | "idea_comment";
export type NewReport = {
  report_type: ReportType;
  target_id: string;
  reported_user_id: string;
  content: string;
  reason: string;
  notes: string | null;
};

export const api = {
  // auth
  signIn: async (d: Payload) => {
    const supabase = createClient();
    const email = String(d.email ?? "");
    const password = String(d.password ?? "");
    if (email && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    }
    return d;
  },

  signUp: async (d: Payload) => {
    const supabase = createClient();
    const email = String(d.email ?? "");
    const password = String(d.password ?? "");
    if (email && password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: String(d.name ?? ""),
          },
        },
      });
      if (error) throw new Error(error.message);
    }
    return d;
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return true;
  },

  completeOnboarding: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          full_name: d.name ? String(d.name) : undefined,
          job_title: d.role ? String(d.role) : undefined,
          exact_location: d.location ? String(d.location) : undefined,
        })
        .eq("id", user.id);
    }
    return d;
  },

  deleteAccount: async () => {
    try {
      await fetch("/api/account/delete", { method: "POST" });
    } catch {
      // ignore
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    return true;
  },

  // profile & CV
  updateProfile: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          full_name: d.name ? String(d.name) : undefined,
          job_title: d.role ? String(d.role) : undefined,
          exact_location: d.location ? String(d.location) : undefined,
        })
        .eq("id", user.id);
    }
    return d;
  },

  updateCv: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("cv_profiles")
        .upsert(
          {
            user_id: user.id,
            summary: d.summary ? String(d.summary) : null,
          },
          { onConflict: "user_id" },
        );
    }
    return d;
  },

  tailorCv: async (opportunityId: string) => {
    return { opportunityId, summary: "Tailored summary generated successfully" };
  },

  updateSettings: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("id", user.id);
    }
    return d;
  },

  // opportunities
  saveOpportunity: async (id: string, saved: boolean) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      if (saved) {
        await supabase
          .from("saved_opportunities")
          .insert({ user_id: user.id, opportunity_id: id });
      } else {
        await supabase
          .from("saved_opportunities")
          .delete()
          .eq("user_id", user.id)
          .eq("opportunity_id", id);
      }
    }
    return { id, saved };
  },

  setApplicationStatus: async (id: string, status: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const validStatus = (["saved", "applied", "interviewing", "rejected", "accepted"].includes(status.toLowerCase())
        ? status.toLowerCase()
        : "saved") as any;
      await supabase.from("saved_opportunities").upsert(
        {
          user_id: user.id,
          opportunity_id: id,
          status: validStatus,
        },
        { onConflict: "user_id,opportunity_id" },
      );
    }
    return { id, status };
  },

  // growth
  createIdea: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("ideas").insert({
        user_id: user.id,
        title: String(d.title ?? ""),
        description: String(d.pitch ?? d.description ?? ""),
        category: d.stage ? String(d.stage) : null,
        tags: d.ask ? [String(d.ask)] : [],
      });
    }
    return d;
  },

  deleteIdea: async (id: string) => {
    const supabase = createClient();
    await supabase.from("ideas").delete().eq("id", id);
    return id;
  },

  setIdeaStage: async (id: string, stage: string) => {
    const supabase = createClient();
    await supabase.from("ideas").update({ stage }).eq("id", id);
    return { id, stage };
  },

  addComment: async (ideaId: string, body: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("idea_comments").insert({
        idea_id: ideaId,
        user_id: user.id,
        body,
      });
    }
    return { ideaId, body };
  },

  deleteComment: async (id: string) => {
    const supabase = createClient();
    await supabase.from("idea_comments").delete().eq("id", id);
    return id;
  },

  addSkill: async (skillId: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: skillId,
      });
    }
    return skillId;
  },

  updateSkillProgress: async (skillId: string, percent: number) => {
    return { skillId, percent };
  },

  // Groq via server action
  askAssistant: (question: string) => askGrowthAssistant({ question }),

  // business
  createBusiness: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("businesses").insert({
        created_by: user.id,
        name: String(d.name ?? ""),
        category: String(d.category ?? "Services"),
        location: String(d.location ?? ""),
        phone: d.phone ? String(d.phone) : null,
        description: String(d.description ?? ""),
      });
    }
    return d;
  },

  rateBusiness: async (id: string, stars: number, comment: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("business_ratings").upsert(
        {
          business_id: id,
          user_id: user.id,
          stars,
          comment,
        },
        { onConflict: "business_id,user_id" },
      );
    }
    return { id, stars, comment };
  },

  createListing: async (d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("marketplace_listings").insert({
        user_id: user.id,
        title: String(d.title ?? ""),
        category: String(d.category ?? "Other"),
        listing_type: "sell",
        price_kobo: d.price ? Number(d.price) * 100 : 0,
        description: String(d.description ?? ""),
        location: String(d.location ?? "Nigeria"),
        contact_phone: d.phone ? String(d.phone) : null,
      });
    }
    return d;
  },

  deleteListing: async (id: string) => {
    const supabase = createClient();
    await supabase.from("marketplace_listings").delete().eq("id", id);
    return id;
  },

  generateBusinessPlan: (d: Payload) =>
    generateBusinessPlan({
      name: String(d["name"] ?? ""),
      industry: String(d["industry"] ?? ""),
      problem: String(d["problem"] ?? ""),
      customers: String(d["customers"] ?? ""),
      budget: String(d["budget"] ?? ""),
    }),

  // team finder
  sendJoinRequest: async (ideaId: string, d: Payload) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("join_requests").insert({
        idea_id: ideaId,
        requester_id: user.id,
        role_id: String(d.role_id ?? d.role ?? "general"),
        message: String(d.message ?? ""),
        portfolio_url: d.portfolio ? String(d.portfolio) : null,
        status: "pending",
      });
    }
    return { ideaId, ...d };
  },

  respondToRequest: async (id: string, status: "accepted" | "declined") => {
    const supabase = createClient();
    await supabase.from("join_requests").update({ status, responded_at: new Date().toISOString() }).eq("id", id);
    return { id, status };
  },

  sendMessage: async (requestId: string, body: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("messages").insert({
        conversation_id: requestId,
        sender_id: user.id,
        body,
      });
    }
    return { requestId, body };
  },

  // notifications
  markAllRead: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    }
    return true;
  },

  // reports
  createReport: async (r: NewReport) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // src/components/aza/report.tsx's reportReasons values ("harassment",
      // "hate") don't match the DB's report_reason enum
      // ("harassment_or_bullying", "hate_speech") — this was being sent
      // as-is and would fail the insert for those two reasons. The rest
      // already match the enum, so this map only needs those two entries.
      const reasonMap: Record<string, string> = {
        harassment: "harassment_or_bullying",
        hate: "hate_speech",
      };
      await supabase.from("reports").insert({
        reporter_id: user.id,
        content_type:
          r.report_type === "post"
            ? "idea"
            : r.report_type === "comment"
              ? "idea_comment"
              : "message",
        content_id: r.target_id,
        reason: (reasonMap[r.reason] ?? r.reason) as Database["public"]["Enums"]["report_reason"],
        details: r.notes ?? r.content,
        reported_user_id: r.reported_user_id || user.id,
        content_preview: r.content,
      });
    }
    return { ...r, created_at: new Date().toISOString() };
  },

  resolveReport: async (id: string, action: "dismiss" | "remove") => {
    const supabase = createClient();
    await supabase
      .from("reports")
      .update({ status: action === "dismiss" ? "dismissed" : "reviewed" })
      .eq("id", id);
    return { id, action };
  },

  // curator / admin
  saveOpportunityAdmin: async (d: Payload) => {
    const supabase = createClient();
    await supabase.from("opportunities").insert({
      title: String(d.title ?? ""),
      org: String(d.org ?? d.organization ?? "Aza"),
      category: "grant",
      apply_url: String(d.url ?? d.apply_url ?? "https://example.com"),
      description: String(d.description ?? ""),
      location: String(d.location ?? "Remote"),
      remote: true,
      curator_verified: true,
      tags: d.tags ? String(d.tags).split(",").map((s) => s.trim()) : [],
    });
    return d;
  },

  saveCuratorItem: async (kind: string, d: Payload) => {
    return { kind, ...d };
  },

  moderate: async (kind: string, id: string, action: "approve" | "reject" | "remove") => {
    const supabase = createClient();
    if (kind === "business") {
      await supabase.from("businesses").update({ curator_verified: action === "approve" }).eq("id", id);
    } else if (kind === "listing") {
      await supabase.from("marketplace_listings").update({ status: action === "approve" ? "active" : "closed" }).eq("id", id);
    }
    return { kind, id, action };
  },
};
