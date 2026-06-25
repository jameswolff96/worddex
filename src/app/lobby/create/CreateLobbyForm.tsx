"use client";

import { useActionState, useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { createClient } from "@/lib/supabase/client";
import { createLobby } from "../actions";

interface Props {
  isGuest: boolean;
  categories: string[];
}

export function CreateLobbyForm({ isGuest, categories }: Props) {
  const [error, action, pending] = useActionState<{ error: string } | undefined, FormData>(
    createLobby,
    undefined
  );
  const [mode, setMode] = useState<"teams" | "solo" | "classroom_streamer">("teams");
  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const anonReady = useRef(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (isGuest && !anonReady.current) {
      e.preventDefault();
      captchaRef.current?.execute();
    }
  }

  async function onCaptchaVerify(token: string) {
    const supabase = createClient();
    const { error: anonError } = await supabase.auth.signInAnonymously({
      options: { captchaToken: token },
    });
    if (anonError) {
      // Surface error via the action state mechanism isn't easy here,
      // so fall back to alert for now
      alert("Failed to create guest session. Please try again.");
      captchaRef.current?.resetCaptcha();
      return;
    }
    anonReady.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit}>
      {/* Mode */}
      <div className="pc-card">
        <h2 className="pc-h2">1. Game mode</h2>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* Categories */}
      <div className="pc-card">
        <h2 className="pc-h2">2. Categories</h2>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          Toggle which categories can appear as secret terms.
        </p>
        <CategoryToggles categories={categories} />
      </div>

      {/* Rules */}
      <div className="pc-card">
        <h2 className="pc-h2">3. Round settings</h2>
        <RuleSettings isTeams={mode === "teams"} />
      </div>

      {/* Visibility */}
      <div className="pc-card">
        <h2 className="pc-h2">4. Lobby visibility</h2>
        <VisibilitySelector />
      </div>

      {error && (
        <p className="text-sm font-bold mb-4" style={{ color: "var(--pc-red)" }}>
          {error.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="pc-btn pc-btn-red pc-btn-block"
        style={{ fontSize: "1.05rem" }}
      >
        {pending ? "Creating lobby…" : "Create lobby →"}
      </button>

      {isGuest && (
        <HCaptcha
          ref={captchaRef}
          sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
          size="invisible"
          onVerify={onCaptchaVerify}
        />
      )}
    </form>
  );
}

function ModeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (m: "teams" | "solo" | "classroom_streamer") => void;
}) {
  const modes = [
    { value: "teams", label: "Teams", desc: "Teams take turns. One Clue Master, rest of team guesses." },
    { value: "solo", label: "Solo / Free-for-all", desc: "Each player takes a turn clueing. Everyone guesses individually." },
    { value: "classroom_streamer", label: "Classroom / Streamer", desc: "One fixed Clue Giver for the whole game. Teams compete simultaneously." },
  ] as const;

  return (
    <div className="space-y-2">
      {modes.map((m) => (
        <label
          key={m.value}
          className="flex items-start gap-3 cursor-pointer p-3 rounded-xl"
          style={{ border: "2px solid var(--pc-ink)", background: "var(--pc-input-bg)" }}
        >
          <input
            type="radio"
            name="mode"
            value={m.value}
            checked={value === m.value}
            onChange={() => onChange(m.value)}
            className="mt-1 accent-[var(--pc-blue)]"
          />
          <div>
            <div className="font-bold" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
              {m.label}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--pc-muted)" }}>
              {m.desc}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

function CategoryToggles({ categories }: { categories: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <CategoryPill key={cat} category={cat} />
      ))}
    </div>
  );
}

function CategoryPill({ category }: { category: string }) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name="categories"
        value={category}
        defaultChecked
        className="sr-only"
      />
      <span className="pc-pill">{category}</span>
    </label>
  );
}

function RuleSettings({ isTeams }: { isTeams: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="pc-label">Number of rounds</label>
          <select name="number_of_rounds" defaultValue="3" className="pc-input">
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div>
          <label className="pc-label">Terms per turn</label>
          <select name="terms_per_turn" defaultValue="5" className="pc-input">
            {[3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div>
          <label className="pc-label">Word budget</label>
          <select name="word_budget" defaultValue="25" className="pc-input">
            {[15, 20, 25, 30, 35].map((n) => <option key={n} value={n}>{n} words</option>)}
          </select>
        </div>

        {isTeams && (
          <div>
            <label className="pc-label">Number of teams</label>
            <select name="number_of_teams" defaultValue="2" className="pc-input">
              {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="pc-label">Clue Master rotation</label>
          <select name="clue_master_rotation" defaultValue="round" className="pc-input">
            <option value="static">Static (same person)</option>
            <option value="round">Round rotation</option>
            <option value="term">Term rotation</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
        <input type="checkbox" name="is_18_plus_mode" value="true" className="accent-[var(--pc-red)]" />
        18+ mode (allow mature language in clues)
      </label>
    </div>
  );
}

function VisibilitySelector() {
  return (
    <div className="flex gap-3">
      {(["public", "private"] as const).map((v) => (
        <label
          key={v}
          className="flex items-center gap-2 cursor-pointer text-sm font-bold capitalize"
        >
          <input
            type="radio"
            name="visibility"
            value={v}
            defaultChecked={v === "public"}
            className="accent-[var(--pc-blue)]"
          />
          {v}
          <span className="text-xs font-normal" style={{ color: "var(--pc-muted)" }}>
            {v === "public" ? "— listed in lobby browser" : "— join by code only"}
          </span>
        </label>
      ))}
    </div>
  );
}
