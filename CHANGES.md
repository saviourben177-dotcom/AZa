# What's in this zip, and why

Final merge: your verified homepage/search/avatar/profile fixes +
splash/icon assets, plus a rebuilt App Guide (7-step tour) and Getting
Started checklist — reconstructed from your own screenshots of the
live deployment, since no zip or patch you had actually contained the
guide's component code (only an import line pointing at it).

## src/app/page.tsx (homepage)
ADDED: `showAppGuide` server check (reads `has_seen_app_guide` from
the signed-in user's profile row) and two component calls —
`<AppGuideGate shouldShow />` (renders nothing when false) and
`<GettingStartedCard />` under the search bar.
FIXED (2026-10-19): "Closing soon" had quietly regressed to a plain
static grid during an earlier merge. Restored the horizontal-scroll
carousel from your verified mockup/patch — `flex snap-x overflow-x-auto`
on mobile (cards at 72% width, swipeable), reverting to a grid at `md:`
breakpoint. Uses the same real `Deadline`/`Tag`/`o.orgMark` data as the
rest of the page — no mock content. `Deadline` and `Tag` added to the
import from `@/components/aza/ui`.

## src/components/aza/getting-started-card.tsx
Unchanged from your verified search-and-getting-started-fix.zip:
checklist under the search bar, 4 steps (profile, save an opportunity,
preview CV, explore Growth Hub), persists progress in localStorage,
dismissible, uses your real design tokens (bg-card, text-primary-strong
etc.) and real routes.

## src/components/app-guide/app-guide-overlay.tsx  (new)
The full 7-step swipeable tour. Content — eyebrow, title, body text for
every step — transcribed exactly from your 8 screenshots of the live
app: Welcome, Discover, CV Builder, Growth Hub (skills), Growth Hub
(ideas), Business Hub, Profile. Matches the screenshots' layout: Skip
button, gradient preview header, step counter ("Step N of 7"), dot
progress, Back/Next, "Done" on the last step. Swipe left/right works
on touch devices, same as Back/Next.

Caveat: your patch files only contained a *diff* against this
component, not the full original file, so this is a clean rebuild
matching the screenshots — not a byte-identical recovery of the old
file. Re-check it against your actual repo (if you still have the
original file anywhere) before assuming every internal detail matches.

## src/components/app-guide/app-guide-gate.tsx  (new)
Thin client wrapper: takes the server-decided `shouldShow` boolean, and
renders AppGuideOverlay only if true, closing it (and not reopening
on its own) once the user finishes or skips.

## src/components/app-guide/replay-guide-row.tsx  (new)
Lets a user reopen the tour on demand, matching the last step's promise
("replay this guide anytime from Profile → App Guide"). Styled with the
same `btn.secondary` class your other settings buttons use.

## src/app/profile/settings/settings-form.tsx
WIRED IN: added a new "App Guide" section (same `rounded-lg border
bg-card p-5 shadow-[var(--shadow-card)]` pattern as the existing
"Profile Privacy" section) between Appearance and Profile Privacy,
containing `<ReplayGuideRow />`. Nothing else in this file changed —
Sign out / Delete account row, Privacy section, imports, all untouched
except the one new import line.

## src/app/profile/settings/page.tsx
Unchanged — carried over as-is so the pair is a complete drop-in.

## src/lib/app-guide-steps.ts  (new)
The 7 steps' content as data, transcribed from your screenshots.

## src/lib/actions/app-guide.ts  (new)
`markGuideSeen()` server action — sets `has_seen_app_guide = true` on
the signed-in user's profile row. Requires that column to exist on
your `profiles` table in Supabase; if it doesn't yet, add it:

```sql
alter table profiles add column has_seen_app_guide boolean not null default false;
```

## src/app/search/page.tsx
Real bug, fixed: category is a Postgres enum column; `ilike` against
it inside `.or()` was rejected by PostgREST, silently failing the
whole query. Category now matched via a separate `.eq()` query and
merged with the text search.

## src/components/aza/ui.tsx (Avatar)
Added `isRealUser` prop: when true and no avatarUrl, renders
DefaultAvatar (the silhouette) instead of falling through to mock
initials.

## src/app/profile/page.tsx
Now passes `avatarUrl` and `isRealUser` to `<Avatar />`, which it
previously omitted entirely.

## android/, resources/
Splash screens + launcher icons, unchanged from your prior verified
zip.

## Not verified
No package.json/node_modules available here, so `tsc`/`next build`
were not run. Every import was checked against files actually present
in your uploads; the app-guide files are new and haven't been checked
against your live Supabase schema beyond the SQL note above. Run a
build before deploying.
