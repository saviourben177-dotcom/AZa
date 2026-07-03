import DeleteAccountSection from "@/components/settings/DeleteAccountSection";

export default function SettingsPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="font-display text-[20px] font-extrabold text-ink">Settings</h1>

      <section className="mt-6">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-ink/40">
          Danger zone
        </h2>
        <div className="mt-2.5">
          <DeleteAccountSection />
        </div>
      </section>
    </div>
  );
}
