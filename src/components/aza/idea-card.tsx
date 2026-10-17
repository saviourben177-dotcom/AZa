"use client";

import Link from "next/link";
import { Bookmark, ChevronUp, MessageCircle, Share2, Target } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Idea } from "@/lib/aza-data";
import { toggleUpvote, toggleSaveIdea } from "@/lib/actions/ideas";
import { AuthorLine, Tag } from "./ui";
import { ReportButton } from "./report";

function countComments(i: Idea) {
  return i.comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
}

export function IdeaActions({ idea, full }: { idea: Idea; full?: boolean }) {
  const [up, setUp] = useState(idea.isUpvoted ?? false);
  const [upvotes, setUpvotes] = useState(idea.upvotes);
  const [saved, setSaved] = useState(idea.isSaved ?? false);
  const [isPending, startTransition] = useTransition();
  const isRealIdea = idea.isUpvoted !== undefined; // real ideas always set this via the mapper
  const btn = "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground";

  function handleUpvote() {
    if (!isRealIdea) {
      setUp((v) => !v);
      return;
    }
    const next = !up;
    setUp(next);
    setUpvotes((v) => v + (next ? 1 : -1));
    startTransition(async () => {
      try {
        await toggleUpvote(idea.id, up);
      } catch (err) {
        setUp(up);
        setUpvotes((v) => v + (next ? -1 : 1));
        toast.error(err instanceof Error ? err.message : "Couldn't update your vote");
      }
    });
  }

  function handleSave() {
    if (!isRealIdea) {
      setSaved((v) => !v);
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        await toggleSaveIdea(idea.id, saved);
        toast.success(next ? "Saved" : "Removed from saved");
      } catch (err) {
        setSaved(saved);
        toast.error(err instanceof Error ? err.message : "Couldn't update save");
      }
    });
  }

  return (
    <div className="-ml-2.5 flex items-center gap-1">
      <button type="button" disabled={isPending} aria-pressed={up} onClick={handleUpvote} className={cn(btn, up && "text-primary")}>
        <ChevronUp className="size-4" strokeWidth={2.25} />
        <span className="tabular">{upvotes}</span>
      </button>
      {!full && (
        <Link href={`/growth/ideas/${idea.id}`} className={btn} aria-label="Comments">
          <MessageCircle className="size-4" strokeWidth={2} />
          <span className="tabular">{countComments(idea)}</span>
        </Link>
      )}
      <button type="button" disabled={isPending} aria-pressed={saved} aria-label="Save" onClick={handleSave} className={cn(btn, saved && "text-primary")}>
        <Bookmark className="size-4" strokeWidth={2} fill={saved ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        aria-label="Share"
        className={btn}
        onClick={() => {
          navigator.clipboard?.writeText(`${(typeof window !== "undefined" ? window.location.origin : "")}/growth/ideas/${idea.id}`);
          toast.success("Link copied");
        }}
      >
        <Share2 className="size-4" strokeWidth={2} />
      </button>
      <ReportButton className="ml-auto h-11 min-w-11" target={{ type: "post", id: idea.id, userId: idea.author, content: idea.pitch }} />
    </div>
  );
}

export function IdeaCard({ idea, currentUserId }: { idea: Idea; currentUserId?: string }) {
  return (
    <article className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 md:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <AuthorLine
          id={idea.author}
          hoursAgo={idea.hoursAgo}
          name={idea.authorName}
          avatarUrl={idea.authorAvatarUrl}
          currentUserId={currentUserId}
        />
        <span className="hidden text-xs text-muted-foreground sm:block">{idea.stage}</span>
      </div>
      <div>
        <Tag tone="primary" icon={<Target className="size-3.5" strokeWidth={2} />}>{idea.ask}</Tag>
      </div>
      <Link href={`/growth/ideas/${idea.id}`}
        className="line-clamp-4 rounded-md text-base leading-relaxed text-foreground"
      >
        {idea.pitch}
      </Link>
      <IdeaActions idea={idea} />
    </article>
  );
}
