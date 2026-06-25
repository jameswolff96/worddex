"use client";

import { useActionState } from "react";
import { createLobby } from "../actions";
import { Brandbar } from "@/components/Brandbar";

const ALL_CATEGORIES = [
  "Pokémon",
  "Items",
  "Gym Leaders",
  "Games",
  "Towns & Cities",
  "Routes & Areas",
];

export default function CreateLobbyPage() {
  const [error, action, pending] = useActionState<{ error: string } | undefined, FormData>(createLobby, undefined);

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <form action={action}>
        {/* Mode */}
        <div className="pc-card">
          <h2 className="pc-h2">1. Game mode</h2>
          <ModeSelector />
        </div>

        {/* Categories */}
        <div className="pc-card">
          <h2 className="pc-h2">2. Categories</h2>
          <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
            Toggle which categories can appear as secret terms.
          </p>
          <CategoryToggles />
        </div>

        {/* Rules */}
        <div className="pc-card">
          <h2 className="pc-h2">3. Round settings</h2>
          <RuleSettings />
        </div>

        {/* Visibility */}
        <div className="pc-card">
          <h2 className="pc-h2">4. Lobby visibility</h2>
          <VisibilitySelector />
        </div>

        {error && (
          <p
            className="text-sm font-bold mb-4"
            style={{ color: "var(--pc-red)" }}
          >
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
      </form>
    </div>
  );
}

function ModeSelector() {
  const modes = [
    {
      value: "teams",
      label: "Teams",
      desc: "Teams take turns. One Clue Master, rest of team guesses.",
    },
    {
      value: "solo",
      label: "Solo / Free-for-all",
      desc: "Each player takes a turn clueing. Everyone guesses individually.",
    },
    {
      value: "classroom_streamer",
      label: "Classroom / Streamer",
      desc: "One fixed Clue Giver for the whole game. Teams compete simultaneously.",
    },
  ];

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
            defaultChecked={m.value === "teams"}
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

function CategoryToggles() {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((cat) => (
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

function RuleSettings() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="pc-label">Number of rounds</label>
          <select name="number_of_rounds" defaultValue="3" className="pc-input">
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="pc-label">Terms per turn</label>
          <select name="terms_per_turn" defaultValue="5" className="pc-input">
            {[3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="pc-label">Word budget</label>
          <select name="word_budget" defaultValue="25" className="pc-input">
            {[15, 20, 25, 30, 35].map((n) => (
              <option key={n} value={n}>
                {n} words
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="pc-label">Clue Master rotation</label>
          <select
            name="clue_master_rotation"
            defaultValue="round"
            className="pc-input"
          >
            <option value="static">Static (same person)</option>
            <option value="round">Round rotation</option>
            <option value="term">Term rotation</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
        <input
          type="checkbox"
          name="is_18_plus_mode"
          value="true"
          className="accent-[var(--pc-red)]"
        />
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
