"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinByCodeClient() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === 5) {
      router.push(`/lobby/${trimmed}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={5}
        placeholder="Room code (e.g. AB3KX)"
        className="pc-input"
        style={{ flex: 1, letterSpacing: "0.15em", textTransform: "uppercase" }}
      />
      <button
        type="submit"
        disabled={code.trim().length !== 5}
        className="pc-btn pc-btn-blue"
        style={{ flexShrink: 0 }}
      >
        Join →
      </button>
    </form>
  );
}
