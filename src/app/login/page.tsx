"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
      <div className="mb-7 text-center flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/otg-logo-stacked.svg" alt="Orchard Talent Group" className="h-28 w-auto mb-4" />
        <h1 className="text-xl font-black text-dark-teal tracking-tight">Orchard Advisory</h1>
        <p className="text-sm text-muted mt-1">Reimagining talent for impact.</p>
      </div>

      <div className="otg-card otg-card--ivory w-full max-w-sm">
        <h2 className="text-lg font-semibold text-heading mb-5">Sign in</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="otg-field">
            <label className="otg-field__label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="otg-input"
            />
          </div>

          <div className="otg-field">
            <label className="otg-field__label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="otg-input"
            />
          </div>

          {error && (
            <p className="text-sm text-warm-terracotta bg-apricot-blush-200 px-3 py-2 rounded-md">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="otg-btn otg-btn--primary otg-btn--md w-full mt-1"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
