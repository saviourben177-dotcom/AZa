# Aza fixes — chat composer + opportunity data quality

Two files changed, nothing else touched:
- `src/components/team-finder/message-thread.tsx` — chat composer (Enter/newline, multiline, Android)
- `src/lib/ingest/sources.ts` — opportunity ingestion (no more fake deadlines, senior-role filtering)

## How to apply

From the root of your local `AZa` repo:

### Option A — overwrite the files directly (simplest)
Unzip this package, then copy the two files over your repo, preserving paths:

```
cp -r src/* /path/to/your/AZa/src/
```

(Or just open the two files in this zip and paste their contents over the matching files in your repo — they're small.)

Then:
```
git add -A
git commit -m "Fix chat composer Enter/multiline behavior; stop fabricating opportunity deadlines"
git push
```

### Option B — apply as a patch
If you'd rather use the included `aza-fixes.patch`:

```
cd /path/to/your/AZa
git apply aza-fixes.patch
git add -A
git commit -m "Fix chat composer Enter/multiline behavior; stop fabricating opportunity deadlines"
git push
```

If `git apply` complains about context mismatches, your local copy has likely drifted from the `main` branch this was built against — use Option A instead.

## What changed, briefly

**Chat composer**: the single-line `<input>` is now a `<textarea>` that grows as you type (caps at ~160px then scrolls inside itself), resets to one line after sending. Enter inserts a newline; only the Send button sends. No `onKeyDown` logic was added — the fix relies on `<textarea>`'s native behavior specifically to avoid Android's Enter-key/IME composition quirks (keyCode 229), which is where a custom keydown handler would have been fragile.

**Opportunity ingestion**: every source that previously faked a deadline (`toISO(in92Days())`, i.e. "92 days from today") when the real source had no deadline now leaves `deadline: null` instead — the app's UI already renders that honestly as "No deadline." Himalayas and Jobicy jobs now also get filtered by the source APIs' own seniority field, dropping Director/Executive/VP/C-level roles so the feed stays matched to a youth/student audience. Full detail in the code comments at each change.

## Testing already done (see prior message for full detail)
- `tsc --noEmit`: clean
- `eslint` on both files: clean
- `next build`: blocked only by this sandbox's network allowlist on the font-fetch step (unrelated file, untouched)
- Ingest logic tested against mocked API responses shaped like Himalayas/Jobicy/Devpost/Scholars4Dev/Grant Desk's real documented payloads — all pass
- Chat composer: verified by static analysis/compile only — **please do the on-device Enter/multiline/Android check from my last message** and report back if anything misbehaves
