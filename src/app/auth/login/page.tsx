import { Brandbar } from "@/components/Brandbar";
import { OAuthButtons } from "@/components/OAuthButtons";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-16">
      <Brandbar />

      <div className="pc-card">
        <h2 className="pc-h2">Sign in</h2>
        <p className="text-sm mb-4" style={{ color: "var(--pc-muted)" }}>
          Choose a provider to continue. New trainers get an account automatically.
        </p>

        <OAuthButtons />
      </div>
    </div>
  );
}
