import Link from "next/link";
import { Brandbar } from "@/components/Brandbar";

export const metadata = { title: "Privacy Policy – WordDex" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <h2 className="pc-h2">Privacy Policy</h2>
        <p className="text-xs mb-1" style={{ color: "var(--pc-muted)" }}>Last Updated: June 25, 2026</p>
        <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
          WordDex is a non-commercial, fan-made word game. We collect minimal data and are transparent about what we do with it.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          What Information We Collect
        </h3>

        <p className="text-sm font-bold mb-1">For Logged-In Users (OAuth)</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>Email address</strong>: Provided by your OAuth provider (Google, etc.) during signup</li>
          <li><strong>OAuth provider</strong>: We track which provider you used, but not your credentials</li>
          <li><strong>Display name and avatar</strong>: You choose these; they're visible to other players in lobbies</li>
          <li><strong>Game statistics</strong>: Wins/losses, favorite categories, number of games</li>
        </ul>

        <p className="text-sm font-bold mb-1">For Anonymous Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>Auto-generated display name</strong>: A randomly-generated adjective+noun combination (e.g. "Swift Charizard")</li>
          <li><strong>Game activity</strong>: Chat messages, guesses, game outcomes — not tied to a persistent identity</li>
          <li><strong>No email or identity tracking</strong>: Anonymous accounts are ephemeral; closing the browser ends the session</li>
        </ul>

        <p className="text-sm font-bold mb-1">Game Activity (All Users)</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Lobbies you create and join (time, mode, categories)</li>
          <li>Chat messages (clues, guesses, system messages)</li>
          <li>Guesses and scoring</li>
        </ul>

        <p className="text-sm font-bold mb-1">Technical Information</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>IP address and device info</strong>: Collected by our hosting providers (Vercel, Supabase) for security</li>
          <li><strong>NO cookies</strong>: We do not use cookies or similar tracking technologies</li>
          <li><strong>NO localStorage</strong>: We do not store persistent data in your browser</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          How We Use Your Information
        </h3>

        <p className="text-sm font-bold mb-1">For Logged-In Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Account management and persistent profile</li>
          <li>Running lobbies, syncing game state, scoring, and game history</li>
          <li>Contacting you about account issues (rarely, via your OAuth provider's email)</li>
          <li>Reviewing anonymized game data to improve gameplay</li>
        </ul>

        <p className="text-sm font-bold mb-1">For Anonymous Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Game functionality only — running lobbies and scoring during your session</li>
          <li>No persistent storage; no communication</li>
        </ul>

        <p className="text-sm font-bold mb-2">We do <em>not</em>:</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Sell or share your data with third parties for marketing</li>
          <li>Use your data to serve ads or track you across websites</li>
          <li>Share your email address with other players</li>
          <li>Share chat history publicly or with anyone outside the game</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Third-Party Services
        </h3>
        <ul className="text-sm space-y-2 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>
            <strong>Supabase</strong> (Database &amp; Authentication) — stores your account info and game data.{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              Supabase Privacy Policy
            </a>
          </li>
          <li>
            <strong>Vercel</strong> (Hosting) — hosts the WordDex website and backend.{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              Vercel Privacy Policy
            </a>
          </li>
        </ul>
        <p className="text-sm mt-3" style={{ color: "var(--pc-muted)" }}>
          Both services may collect your IP address and basic usage data per their own policies.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Data Retention
        </h3>
        <p className="text-sm font-bold mb-1">Logged-In Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Account data kept as long as your account exists</li>
          <li>Game history and chat kept indefinitely (you may request deletion)</li>
          <li>Deleted accounts: data removed within 30 days, except aggregated statistics</li>
        </ul>
        <p className="text-sm font-bold mb-1">Anonymous Users</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Session data retained only during your active session</li>
          <li>All persistent data deleted on logout/browser close</li>
          <li>Chat history may be retained on the server up to 30 days, then deleted</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Your Rights
        </h3>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          These rights apply to logged-in users with persistent accounts. Anonymous users do not have persistent data to access or delete beyond closing their browser.
        </p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>Access</strong>: Request a copy of the personal data we hold about you</li>
          <li><strong>Correction</strong>: Update your display name and avatar anytime</li>
          <li><strong>Deletion</strong>: Request account deletion; data removed within 30 days</li>
          <li><strong>Export</strong>: Request your game history in a portable format</li>
        </ul>
        <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:worddex.support@gmail.com" style={{ color: "var(--pc-blue)" }}>
            worddex.support@gmail.com
          </a>
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          COPPA &amp; International Users
        </h3>
        <p className="text-sm mb-3" style={{ color: "var(--pc-text)" }}>
          WordDex is not intended for children under 13, and we do not knowingly collect information from children under 13.
          If we become aware of such collection, we will delete that account and data immediately.
        </p>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          WordDex is governed by the laws of the State of Oklahoma, USA. If you're in the EU, California, or other regions
          with data protection laws (GDPR, CCPA, etc.), you have additional rights under those laws.
          Contact us for details on how we comply with regional regulations.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-2" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Contact Us
        </h3>
        <p className="text-sm" style={{ color: "var(--pc-text)" }}>
          Questions about this Privacy Policy?{" "}
          <a href="mailto:worddex.support@gmail.com" style={{ color: "var(--pc-blue)" }}>
            worddex.support@gmail.com
          </a>
        </p>
      </div>

      <footer className="text-center text-xs mt-4" style={{ color: "var(--pc-muted)" }}>
        <Link href="/" style={{ color: "var(--pc-muted)" }}>← Back to WordDex</Link>
        {" "}&middot;{" "}
        <Link href="/terms" style={{ color: "var(--pc-muted)" }}>Terms of Service</Link>
        <p className="mt-2">WordDex &middot; Not affiliated with Nintendo / Game Freak</p>
      </footer>
    </div>
  );
}
