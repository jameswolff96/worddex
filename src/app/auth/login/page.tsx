"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "../actions";
import { Brandbar } from "@/components/Brandbar";
import { OAuthButtons } from "@/components/OAuthButtons";

export default function LoginPage() {
  const [error, action, pending] = useActionState<{ error: string } | undefined, FormData>(signIn, undefined);

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <h2 className="pc-h2">Sign in</h2>

        <form action={action} className="space-y-3">
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
              autoComplete="current-password"
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
            {pending ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <OAuthButtons />

        <p className="mt-4 text-sm" style={{ color: "var(--pc-muted)" }}>
          No account?{" "}
          <Link
            href="/auth/signup"
            className="font-bold"
            style={{ color: "var(--pc-blue)" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
