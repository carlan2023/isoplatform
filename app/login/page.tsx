"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

type View = "login" | "register";

// Realtime password rules — evaluated on every keystroke in the register form.
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    label: "Upper and lowercase letters",
    test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  },
  { label: "At least one number", test: (p) => /\d/.test(p) },
];

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sentVia, setSentVia] = useState<"register" | "magic">("register");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    full_name: "",
    phone: "",
  });
  const [visible, setVisible] = useState({
    login: false,
    register: false,
    confirm: false,
  });
  const toggleVisible = (key: keyof typeof visible) =>
    setVisible((v) => ({ ...v, [key]: !v[key] }));

  // Surface an error passed back by /auth/callback (e.g. expired email link).
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a URL param after mount (kept in an effect to avoid a hydration mismatch).
    if (e) setError(e);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const switchView = (next: View) => {
    setView(next);
    setError("");
    setSent(false);
  };

  // Realtime validation state (register form).
  const passwordChecks = PASSWORD_RULES.map((r) => ({
    label: r.label,
    ok: r.test(form.password),
  }));
  const passwordValid = passwordChecks.every((c) => c.ok);
  const passwordsMatch =
    form.confirm_password.length > 0 && form.password === form.confirm_password;
  const canRegister =
    passwordValid && passwordsMatch && form.full_name.trim().length > 0;

  // The URL Supabase should send email links back to. Goes through
  // /auth/callback so the one-time code is exchanged for a session.
  const callbackUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    return `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
      redirect,
    )}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error, data } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Honor an explicit ?redirect= target (set by middleware); otherwise route
    // by the app role stored on the profile. The auth user object has no app
    // role, so we must read it from `profiles`. Redirect exactly once.
    const params = new URLSearchParams(window.location.search);
    let destination = params.get("redirect");

    if (!destination) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      destination = profile?.role === "admin" ? "/admin" : "/dashboard";
    }

    router.replace(destination);
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setError("Please choose a password that meets all the requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, phone: form.phone },
        emailRedirectTo: callbackUrl(),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Supabase returns a user with an empty `identities` array when the email
    // is already registered (it avoids leaking that fact via an error).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(
        "An account with this email already exists. Try signing in instead.",
      );
      setLoading(false);
      return;
    }

    // If email confirmation is disabled on the project, signUp returns a live
    // session — send the user straight in rather than telling them to check
    // an inbox that will never receive anything.
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSentVia("register");
    setSent(true);
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!form.email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSentVia("magic");
    setSent(true);
    setLoading(false);
  };

  const inputBase =
    "w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500";
  const sansFont = { fontFamily: "system-ui, sans-serif" as const };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-md">
        {/* Header */}
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: "#0d9488" }}
            >
              <ShieldCheck size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">
              AM Quality Management Systems
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {view === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-slate-500 text-sm">
            {view === "register"
              ? "Register to enroll in courses and track your progress"
              : "Sign in to your student portal"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4"
              style={sansFont}
            >
              {error}
            </div>
          )}

          {/* SUCCESS — after register / magic-link, tell the user to check email */}
          {sent ? (
            <div className="text-center">
              <div
                className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-4"
                style={sansFont}
              >
                <div className="flex justify-center mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#0d9488" }}
                  >
                    <Mail size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-teal-700 font-semibold mb-1">
                  Check your email
                </div>
                <p className="text-teal-600 text-sm">
                  {sentVia === "register"
                    ? `We've sent a confirmation link to ${form.email}. Open it to verify your account and finish signing up.`
                    : `We've sent a one-click sign-in link to ${form.email}. Open it to continue.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchView("login")}
                className="text-sm"
                style={{ color: "#0d9488", ...sansFont }}
              >
                Back to sign in
              </button>
            </div>
          ) : view === "login" ? (
            /* LOGIN CARD */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputBase}
                  style={sansFont}
                />
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="password"
                  type={visible.login ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`${inputBase} pr-10`}
                  style={sansFont}
                />
                <button
                  type="button"
                  onClick={() => toggleVisible("login")}
                  aria-label={visible.login ? "Hide password" : "Show password"}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {visible.login ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#0d9488", ...sansFont }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-slate-400" style={sansFont}>
                    or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full border border-slate-200 text-slate-700 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-50"
                style={sansFont}
              >
                Email me a one-time sign-in link
              </button>

              <p className="text-center text-sm text-slate-400" style={sansFont}>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("register")}
                  style={{ color: "#0d9488" }}
                >
                  Register here
                </button>
              </p>
            </form>
          ) : (
            /* REGISTER CARD */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="full_name"
                  type="text"
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  className={inputBase}
                  style={sansFont}
                />
              </div>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputBase}
                  style={sansFont}
                />
              </div>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={inputBase}
                  style={sansFont}
                />
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="password"
                  type={visible.register ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`${inputBase} pr-10`}
                  style={sansFont}
                />
                <button
                  type="button"
                  onClick={() => toggleVisible("register")}
                  aria-label={
                    visible.register ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {visible.register ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Realtime password checklist */}
              {form.password.length > 0 && (
                <ul className="space-y-1.5 -mt-1" style={sansFont}>
                  {passwordChecks.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-2 text-xs ${
                        c.ok ? "text-teal-600" : "text-slate-400"
                      }`}
                    >
                      {c.ok ? (
                        <Check size={13} className="shrink-0" />
                      ) : (
                        <X size={13} className="shrink-0" />
                      )}
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}

              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="confirm_password"
                  type={visible.confirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                  className={`${inputBase} pr-10 ${
                    form.confirm_password && !passwordsMatch
                      ? "!border-red-300"
                      : passwordsMatch
                        ? "!border-teal-400"
                        : ""
                  }`}
                  style={sansFont}
                />
                <button
                  type="button"
                  onClick={() => toggleVisible("confirm")}
                  aria-label={
                    visible.confirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {visible.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm_password.length > 0 && (
                <p
                  className={`flex items-center gap-2 text-xs -mt-2 ${
                    passwordsMatch ? "text-teal-600" : "text-red-500"
                  }`}
                  style={sansFont}
                >
                  {passwordsMatch ? <Check size={13} /> : <X size={13} />}
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !canRegister}
                className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0d9488", ...sansFont }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

              <p className="text-center text-sm text-slate-400" style={sansFont}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  style={{ color: "#0d9488" }}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
