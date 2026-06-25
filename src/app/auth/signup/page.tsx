"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "../actions";
import { Brandbar } from "@/components/Brandbar";

export default function SignupPage() {
  const [error, action, pending] = useActionState<{ error: string } | undefined, FormData>(signUp, undefined);

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <h2 className="pc-h2">Create account</h2>
        <p className="text-sm mb-4" style={{ color: "var(--pc-muted)" }}>
          Leave the display name blank for a random Pokémon-flavored name.
        </p>

        <form action={action} className="space-y-3">
          <div>
            <label className="pc-label">Display name (optional)</label>
            <input
              name="display_name"
              type="text"
              autoComplete="username"
              className="pc-input"
              placeholder="e.g. Swift Charizard"
              maxLength={32}
            />
          </div>

          <div>
            <label className="pc-label">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="pc-input"
              placeholder="trainer@example.com"
            />
          </div>

          <div>
            <label className="pc-label">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="pc-input"
            />
          </div>

          {error && (
            <p className="text-sm font-bold" style={{ color: "var(--pc-red)" }}>
              {error.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="pc-btn pc-btn-red pc-btn-block mt-4"
          >
            {pending ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className="mt-4 text-sm" style={{ color: "var(--pc-muted)" }}>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold"
            style={{ color: "var(--pc-blue)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
