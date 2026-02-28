"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, User, Phone } from "lucide-react";
import Link from "next/link";

type Mode = "login" | "register" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) setError(error.message);
    else router.push("/dashboard");
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, phone: form.phone },
      },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  if (sent)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <Mail size={22} style={{ color: "#0d9488" }} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Check your inbox
          </h2>
          <p className="text-slate-500 text-sm">
            {mode === "register"
              ? "We sent you a confirmation link. Click it to activate your account."
              : "We sent you a magic link. Click it to sign in."}
          </p>
        </div>
      </div>
    );

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
            <span className="font-bold text-slate-900">Alrena Group</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === "register" ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === "register"
              ? "Register to enroll in courses"
              : "Sign in to your student portal"}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-100">
          {(["login", "register", "magic"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                borderBottom:
                  mode === m ? "2px solid #0d9488" : "2px solid transparent",
                color: mode === m ? "#0d9488" : "#94a3b8",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {m === "login"
                ? "Password"
                : m === "register"
                  ? "Register"
                  : "Magic Link"}
            </button>
          ))}
        </div>

        <div className="p-8">
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {error}
            </div>
          )}

          {/* PASSWORD LOGIN */}
          {mode === "login" && (
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
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                />
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <p
                className="text-center text-sm text-slate-400"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  style={{ color: "#0d9488" }}
                >
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {mode === "register" && (
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
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
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
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
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
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                />
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* MAGIC LINK */}
          {mode === "magic" && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p
                className="text-sm text-slate-500 mb-2"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Enter your email and we'll send you a one-click sign in link. No
                password needed.
              </p>
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
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
