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
          <li><strong>Email address</strong>: Provided by your OAuth provider (Google, etc.) during sign-in</li>
          <li><strong>OAuth provider</strong>: We track which provider you used, but not your credentials</li>
          <li><strong>Display name and avatar</strong>: You choose these; they are visible to other players in lobbies</li>
          <li><strong>Game statistics</strong>: Wins/losses, favorite categories, number of games</li>
        </ul>

        <p className="text-sm font-bold mb-1">For Anonymous Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>Auto-generated display name</strong>: A randomly-generated adjective + Pokémon combination (e.g. "Swift Charizard")</li>
          <li><strong>Game activity</strong>: Chat messages, guesses, game outcomes — stored in our database and associated with your anonymous session</li>
          <li><strong>No email</strong>: Anonymous accounts do not require or store an email address</li>
        </ul>

        <p className="text-sm font-bold mb-1">Game Activity (All Users)</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Lobbies you create and join (time, mode, categories)</li>
          <li>Chat messages (clues, guesses, system messages)</li>
          <li>Guesses and scoring</li>
        </ul>

        <p className="text-sm font-bold mb-1">Technical Information</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>IP address and device info</strong>: Collected by our hosting providers (Vercel, Supabase) for security and abuse prevention</li>
          <li>
            <strong>Auth session cookie</strong>: A short-lived cookie is set when you sign in (including anonymous sign-in)
            to maintain your session. It is deleted when you sign out and is not used for tracking.
          </li>
          <li>
            <strong>localStorage</strong>: We store your theme preference (light/dark mode) in your browser&apos;s localStorage.
            This contains no personal data and is never sent to our servers.
          </li>
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
          <li>Contacting you about account issues (rarely, via your OAuth provider&apos;s email)</li>
          <li>Reviewing anonymized game data to improve gameplay</li>
        </ul>

        <p className="text-sm font-bold mb-1">For Anonymous Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Game functionality only — running lobbies and scoring during your session</li>
          <li>No email communication</li>
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
          <li>
            <strong>hCaptcha</strong> (Bot protection) — used during anonymous sign-in to prevent abuse.
            hCaptcha may collect browser and device information to verify you are human.{" "}
            <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              hCaptcha Privacy Policy
            </a>
          </li>
          <li>
            <strong>Vercel Analytics &amp; Speed Insights</strong> — we use these tools to understand how WordDex is used
            and how fast it loads. They collect aggregated, anonymised data including country, device type, browser,
            referrer, and page load performance metrics (Core Web Vitals). This data does not identify individual users
            and is not used for advertising purposes.{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--pc-blue)" }}>
              Vercel Privacy Policy
            </a>
          </li>
        </ul>
        <p className="text-sm mt-3" style={{ color: "var(--pc-muted)" }}>
          These services may collect your IP address and basic usage data per their own policies.
        </p>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Data Retention
        </h3>
        <p className="text-sm font-bold mb-1">Logged-In Users</p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Account data kept as long as your account exists</li>
          <li>Game history and chat messages retained indefinitely; contact us to request deletion</li>
          <li>Deleted accounts: associated data removed within 30 days</li>
        </ul>
        <p className="text-sm font-bold mb-1">Anonymous Users</p>
        <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li>Your anonymous session and associated game data are stored in our database</li>
          <li>Anonymous accounts and their data are automatically deleted after 30 days of inactivity</li>
          <li>You can also request manual deletion by contacting us</li>
        </ul>
      </div>

      <div className="pc-card">
        <h3 className="font-extrabold text-base mb-3" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
          Your Rights
        </h3>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          These rights apply to all users. Anonymous users can request deletion by providing their display name and approximate session date.
        </p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5" style={{ color: "var(--pc-text)" }}>
          <li><strong>Access &amp; Export</strong>: Download a copy of your profile, stats, game history, and chat messages at any time from your <a href="/profile" style={{ color: "var(--pc-blue)" }}>profile page</a></li>
          <li><strong>Correction</strong>: Update your display name and avatar anytime on your profile page</li>
          <li><strong>Deletion</strong>: Delete your account and all associated data directly from your profile page; takes effect immediately</li>
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
          WordDex is governed by the laws of the State of Oklahoma, USA. If you are in the EU, California, or other regions
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
