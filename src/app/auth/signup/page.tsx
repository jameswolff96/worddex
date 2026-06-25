import Link from "next/link";
import { Brandbar } from "@/components/Brandbar";
import { OAuthButtons } from "@/components/OAuthButtons";

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <h2 className="pc-h2">Create account</h2>
        <p className="text-sm mb-4" style={{ color: "var(--pc-muted)" }}>
          You&apos;ll get a random Pokémon-flavored trainer name — change it anytime on your profile.
        </p>

        <OAuthButtons />

        <p className="mt-4 text-sm" style={{ color: "var(--pc-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold" style={{ color: "var(--pc-blue)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
