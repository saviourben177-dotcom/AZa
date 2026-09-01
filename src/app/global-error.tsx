"use client";

import { useEffect } from "react";

// This only fires if the root layout itself throws, which is rare — but
// when it does, Next.js skips layout.tsx entirely, so this file has to
// render its own <html>/<body>. No shared styles/fonts are guaranteed to
// be available here, so we keep it plain and inline-styled.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Aza global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#FFFFFF",
          color: "#0A0C0B",
        }}
      >
        <div style={{ fontSize: "32px" }}>⚠️</div>
        <h1 style={{ marginTop: "16px", fontSize: "19px", fontWeight: 800 }}>
          Aza couldn&apos;t load
        </h1>
        <p
          style={{
            marginTop: "8px",
            maxWidth: "320px",
            fontSize: "13.5px",
            lineHeight: 1.5,
            color: "rgba(10,12,11,0.55)",
          }}
        >
          Something went wrong loading the app. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "24px",
            width: "100%",
            maxWidth: "320px",
            borderRadius: "999px",
            background: "#16A35E",
            padding: "14px",
            fontSize: "14.5px",
            fontWeight: 700,
            color: "#FFFFFF",
            border: "none",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ marginTop: "20px", fontSize: "11px", color: "rgba(10,12,11,0.35)" }}>
            Ref: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
