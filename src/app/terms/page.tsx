import Link from "next/link";
import { Brandbar } from "@/components/Brandbar";

export const metadata = { title: "Terms of Service – WordDex" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <h2 className="pc-h2">Terms of Service</h2>
        <p className="text-xs mb-1" style={{ color: "var(--pc-muted)" }}>Last Updated: June 25, 2026</p>
        <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
          By accessing and using WordDex, you agree to be bound by these Terms of Service.
          WordDex is a non-commercial, free-to-play game provided "as is" without warranty or expectation of support.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          1. License to Use
        </h3>
        <p className="text-sm mb-2" style={{ color: "var(--pc-text)" }}>
          We grant you a limited, non-exclusive, non-transferable, revocable license to use WordDex for personal, non-commercial entertainment only. You may not:
        </p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Reproduce, distribute, or transmit the Service or any part of it</li>
          <li>Reverse-engineer, decompile, or attempt to discover the source code</li>
          <li>Use the Service for commercial purposes (selling access, advertising, monetization)</li>
          <li>Access the Service through automated means (bots, scrapers) without permission</li>
          <li>Attempt to gain unauthorized access to any part of the Service or other users' accounts</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          2. Intellectual Property
        </h3>
        <p className="text-sm font-bold mb-1">WordDex Game</p>
        <p className="text-sm mb-3" style={{ color: "var(--pc-text)" }}>
          WordDex is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).
          You may use the game for non-commercial purposes with attribution.
        </p>
        <p className="text-sm font-bold mb-1">Pokémon &amp; Related IP</p>
        <p className="text-sm mb-3" style={{ color: "var(--pc-text)" }}>
          WordDex is an <strong>unofficial, non-commercial fan project</strong> and is not affiliated with, endorsed by,
          or approved by Nintendo, Pokémon, Spike Chunsoft, or The Pokémon Company. All Pokémon names, images, and
          related trademarks are the property of The Pokémon Company and Nintendo. No copyright infringement is intended.
        </p>
        <p className="text-sm font-bold mb-1">User-Generated Content</p>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          By sending messages, clues, or other content through WordDex, you grant us a worldwide, royalty-free license
          to use that content solely to operate the Service. You retain all other rights to your content.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          3. User Conduct &amp; Moderation
        </h3>
        <p className="text-sm mb-2" style={{ color: "var(--pc-text)" }}>You agree not to:</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Use slurs, hate speech, racism, or targeted harassment</li>
          <li>Send unsolicited commercial messages or spam</li>
          <li>Impersonate another person or misrepresent your identity</li>
          <li>Attempt to cheat, exploit bugs, or gain unfair advantage</li>
          <li>Share others' personal information without consent</li>
          <li>Post sexual, graphic, or illegal content</li>
        </ul>
        <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
          Violations may result in warnings, chat restrictions, account suspension, or a permanent ban.
          We reserve the right to remove messages or ban users at our discretion.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          4. Your Account
        </h3>
        <p className="text-sm font-bold mb-1">Logged-In Accounts (OAuth)</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>You are responsible for all activity on your WordDex account</li>
          <li>You may not sell, transfer, or share your account</li>
          <li>Notify us immediately if you believe your account has been compromised</li>
        </ul>
        <p className="text-sm font-bold mb-1">Anonymous Accounts</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>No sign-up required — complete a quick bot-check and play</li>
          <li>Your auto-generated display name persists for the duration of your session</li>
          <li>Game data is stored in our database and deleted automatically after 30 days of inactivity</li>
          <li>No account recovery is possible for anonymous sessions</li>
          <li>By using anonymous mode, you still agree to these Terms</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          5. Limitation of Liability
        </h3>
        <p className="text-sm mb-3" style={{ color: "var(--pc-text)" }}>
          <strong>DISCLAIMER:</strong> WordDex is provided "AS IS" without any warranty, express or implied.
          We do not warrant that the Service will be uninterrupted, error-free, or secure.
        </p>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          <strong>LIMITATION OF LIABILITY:</strong> To the maximum extent permitted by law, WordDex and its creators
          are not liable for loss of data, revenue, or other indirect or consequential damages; bugs, interruptions,
          or service outages; disputes between players; or unauthorized access to your account.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          6. Service Modifications &amp; Termination
        </h3>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          We may modify, suspend, or discontinue WordDex at any time. We may also modify these Terms of Service —
          continued use constitutes acceptance of new terms. We may delete accounts or data without notice if they
          violate these terms or are inactive.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          7. Third-Party Services
        </h3>
        <ul className="text-sm space-y-2 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>
            <strong>Supabase</strong> —{" "}
            <a href="https://supabase.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              Supabase Terms
            </a>
          </li>
          <li>
            <strong>Vercel</strong> —{" "}
            <a href="https://vercel.com/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              Vercel Terms
            </a>
          </li>
          <li>
            <strong>hCaptcha</strong> —{" "}
            <a href="https://www.hcaptcha.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              hCaptcha Terms
            </a>
          </li>
        </ul>
        <p className="text-sm mt-3" style={{ color: "var(--pc-muted)" }}>
          We are not responsible for their actions, outages, or privacy practices.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          8. Dispute Resolution &amp; Governing Law
        </h3>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          These Terms are governed by the laws of the State of Oklahoma, USA. Any disputes will be resolved through
          informal negotiation; if that fails, binding arbitration (not class action) in Tulsa, Oklahoma.
          You agree that WordDex disputes are personal to you and cannot be brought as a class action.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          9. Acknowledgment
        </h3>
        <p className="text-sm mb-3" style={{ color: "var(--pc-text)" }}>By using WordDex, you acknowledge:</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>You have read and understood these Terms of Service</li>
          <li>You agree to be bound by them</li>
          <li>You are at least 13 years old (or have parental consent if younger)</li>
          <li>You understand this is a non-commercial fan project with no guarantee of ongoing support</li>
          <li>You take full responsibility for your use of the Service</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-2" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Contact &amp; Support
        </h3>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          For account issues, abuse reports, or questions about these terms:{" "}
          <a href="mailto:worddex.support@gmail.com" style={{ color: "var(--pc-blue)" }}>
            worddex.support@gmail.com
          </a>
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--pc-muted)" }}>
          Response times are not guaranteed; this is a non-commercial project run by volunteers.
        </p>
      </div>

      <footer className="text-center text-xs mt-4" style={{ color: "var(--pc-muted)" }}>
        <Link href="/" style={{ color: "var(--pc-muted)" }}>← Back to WordDex</Link>
        {" "}&middot;{" "}
        <Link href="/privacy" style={{ color: "var(--pc-muted)" }}>Privacy Policy</Link>
        <p className="mt-2">WordDex &middot; Not affiliated with Nintendo / Game Freak</p>
      </footer>
    </div>
  );
}
