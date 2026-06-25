"use server";

import { createClient } from "@/lib/supabase/server";

export async function generateDisplayName(): Promise<string> {
  const supabase = await createClient();

  const [{ data: adjs }, { data: nouns }] = await Promise.all([
    supabase.from("adjectives").select("word"),
    supabase.from("word_bank").select("term").eq("is_active", true),
  ]);

  const adjList = adjs?.map((a) => a.word) ?? FALLBACK_ADJECTIVES;
  const nounList = nouns?.map((n) => n.term) ?? FALLBACK_NOUNS;

  const adj = adjList[Math.floor(Math.random() * adjList.length)];
  const noun = nounList[Math.floor(Math.random() * nounList.length)];

  return `${adj} ${noun}`;
}

// Fallbacks in case DB isn't reachable
const FALLBACK_ADJECTIVES = [
  "Swift", "Bold", "Calm", "Fierce", "Jolly", "Clever", "Shiny", "Radiant",
];
const FALLBACK_NOUNS = [
  "Pikachu", "Charizard", "Eevee", "Gengar", "Snorlax", "Mewtwo",
];
