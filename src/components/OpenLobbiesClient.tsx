"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { LobbyRow, LobbyRules } from "@/lib/types/database";

interface Props {
  initialLobbies: LobbyRow[];
}

export function OpenLobbiesClient({ initialLobbies }: Props) {
  const [lobbies, setLobbies] = useState<LobbyRow[]>(initialLobbies);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("open-lobbies")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lobbies" },
        (payload) => {
          const lobby = payload.new as LobbyRow;
          if (lobby.visibility === "public" && lobby.status === "waiting") {
            setLobbies((prev) => [lobby, ...prev].slice(0, 20));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lobbies" },
        (payload) => {
          const lobby = payload.new as LobbyRow;
          if (lobby.visibility !== "public" || lobby.status !== "waiting") {
            setLobbies((prev) => prev.filter((l) => l.id !== lobby.id));
          } else {
            setLobbies((prev) => {
              const idx = prev.findIndex((l) => l.id === lobby.id);
              if (idx === -1) return [lobby, ...prev].slice(0, 20);
              const next = [...prev];
              next[idx] = lobby;
              return next;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "lobbies" },
        (payload) => {
          const old = payload.old as { id: string };
          setLobbies((prev) => prev.filter((l) => l.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (lobbies.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--pc-muted)" }}>
        No open lobbies right now.{" "}
        <Link href="/lobby/create" style={{ color: "var(--pc-blue)", fontWeight: 700 }}>
          Start one!
        </Link>
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {lobbies.map((lobby) => {
        const rules = lobby.rules as LobbyRules;
        const modeLabel: Record<string, string> = {
          teams: "Teams",
          solo: "Free-for-all",
          classroom_streamer: "Classroom",
        };
        return (
          <li
            key={lobby.id}
            style={{
              border: "2px solid var(--pc-ink)",
              borderRadius: 10,
              padding: "10px 14px",
              background: "var(--pc-input-bg)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <span
                className="font-bold"
                style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif" }}
              >
                {lobby.code}
              </span>
              <span className="text-xs ml-2" style={{ color: "var(--pc-muted)" }}>
                {modeLabel[lobby.mode] ?? lobby.mode}
                {rules.number_of_rounds ? ` · ${rules.number_of_rounds}R` : ""}
                {rules.terms_per_turn ? ` · ${rules.terms_per_turn} terms` : ""}
              </span>
            </div>
            <Link
              href={`/lobby/${lobby.code}`}
              className="pc-btn pc-btn-ghost"
              style={{ fontSize: "0.85rem", padding: "6px 14px" }}
            >
              View
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
