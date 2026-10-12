"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resetPasswordRedirectTo } from "@/lib/auth-url";
import { forgotPasswordMessage } from "@/lib/recovery";
import { isValidEmail } from "@/lib/validation";
import { AuthCard, authInputClass, authSansFont } from "@/app/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formatError, setFormatError] = useState("");

  // Prefill from the login page. Read after mount so the server render matches.
  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("email");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a URL param after mount (kept in an effect to avoid a hydration mismatch).
    if (prefill && isValidEmail(prefill)) setEmail(prefill);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!isValidEmail(address)) {
      setFormatError("Enter a valid email address.");
      return;
    }

    setFormatError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: resetPasswordRedirectTo(),
      });
      // Log the real result for debugging (redirect allow-list, rate limits).
      // The screen always shows the same sentence either way.
      if (error) {
        console.error("[forgot-password] resetPasswordForEmail:", error.message);
      }
    } catch (err) {
      console.error("[forgot-password] resetPasswordForEmail failed:", err);
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one"
    >
      {sent ? (
        <div className="text-center">
          <div
            className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-4"
            style={authSansFont}
            role="status"
          >
            <div className="flex justify-center mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#0d9488" }}
              >
                <Mail size={18} className="text-white" />
              </div>
            </div>
            <div className="text-teal-700 font-semibold mb-1">Check your email</div>
            <p className="text-teal-600 text-sm">{forgotPasswordMessage()}</p>
            <p className="text-teal-600 text-sm mt-2">
              If it doesn&apos;t arrive in a few minutes, check your spam folder
              or try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-sm"
            style={{ color: "#0d9488", ...authSansFont }}
          >
            Try a different email
          </button>
          <span className="text-slate-300 mx-2" aria-hidden="true">
            ·
          </span>
          <Link
            href="/login"
            className="text-sm"
            style={{ color: "#0d9488", ...authSansFont }}
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              aria-hidden="true"
              size={15}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              name="email"
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormatError("");
              }}
              required
              className={authInputClass}
              style={authSansFont}
            />
          </div>
          {formatError && (
            <p role="alert" className="text-sm text-red-600 -mt-2" style={authSansFont}>
              {formatError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#0d9488", ...authSansFont }}
          >
            {loading ? "Sending..." : "Email reset link"}
          </button>
          <p className="text-center text-sm text-slate-400" style={authSansFont}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "#0d9488" }}>
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
