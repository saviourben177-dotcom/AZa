# One manual edit needed

Everything else in this zip is a NEW file (safe to extract directly).
This is the only EXISTING file that needs a small edit: `src/app/profile/page.tsx`

Find this block (around line 111-115):

```tsx
      <section className="mt-6 space-y-2.5">
        <ThemeToggle />
        <ProfileRow label="Help & Support" />
        <ProfileRow label="About Aza" />
      </section>
```

Replace it with:

```tsx
      <section className="mt-6 space-y-2.5">
        <ThemeToggle />
        <ProfileRow label="Help & Support" />
        <ProfileRow label="About Aza" />
        <ProfileLinkRow href="/profile/settings" label="Settings" />
      </section>
```

That's it — one line added, reusing the existing `ProfileLinkRow` helper already
defined at the bottom of that same file. No new imports needed.
