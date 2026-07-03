import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="font-display text-[20px] font-extrabold text-ink">Privacy Policy</h1>
      <p className="mt-1.5 text-[12.5px] text-ink/50">Effective Date: July 3, 2026</p>

      <p className="mt-4 text-[13.5px] leading-relaxed text-ink/70">
        AZA (&quot;the App&quot;) is operated by <strong className="text-ink">Aza Technologies</strong>{" "}
        (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we
        collect, use, disclose, and protect your information when you use the AZA mobile
        application. By using AZA, you agree to the practices described in this Privacy Policy.
      </p>

      <div className="mt-6 space-y-6 text-[13.5px] leading-relaxed text-ink/70">
        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">1. Information We Collect</h2>
          <p className="mt-1.5">When you use AZA, we may collect the following information:</p>

          <p className="mt-3 text-[13px] font-bold text-ink">Account Information</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Display name</li>
            <li>Email address</li>
            <li>Profile picture (if provided)</li>
          </ul>

          <p className="mt-3 text-[13px] font-bold text-ink">User Content</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Posts</li>
            <li>Comments</li>
            <li>Profile information</li>
            <li>Other content you choose to share</li>
          </ul>

          <p className="mt-3 text-[13px] font-bold text-ink">Device and Usage Information</p>
          <p className="mt-1">
            We may automatically collect certain technical information including:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Device type</li>
            <li>Operating system</li>
            <li>App version</li>
            <li>Log data</li>
            <li>Diagnostic information</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">2. How We Use Your Information</h2>
          <p className="mt-1.5">We use your information to:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Create and manage your account</li>
            <li>Provide and improve our services</li>
            <li>Display your profile and content to other users</li>
            <li>Enable community interactions</li>
            <li>Maintain app security</li>
            <li>Detect fraud, spam, or abuse</li>
            <li>Respond to customer support requests</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">3. Information Sharing</h2>
          <p className="mt-1.5">We do not sell your personal information.</p>
          <p className="mt-1.5">We may share your information only in the following situations:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>With trusted service providers that help operate AZA</li>
            <li>When required by law or legal process</li>
            <li>
              To protect the rights, safety, and security of our users or the platform
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">4. Data Storage and Security</h2>
          <p className="mt-1.5">
            We use reasonable administrative, technical, and organizational safeguards to protect
            your personal information against unauthorized access, alteration, disclosure, or
            destruction.
          </p>
          <p className="mt-1.5">
            While we strive to protect your information, no method of electronic storage or
            internet transmission is completely secure.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">5. Data Retention</h2>
          <p className="mt-1.5">
            We retain your information for as long as your account remains active or as necessary
            to provide our services, resolve disputes, enforce our agreements, and comply with
            legal obligations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">6. Your Rights</h2>
          <p className="mt-1.5">Depending on your location, you may have the right to:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account</li>
            <li>Request deletion of your personal data</li>
          </ul>
          <p className="mt-1.5">
            To exercise these rights, you can delete your account directly in the app from{" "}
            <span className="font-semibold text-ink">Profile → Settings → Delete account</span>,
            or contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">7. Children&apos;s Privacy</h2>
          <p className="mt-1.5">AZA is not intended for children under the age of 13.</p>
          <p className="mt-1.5">
            We do not knowingly collect personal information from children under 13. If we become
            aware that such information has been collected, we will promptly delete it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">8. Third-Party Services</h2>
          <p className="mt-1.5">
            AZA may use third-party services that help us operate the application, such as cloud
            hosting, authentication, and database services.
          </p>
          <p className="mt-1.5">
            These providers only process information necessary to perform services on our behalf.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">
            9. Changes to This Privacy Policy
          </h2>
          <p className="mt-1.5">We may update this Privacy Policy from time to time.</p>
          <p className="mt-1.5">
            When changes are made, the updated version will be posted with a revised effective
            date. Continued use of AZA after changes become effective constitutes acceptance of
            the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[15px] font-bold text-ink">10. Contact Us</h2>
          <p className="mt-1.5">
            If you have any questions or concerns regarding this Privacy Policy, you may contact
            us:
          </p>
          <p className="mt-2">
            <strong className="text-ink">Aza Technologies</strong>
            <br />
            Email:{" "}
            <a href="mailto:saviourben177@gmail.com" className="font-semibold text-aza">
              saviourben177@gmail.com
            </a>
            <br />
            Phone: +234 708 056 9565
          </p>
        </section>

        <p className="border-t border-line pt-4 text-[12.5px] text-ink/50">
          By using AZA, you acknowledge that you have read and understood this Privacy Policy.
        </p>
      </div>

      <Link href="/about" className="mt-6 block text-[12.5px] font-semibold text-aza">
        ← Back to About
      </Link>
    </div>
  );
}
