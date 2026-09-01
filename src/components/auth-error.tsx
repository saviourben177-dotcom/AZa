export default function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-card-sm border border-danger/15 bg-danger-light p-3.5"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/15 text-[12px] font-bold text-danger">
        !
      </span>
      <p className="text-[13px] font-medium leading-snug text-danger">
        Sorry, something went wrong. Check your network connection or try
        again.
      </p>
    </div>
  );
}
