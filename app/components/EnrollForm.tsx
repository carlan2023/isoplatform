"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Loader2 } from "lucide-react";

const FULL_PRICE = 1000000;
const MIN_DEPOSIT = 300000;

export default function EnrollForm({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    teamSize: "1",
    paymentType: "deposit", // 'deposit' | 'full'
    customAmount: "",
  });
  const [step, setStep] = useState<"form" | "pending" | "error">("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [reference, setReference] = useState("");

  const isTeam = parseInt(form.teamSize) >= 3;
  const pricePerPerson = isTeam ? 700000 : FULL_PRICE;
  const fullAmount = pricePerPerson * parseInt(form.teamSize || "1");
  const minDeposit = Math.ceil(fullAmount * 0.3);
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

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (form.paymentType === "custom" && payAmount < minDeposit) {
      setErrorMsg(`Minimum payment is UGX ${minDeposit.toLocaleString()}`);
      return;
    }

    setStep("pending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone.startsWith("+")
            ? form.phone
            : `+256${form.phone.replace(/^0/, "")}`,
          teamSize: parseInt(form.teamSize),
          amount: payAmount,
          fullAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Payment failed. Please try again.");
        setStep("error");
        return;
      }

      setReference(data.reference);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    }
  };

  // Pending state — waiting for phone approval
  if (step === "pending" && reference) {
    return (
      <div className="text-center py-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#f0fdfa" }}
        >
          <Smartphone size={28} style={{ color: "#0d9488" }} />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">
          Check Your Phone
        </h3>
        <p
          className="text-slate-500 text-sm mb-4"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          A Mobile Money prompt has been sent to <strong>{form.phone}</strong>.
          Approve it to confirm your enrollment in{" "}
          <strong>{courseTitle}</strong>.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
          <div
            className="text-xs text-slate-400 mb-1"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Payment Reference
          </div>
          <div className="font-mono text-sm text-slate-900">{reference}</div>
        </div>
        <p
          className="text-xs text-slate-400"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          You will receive a confirmation email once payment is approved. Save
          your reference number for follow-up.
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

  if (step === "pending" && !reference) {
    return (
      <div className="text-center py-10">
        <Loader2
          size={32}
          className="animate-spin mx-auto mb-4"
          style={{ color: "#0d9488" }}
        />
        <p
          className="text-slate-500 text-sm"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Initiating payment...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div
          className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {errorMsg}
        </div>
      )}

      {/* Personal Details */}
      <div>
        <label
          className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Full Name *
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          style={{ fontFamily: "system-ui, sans-serif" }}
          placeholder="Your full name"
        />
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Email Address *
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          style={{ fontFamily: "system-ui, sans-serif" }}
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Mobile Money Number *
        </label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          style={{ fontFamily: "system-ui, sans-serif" }}
          placeholder="e.g. 0771234567 or +256771234567"
        />
        <p
          className="text-xs text-slate-400 mt-1"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          MTN or Airtel Uganda number — you'll get a payment prompt here
        </p>
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Organisation / Company
        </label>
        <input
          name="company"
          value={form.company}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
          style={{ fontFamily: "system-ui, sans-serif" }}
          placeholder="Your organisation (optional)"
        />
      </div>

      <div>
        <label
          className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Number of Participants
        </label>
        <select
          name="teamSize"
          value={form.teamSize}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 bg-white"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n}{" "}
              {n >= 3
                ? `— UGX ${(700000 * n).toLocaleString()} total`
                : `— UGX ${(1000000 * n).toLocaleString()} total`}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Amount */}
      <div>
        <label
          className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Payment Amount
        </label>
        <div className="space-y-2">
          {[
            {
              value: "deposit",
              label: `Deposit (30%)`,
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
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {opt.label}
                </span>
              </div>
              <span
                className="text-sm font-bold"
                style={{
                  color: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
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
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 mt-2"
            style={{ fontFamily: "system-ui, sans-serif" }}
          />
        )}
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-1">
          <span
            className="text-slate-500"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Amount to pay now
          </span>
          <span className="font-bold text-slate-900">
            UGX {payAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span
            className="text-slate-500"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Balance remaining
          </span>
          <span className="font-semibold text-slate-700">
            UGX {(fullAmount - payAmount).toLocaleString()}
          </span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-3.5 rounded-lg transition-colors"
        style={{
          backgroundColor: "#0d9488",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <Smartphone size={16} />
        Pay UGX {payAmount.toLocaleString()} via Mobile Money
      </button>

      <p
        className="text-center text-xs text-slate-400"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        Powered by broRacks · Secure Mobile Money
      </p>
    </div>
  );
}
