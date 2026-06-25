"use client";

import { useActionState, useRef, useState } from "react";
import { updateDisplayName, deleteAccount, type ProfileError } from "./actions";

interface Props {
  displayName: string;
  discriminator: number;
  email: string | null;
  createdAt: string;
}

export function ProfileClient({ displayName, discriminator, email, createdAt }: Props) {
  const [nameError, nameAction, namePending] = useActionState<ProfileError | undefined, FormData>(
    updateDisplayName,
    undefined
  );
  const [deleteError, deleteAction, deletePending] = useActionState<ProfileError | undefined, FormData>(
    deleteAccount,
    undefined
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const joined = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      {/* ── Identity ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Your identity</h2>
        <div className="space-y-1 text-sm mb-1">
          <p>
            <span style={{ color: "var(--pc-muted)" }}>Display name </span>
            <strong style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
              {displayName}
              <span style={{ color: "var(--pc-muted)", fontWeight: 400 }}>#{discriminator}</span>
            </strong>
          </p>
          {email && (
            <p>
              <span style={{ color: "var(--pc-muted)" }}>Email </span>
              <strong>{email}</strong>
            </p>
          )}
          <p>
            <span style={{ color: "var(--pc-muted)" }}>Joined </span>
            <strong>{joined}</strong>
          </p>
        </div>
      </div>

      {/* ── Change display name ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Change display name</h2>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          Leave blank to get a new random Pokémon-flavored name. Your discriminator will update automatically.
        </p>
        <form action={nameAction} className="space-y-3">
          <input
            ref={inputRef}
            name="display_name"
            type="text"
            autoComplete="off"
            className="pc-input"
            placeholder={displayName}
            maxLength={32}
          />
          {nameError && (
            <p className="text-sm font-bold" style={{ color: "var(--pc-red)" }}>
              {nameError.error}
            </p>
          )}
          {!nameError && !namePending && (
            <p className="text-sm" style={{ color: "var(--pc-green)", minHeight: "1.25rem" }} aria-live="polite" />
          )}
          <button
            type="submit"
            disabled={namePending}
            className="pc-btn pc-btn-blue pc-btn-block"
          >
            {namePending ? "Saving…" : "Save display name →"}
          </button>
        </form>
      </div>

      {/* ── Danger zone ── */}
      <div className="pc-card" style={{ borderColor: "var(--pc-red)" }}>
        <h2 className="pc-h2" style={{ color: "var(--pc-red)" }}>Danger zone</h2>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          Permanently deletes your account and all associated data. This cannot be undone.
        </p>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="pc-btn pc-btn-ghost"
            style={{ borderColor: "var(--pc-red)", color: "var(--pc-red)" }}
          >
            Delete my account
          </button>
        ) : (
          <form action={deleteAction} className="space-y-3">
            <p className="text-sm font-bold" style={{ color: "var(--pc-red)" }}>
              Are you sure? This is permanent.
            </p>
            {deleteError && (
              <p className="text-sm font-bold" style={{ color: "var(--pc-red)" }}>
                {deleteError.error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={deletePending}
                className="pc-btn pc-btn-red"
              >
                {deletePending ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="pc-btn pc-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
