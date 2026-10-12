"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  evaluatePassword,
  passwordValidationError,
} from "@/lib/password";
import {
  RECOVERY_LINK_ERROR,
  describeRecoveryLink,
  type RecoveryLink,
} from "@/lib/recovery";
import {
  AuthCard,
  authInputClass,
  authSansFont,
} from "@/app/components/AuthCard";

type Status = "loading" | "ready" | "error";

function stripRecoveryParams() {
  if (window.location.search || window.location.hash) {
    window.history.replaceState({}, "", "/reset-password");
  }
}

/**
 * Turn the recovery redirect into a session.
 *
 * Middleware normally exchanges `?code=` / `?token_hash=` before this page
 * loads (same server PKCE exchange as /auth/callback) and redirects here
 * without those params. This still handles them if they reach the browser:
 * the PKCE client also exchanges `?code=` during initialize() when the code
 * verifier cookie is present, and verifyOtp covers the token-hash template.
 */
async function establishRecoverySession(
  link: RecoveryLink,
): Promise<"ready" | "invalid"> {
  if (link.method === "reject") return "invalid";

  if (link.method === "token_hash") {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: link.tokenHash,
    });
    if (error) {
      console.error("[reset-password] verifyOtp failed:", error.message);
      return "invalid";
    }
    return "ready";
  }

  if (link.method === "pkce") {
    const { error: initError } = await supabase.auth.initialize();
    const codeRemains = new URLSearchParams(window.location.search).get("code");
    if (codeRemains) {
      const { error } = await supabase.auth.exchangeCodeForSession(link.code);
      if (error) {
        console.error(
          "[reset-password] exchangeCodeForSession failed:",
          error.message,
        );
        return "invalid";
      }
    } else if (initError) {
      console.error("[reset-password] PKCE initialize failed:", initError.message);
      return "invalid";
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      if (error) console.error("[reset-password] getUser failed:", error.message);
      return "invalid";
    }
    return "ready";
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (error) console.error("[reset-password] getUser failed:", error.message);
    return "invalid";
  }
  return "ready";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState({ password: false, confirm: false });

  useEffect(() => {
    let active = true;
    const link = describeRecoveryLink(window.location.search, window.location.hash);

    establishRecoverySession(link)
      .then((result) => {
        if (!active) return;
        stripRecoveryParams();
        if (result === "ready") setStatus("ready");
        else {
          setError(RECOVERY_LINK_ERROR);
          setStatus("error");
        }
      })
      .catch((err) => {
        console.error("[reset-password] recovery session failed:", err);
        if (!active) return;
        stripRecoveryParams();
        setError(RECOVERY_LINK_ERROR);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const checks = evaluatePassword(password);
  const passwordValid = checks.every((check) => check.ok);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const canSubmit = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordValidationError(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error("[reset-password] signOut failed:", signOutError.message);
      }
      router.replace("/login?reset=success");
      router.refresh();
    } catch (err) {
      console.error("[reset-password] updateUser failed:", err);
      setError("Network error — please check your connection and try again.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <AuthCard
        title="Reset your password"
        subtitle="Checking your reset link"
      >
        <p className="text-sm text-slate-500" style={authSansFont} role="status">
          Checking your reset link…
        </p>
      </AuthCard>
    );
  }

  if (status === "error") {
    return (
      <AuthCard
        title="Reset your password"
        subtitle="Request a new link to continue"
      >
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4"
          style={authSansFont}
        >
          {error || RECOVERY_LINK_ERROR}
        </div>
        <Link
          href="/forgot-password"
          className="block w-full text-center text-white py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "#0d9488", ...authSansFont }}
        >
          Email me a new link
        </Link>
        <p className="text-center text-sm text-slate-400 mt-4" style={authSansFont}>
          <Link href="/login" style={{ color: "#0d9488" }}>
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Enter and confirm a new password for your account"
    >
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4"
          style={authSansFont}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock
            aria-hidden="true"
            size={15}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            name="password"
            type={visible.password ? "text" : "password"}
            placeholder="New password"
            aria-label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
            className={`${authInputClass} pr-10`}
            style={authSansFont}
          />
          <button
            type="button"
            onClick={() =>
              setVisible((current) => ({
                ...current,
                password: !current.password,
              }))
            }
            aria-label={visible.password ? "Hide password" : "Show password"}
            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {visible.password ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {password.length > 0 && (
          <ul className="space-y-1.5 -mt-1" style={authSansFont}>
            {checks.map((check) => (
              <li
                key={check.label}
                className={`flex items-center gap-2 text-xs ${
                  check.ok ? "text-teal-600" : "text-slate-400"
                }`}
              >
                {check.ok ? (
                  <Check size={13} className="shrink-0" />
                ) : (
                  <X size={13} className="shrink-0" />
                )}
                {check.label}
              </li>
            ))}
          </ul>
        )}

        <div className="relative">
          <Lock
            aria-hidden="true"
            size={15}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            name="confirm_password"
            type={visible.confirm ? "text" : "password"}
            placeholder="Confirm password"
            aria-label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError("");
            }}
            required
            className={`${authInputClass} pr-10 ${
              confirm && !passwordsMatch
                ? "!border-red-300"
                : passwordsMatch
                  ? "!border-teal-400"
                  : ""
            }`}
            style={authSansFont}
          />
          <button
            type="button"
            onClick={() =>
              setVisible((current) => ({
                ...current,
                confirm: !current.confirm,
              }))
            }
            aria-label={
              visible.confirm ? "Hide confirm password" : "Show confirm password"
            }
            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {visible.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirm.length > 0 && (
          <p
            className={`flex items-center gap-2 text-xs -mt-2 ${
              passwordsMatch ? "text-teal-600" : "text-red-500"
            }`}
            style={authSansFont}
          >
            {passwordsMatch ? <Check size={13} /> : <X size={13} />}
            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#0d9488", ...authSansFont }}
        >
          {loading ? "Updating password..." : "Update password"}
        </button>

        <p className="text-center text-sm text-slate-400" style={authSansFont}>
          <Link href="/login" style={{ color: "#0d9488" }}>
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
