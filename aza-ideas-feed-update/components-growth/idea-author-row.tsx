import { relativeTime } from "@/lib/types";

export default function IdeaAuthorRow({
  name,
  avatarUrl,
  createdAt,
  size = "sm",
}: {
  name: string;
  avatarUrl: string | null | undefined;
  createdAt: string;
  size?: "sm" | "md";
}) {
  const dims = size === "md" ? "h-11 w-11" : "h-9 w-9";
  const nameSize = size === "md" ? "text-[14.5px]" : "text-[13.5px]";

  return (
    <div className="flex items-center gap-2.5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className={`${dims} shrink-0 rounded-full object-cover ring-1 ring-line-strong`}
        />
      ) : (
        <div
          className={`${dims} flex shrink-0 items-center justify-center rounded-full bg-aza-light text-aza ring-1 ring-line-strong`}
        >
          <span className={`font-bold ${size === "md" ? "text-[15px]" : "text-[13px]"}`}>
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className={`${nameSize} font-bold leading-tight text-ink`}>{name}</p>
        <p className="text-[11px] font-medium leading-tight text-ink/45">{relativeTime(createdAt)}</p>
      </div>
    </div>
  );
}
