"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { Database } from "@/lib/supabase/database.types";

export type ReportContentType = "message" | "idea" | "idea_comment";

type ReportReason = Database["public"]["Enums"]["report_reason"];

// Maps the human-readable labels shown in report-sheet.tsx to the DB's
// report_reason enum. The labels were previously sent as-is to the
// `reason` column, which only accepts the enum values below — every
// report submitted through this path was failing silently (the UI caught
// the resulting error and showed "Couldn't send report", but nothing was
// ever actually saved). This map is the fix; the UI's displayed labels
// are unchanged.
const REASON_LABEL_TO_ENUM: Record<string, ReportReason> = {
  "Spam or scam": "spam",
  "Harassment or bullying": "harassment_or_bullying",
  "Hate speech or discrimination": "hate_speech",
  "Inappropriate content": "inappropriate_content",
  "Misinformation": "misinformation",
  "Other": "other",
};

export async function createReport(input: {
  contentType: ReportContentType;
  contentId: string;
  reason: string;
  details?: string;
}) {
  const reasonEnum = REASON_LABEL_TO_ENUM[input.reason];
  if (!reasonEnum) throw new Error("Choose a valid reason");
  if (!input.contentId) throw new Error("This content is unavailable");
  if (input.details && input.details.length > 1000) throw new Error("Details are too long");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in to report content");

  let reportedUserId: string;
  let contentPreview: string;

  if (input.contentType === "message") {
    const { data, error } = await supabase
      .from("messages")
      .select("sender_id, body")
      .eq("id", input.contentId)
      .single();
    if (error || !data) throw new Error("Message not found");
    reportedUserId = data.sender_id;
    contentPreview = data.body;
  } else if (input.contentType === "idea") {
    const { data, error } = await supabase
      .from("ideas")
      .select("user_id, title, description")
      .eq("id", input.contentId)
      .single();
    if (error || !data) throw new Error("Post not found");
    reportedUserId = data.user_id;
    contentPreview = `${data.title}\n${data.description}`;
  } else {
    const { data, error } = await supabase
      .from("idea_comments")
      .select("user_id, body")
      .eq("id", input.contentId)
      .single();
    if (error || !data) throw new Error("Comment not found");
    reportedUserId = data.user_id;
    contentPreview = data.body;
  }

  if (reportedUserId === user.id) throw new Error("You cannot report your own content");

  const { error } = await supabase.from("reports")
    .insert({
      content_type: input.contentType,
      content_id: input.contentId,
      content_preview: contentPreview.slice(0, 2000),
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      reason: reasonEnum,
      details: input.details?.trim() || null,
    });
  if (error) throw new Error(error.message);
}

export async function updateReportStatus(reportId: string, status: "reviewed" | "dismissed") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "curator" && profile?.role !== "admin") throw new Error("Not authorized");

  const { error } = await supabase.from("reports")
    .update({ status })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
  revalidatePath("/curator/reports");
}
