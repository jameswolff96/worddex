"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName, deleteAccount, exportMyData, type ProfileError } from "./actions";
import { AvatarSelector } from "./AvatarSelector";

interface Props {
  displayName: string;
  email: string | null;
  spriteUrl: string | null;
  currentAvatar: string | null;
  createdAt: string;
}

export function ProfileClient({ displayName, email, spriteUrl, currentAvatar, createdAt }: Props) {
  const [nameError, nameAction, namePending] = useActionState<ProfileError | undefined, FormData>(
    updateDisplayName,
    undefined
  );
  const [deleteError, deleteAction, deletePending] = useActionState<ProfileError | undefined, FormData>(
    deleteAccount,
    undefined
  );

  const router = useRouter();
  const prevPending = useRef(false);

  useEffect(() => {
    if (prevPending.current && !namePending && !nameError) {
      router.refresh();
      if (inputRef.current) inputRef.current.value = "";
    }
    prevPending.current = namePending;
  }, [namePending, nameError, router]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, startExport] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    setExportError(null);
    startExport(async () => {
      const result = await exportMyData();
      if ("error" in result) {
        setExportError(result.error);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worddex-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const joined = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      {/* ── Identity ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Your identity</h2>
        <div className="flex items-center gap-4 mb-3">
          {spriteUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={spriteUrl}
              alt={displayName}
              width={72}
              height={72}
              style={{ imageRendering: "pixelated", flexShrink: 0 }}
            />
          ) : (
            <div className="pokeball" style={{ width: 56, height: 56, flexShrink: 0 }} />
          )}
          <div>
            <div className="font-bold text-lg" style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}>
              {displayName}
            </div>
            {email && <div className="text-sm" style={{ color: "var(--pc-muted)" }}>{email}</div>}
            <div className="text-xs mt-1" style={{ color: "var(--pc-muted)" }}>Joined {joined}</div>
          </div>
        </div>
      </div>

      {/* ── Avatar selector ── */}
      <AvatarSelector currentAvatar={currentAvatar} />

      {/* ── Change display name ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Change display name</h2>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          Leave blank to get a new random Pokémon-flavored name.
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

      {/* ── Data export ── */}
      <div className="pc-card">
        <h2 className="pc-h2">Your data</h2>
        <p className="text-sm mb-3" style={{ color: "var(--pc-muted)" }}>
          Download a copy of your profile, stats, game history, and chat messages as a JSON file.
        </p>
        {exportError && (
          <p className="text-sm font-bold mb-2" style={{ color: "var(--pc-red)" }}>{exportError}</p>
        )}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExport}
          className="pc-btn pc-btn-ghost"
        >
          {isExporting ? "Preparing download…" : "Download my data"}
        </button>
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
