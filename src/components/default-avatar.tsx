/**
 * Default person placeholder avatar, in the style used by TikTok/Facebook for
 * users without a profile photo: a flat silhouette (head + shoulders) on a
 * neutral filled circle. Themed with the app's ink/paper tokens so it adapts
 * to light/dark mode automatically.
 */
export default function DefaultAvatar({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Default profile picture"
    >
      <circle cx="24" cy="24" r="24" className="fill-paper-dim" />
      <circle cx="24" cy="19.5" r="7.5" className="fill-ink/25" />
      <path
        d="M24 29c-8.28 0-15 5.03-15 11.23V42a2 2 0 0 0 2 2h26a2 2 0 0 0 2-2v-1.77C39 34.03 32.28 29 24 29Z"
        className="fill-ink/25"
      />
    </svg>
  );
}
