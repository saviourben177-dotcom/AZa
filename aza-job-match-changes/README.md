# Job Match Analysis — apply instructions (Termux)

This zip contains only the changed/new files for the standalone Job Match
Analysis feature, plus a full `.patch` of the same changes. Use **either**
the patch (fastest, one command) **or** the manual file copy below — not both.

The Supabase migration has **already been applied live** to the AZA project.
You don't need to run it again unless you're setting up a fresh environment
(e.g. a branch DB) — see step 3.

---

## Option A — apply via patch (recommended)

```bash
cd ~
rm -rf AZa
git clone https://github.com/saviourben177-dotcom/AZa.git
cd AZa
git checkout main

# Copy aza-job-match-changes.zip onto the device first (e.g. into
# ~/storage/downloads/ via Termux:Storage, or however you transfer files),
# then:
unzip ~/storage/downloads/aza-job-match-changes.zip -d ~/aza-job-match-changes

git apply ~/aza-job-match-changes/aza-job-match-changes.patch

npm install
npx tsc --noEmit
npx next build
```

If `git apply` complains about whitespace, try:
```bash
git apply --whitespace=fix ~/aza-job-match-changes/aza-job-match-changes.patch
```

---

## Option B — manual file copy

```bash
cd ~
rm -rf AZa
git clone https://github.com/saviourben177-dotcom/AZa.git
cd AZa
git checkout main

unzip ~/storage/downloads/aza-job-match-changes.zip -d ~/aza-job-match-changes

cp -r ~/aza-job-match-changes/src/app/opportunities/\[id\]/opportunity-detail-client.tsx \
      src/app/opportunities/\[id\]/opportunity-detail-client.tsx
cp ~/aza-job-match-changes/src/lib/groq.ts src/lib/groq.ts
cp ~/aza-job-match-changes/src/lib/supabase/database.types.ts src/lib/supabase/database.types.ts
cp ~/aza-job-match-changes/src/lib/actions/job-match.ts src/lib/actions/job-match.ts
cp ~/aza-job-match-changes/src/components/cv/opportunity-match-analysis.tsx src/components/cv/opportunity-match-analysis.tsx
mkdir -p supabase/migrations
cp ~/aza-job-match-changes/supabase/migrations/20261025000000_add_opportunity_match_analyses.sql \
   supabase/migrations/20261025000000_add_opportunity_match_analyses.sql

npm install
npx tsc --noEmit
npx next build
```

---

## 3. Database migration (only if setting up a fresh/branch DB)

The migration has already been applied to the live **AZA** Supabase project
(`saongnctrioxuvdcsmbw`). If you're pointing at a different/fresh Supabase
project, apply it with the Supabase CLI:

```bash
cd ~/AZa
npx supabase db push
```

or run the SQL in
`supabase/migrations/20261025000000_add_opportunity_match_analyses.sql`
directly in the Supabase SQL editor.

---

## 4. Commit and push

```bash
cd ~/AZa
git add -A
git commit -m "Add standalone Job Match Analysis feature"
git push origin main
```

---

See `JOB_MATCH_FEATURE_SUMMARY.md` for what was built, what's deferred
(payment/unlock gating), and the confirmed live-schema findings this was
built against.
