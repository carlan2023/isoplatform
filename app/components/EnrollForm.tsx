"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Smartphone, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  computePricing,
  pricePerPerson,
  formatUGX,
  DEPOSIT_RATE,
  MAX_TEAM_SIZE,
} from "@/lib/pricing";

type Step =
  | "loading"
  | "signin"
  | "details"
  | "payment"
  | "pending"
  | "already";

export default function EnrollForm({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [reference, setReference] = useState("");
  const [alreadyStatus, setAlreadyStatus] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    company: "",
    phone: "",
    teamSize: "1",
    paymentType: "deposit", // 'deposit' | 'full' | 'custom'
    customAmount: "",
    momoPhone: "",
  });

  // Gate on auth and prefill contact details from the signed-in profile.
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setStep("signin");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, company")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setForm((f) => ({
        ...f,
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        company: profile?.company ?? "",
        momoPhone: profile?.phone ?? "",
      }));
      setStep("details");
    })();
    return () => {
      active = false;
    };
  }, []);

  const { fullAmount, minDeposit } = computePricing(
    parseInt(form.teamSize || "1"),
  );
  const payAmount =
    form.paymentType === "full"
      ? fullAmount
      : form.paymentType === "custom"
        ? parseInt(form.customAmount || "0")
        : minDeposit;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitDetails = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      setErrorMsg("Please enter your full name and phone number.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          full_name: form.full_name,
          company: form.company,
          phone: form.phone,
        }),
      });
      if (res.status === 401) {
        setStep("signin");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.enrollmentId) {
        setErrorMsg(data.error || "Could not start your enrollment.");
        return;
      }
      setEnrollmentId(data.enrollmentId);
      if (data.alreadyEnrolled) {
        setAlreadyStatus(data.status);
        setStep("already");
        return;
      }
      setStep("payment");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!form.momoPhone.trim()) {
      setErrorMsg("Enter the Mobile Money number to charge.");
      return;
    }
    if (form.paymentType === "custom" && payAmount < minDeposit) {
      setErrorMsg(`Minimum payment is UGX ${minDeposit.toLocaleString()}`);
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    const momo = form.momoPhone.startsWith("+")
      ? form.momoPhone
      : `+256${form.momoPhone.replace(/^0/, "")}`;
    try {
      const res = await fetch("/api/enroll/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          teamSize: parseInt(form.teamSize),
          amount: payAmount,
          fullAmount,
          momoPhone: momo,
          payerName: form.full_name,
        }),
      });
      if (res.status === 401) {
        setStep("signin");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Payment failed. Please try again.");
        return;
      }
      setReference(data.reference);
      setStep("pending");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sans = { fontFamily: "system-ui, sans-serif" as const };
  const inputCls =
    "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500";
  const labelCls =
    "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";

  // -------------------------------------------------------------- loading
  if (step === "loading") {
    return (
      <div className="text-center py-10">
        <Loader2
          size={28}
          className="animate-spin mx-auto"
          style={{ color: "#0d9488" }}
        />
      </div>
    );
  }

  // -------------------------------------------------------------- sign in
  if (step === "signin") {
    return (
      <div className="text-center py-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#f0fdfa" }}
        >
          <Lock size={24} style={{ color: "#0d9488" }} />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">
          Sign in to enroll
        </h3>
        <p className="text-slate-500 text-sm mb-6" style={sans}>
          Create an account or sign in so you can enroll and track your
          confirmation in your dashboard.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/enroll/${courseId}`)}`}
          className="inline-block text-white text-sm font-semibold px-6 py-3 rounded-lg"
          style={{ backgroundColor: "#0d9488", ...sans }}
        >
          Sign in or create an account
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------- already enrolled
  if (step === "already") {
    return (
      <div className="text-center py-6">
        <CheckCircle2
          size={40}
          className="mx-auto mb-4"
          style={{ color: "#0d9488" }}
        />
        <h3 className="font-bold text-slate-900 text-lg mb-2">
          You&apos;re already enrolled
        </h3>
        <p className="text-slate-500 text-sm mb-6" style={sans}>
          {alreadyStatus === "confirmed"
            ? `Your seat in ${courseTitle} is confirmed.`
            : `You already have a payment being confirmed for ${courseTitle}.`}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm font-semibold underline"
          style={{ color: "#0d9488" }}
        >
          Go to Dashboard →
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------- pending (phone approval)
  if (step === "pending") {
    return (
      <div className="text-center py-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#f0fdfa" }}
        >
          <Smartphone size={28} style={{ color: "#0d9488" }} />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">
          Check your phone
        </h3>
        <p className="text-slate-500 text-sm mb-4" style={sans}>
          A Mobile Money prompt was sent to <strong>{form.momoPhone}</strong>.
          Approve it to confirm your seat in <strong>{courseTitle}</strong>.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
          <div className="text-xs text-slate-400 mb-1" style={sans}>
            Payment Reference
          </div>
          <div className="font-mono text-sm text-slate-900">{reference}</div>
        </div>
        <p className="text-xs text-slate-400" style={sans}>
          You&apos;ll get a confirmation email once payment is approved. Save
          your reference for follow-up.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 text-sm font-semibold underline"
          style={{ color: "#0d9488" }}
        >
          Go to Dashboard →
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------- step indicator
  const stepBadge = (
    <div className="flex items-center gap-2 mb-5 text-xs" style={sans}>
      <span
        className="px-2 py-0.5 rounded-full font-medium"
        style={
          step === "details"
            ? { backgroundColor: "#0d9488", color: "white" }
            : { backgroundColor: "#f0fdfa", color: "#0f766e" }
        }
      >
        1 · Your details
      </span>
      <span className="text-slate-300">→</span>
      <span
        className="px-2 py-0.5 rounded-full font-medium"
        style={
          step === "payment"
            ? { backgroundColor: "#0d9488", color: "white" }
            : { backgroundColor: "#f1f5f9", color: "#94a3b8" }
        }
      >
        2 · Payment
      </span>
    </div>
  );

  const errorBanner = errorMsg && (
    <div
      className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4"
      style={sans}
    >
      {errorMsg}
    </div>
  );

  // -------------------------------------------------------------- step 1: details
  if (step === "details") {
    return (
      <div className="space-y-4">
        {stepBadge}
        {errorBanner}
        <div>
          <label className={labelCls} style={sans}>
            Full Name *
          </label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className={inputCls}
            style={sans}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className={labelCls} style={sans}>
            Phone Number *
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputCls}
            style={sans}
            placeholder="e.g. 0771234567 or +256771234567"
          />
        </div>
        <div>
          <label className={labelCls} style={sans}>
            Organisation / Company
          </label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            className={inputCls}
            style={sans}
            placeholder="Your organisation (optional)"
          />
        </div>
        <button
          onClick={submitDetails}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#0d9488", ...sans }}
        >
          {submitting ? "Saving..." : "Continue to payment →"}
        </button>
        <p className="text-center text-xs text-slate-400" style={sans}>
          No payment is taken on this step.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------- step 2: payment
  return (
    <div className="space-y-4">
      {stepBadge}
      {errorBanner}

      <div>
        <label className={labelCls} style={sans}>
          Number of Participants
        </label>
        <select
          name="teamSize"
          value={form.teamSize}
          onChange={handleChange}
          className={`${inputCls} bg-white`}
          style={sans}
        >
          {Array.from({ length: MAX_TEAM_SIZE }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} — {formatUGX(pricePerPerson(n) * n)} total
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls} style={sans}>
          Mobile Money Number *
        </label>
        <input
          name="momoPhone"
          value={form.momoPhone}
          onChange={handleChange}
          className={inputCls}
          style={sans}
          placeholder="e.g. 0771234567 or +256771234567"
        />
        <p className="text-xs text-slate-400 mt-1" style={sans}>
          MTN or Airtel Uganda number — you&apos;ll get the payment prompt here.
        </p>
      </div>

      <div>
        <label className={labelCls} style={sans}>
          Payment Amount
        </label>
        <div className="space-y-2">
          {[
            {
              value: "deposit",
              label: `Deposit (${Math.round(DEPOSIT_RATE * 100)}%)`,
              amount: `UGX ${minDeposit.toLocaleString()}`,
            },
            {
              value: "full",
              label: "Full Payment",
              amount: `UGX ${fullAmount.toLocaleString()}`,
            },
            {
              value: "custom",
              label: "Custom Amount",
              amount: `min UGX ${minDeposit.toLocaleString()}`,
            },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${form.paymentType === opt.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentType"
                  value={opt.value}
                  checked={form.paymentType === opt.value}
                  onChange={handleChange}
                  className="accent-teal-600"
                />
                <span
                  className="text-sm font-medium text-slate-900"
                  style={sans}
                >
                  {opt.label}
                </span>
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: "#0d9488", ...sans }}
              >
                {opt.amount}
              </span>
            </label>
          ))}
        </div>

        {form.paymentType === "custom" && (
          <input
            name="customAmount"
            type="number"
            value={form.customAmount}
            onChange={handleChange}
            min={minDeposit}
            max={fullAmount}
            placeholder={`Enter amount (min ${minDeposit.toLocaleString()})`}
            className={`${inputCls} mt-2`}
            style={sans}
          />
        )}
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-500" style={sans}>
            Amount to pay now
          </span>
          <span className="font-bold text-slate-900">
            UGX {payAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500" style={sans}>
            Balance remaining
          </span>
          <span className="font-semibold text-slate-700">
            UGX {(fullAmount - payAmount).toLocaleString()}
          </span>
        </div>
      </div>

      <button
        onClick={submitPayment}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-3.5 rounded-lg transition-colors disabled:opacity-50"
        style={{ backgroundColor: "#0d9488", ...sans }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Starting payment...
          </>
        ) : (
          <>
            <Smartphone size={16} /> Pay UGX {payAmount.toLocaleString()} via
            Mobile Money
          </>
        )}
      </button>

      <button
        onClick={() => {
          setErrorMsg("");
          setStep("details");
        }}
        className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
        style={sans}
      >
        ← Back to details
      </button>

      <p className="text-center text-xs text-slate-400" style={sans}>
        Powered by broRacks · Secure Mobile Money
      </p>
    </div>
  );
}
