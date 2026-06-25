"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Brandbar() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Link href="/" className="flex items-center gap-3 flex-1 no-underline">
        <div className="pokeball" style={{ width: 36, height: 36 }} />
        <div>
          <h1
            className="text-2xl font-extrabold leading-none"
            style={{ fontFamily: "'Trebuchet MS', Verdana, sans-serif", color: "var(--pc-ink)" }}
          >
            WordDex
          </h1>
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--pc-red-dark)" }}
          >
            Trainer Edition
          </div>
        </div>
      </Link>

      <ThemeToggle />
    </div>
  );
}
