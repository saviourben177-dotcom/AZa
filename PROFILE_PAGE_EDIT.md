# One manual edit needed

Existing file to edit: `src/app/profile/page.tsx`

Find this block (the one you edited last time, now with the Settings row too):

```tsx
      <section className="mt-6 space-y-2.5">
        <ThemeToggle />
        <ProfileRow label="Help & Support" />
        <ProfileRow label="About Aza" />
        <ProfileLinkRow href="/profile/settings" label="Settings" />
      </section>
```

Replace the two `ProfileRow` lines with `ProfileLinkRow` and add hrefs:

```tsx
      <section className="mt-6 space-y-2.5">
        <ThemeToggle />
        <ProfileLinkRow href="/help" label="Help & Support" />
        <ProfileLinkRow href="/about" label="About Aza" />
        <ProfileLinkRow href="/profile/settings" label="Settings" />
      </section>
```

That's the only change. `ProfileLinkRow` is already defined at the bottom of this
same file (used elsewhere), so no new imports needed.

Once this stops being used anywhere in the file, the `ProfileRow` helper function
at the bottom becomes unused — that's fine, leave it in for now, it won't break
the build (TypeScript won't complain about an unused top-level function).

---

# Also: paste your privacy policy content

`src/app/privacy/page.tsx` is a placeholder with clearly marked spots to paste
your already-drafted privacy policy text. Open it and replace each
`[Paste your drafted section here]` with your real content, then update
`[DATE]` near the top to today's date.
