"use client";

import { inspectMomoPhone } from "@/lib/phone";

const REQUIRED = "Enter the Mobile Money number to charge.";

/**
 * Mobile Money number field with a fixed +256 prefix.
 * Accepts 07…, 7…, 2567… and +2567…, and shows MTN / Airtel as soon as the
 * prefix is known.
 */
export default function MomoPhoneField({
  id = "enroll-momoPhone",
  value,
  onChange,
  attempted = false,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  attempted?: boolean;
  disabled?: boolean;
}) {
  const phone = inspectMomoPhone(value);
  const error =
    phone.error && (phone.local.length > 0 || attempted)
      ? phone.error
      : attempted && !phone.e164
        ? REQUIRED
        : null;

  const hintId = `${id}-hint`;
  const sans = { fontFamily: "system-ui, sans-serif" as const };

  let status: string | null = null;
  if (!error && phone.network && phone.e164) {
    status = `${phone.network} Mobile Money`;
  } else if (!error && phone.network) {
    status = `${phone.network} · enter all 9 digits`;
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide"
        style={sans}
      >
        Mobile Money Number *
      </label>
      <div
        className={`flex rounded-lg border bg-white ${error ? "border-red-300" : "border-slate-200"} focus-within:border-teal-500`}
      >
        <span
          className="inline-flex items-center px-3 bg-slate-50 text-sm font-semibold text-slate-700 border-r border-slate-200 rounded-l-lg select-none"
          style={sans}
          aria-hidden="true"
        >
          +256
        </span>
        <input
          id={id}
          name="momoPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          value={phone.local}
          onChange={(e) => onChange(inspectMomoPhone(e.target.value).local)}
          className="w-full min-w-0 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none disabled:bg-slate-50"
          style={sans}
          placeholder="771234567"
        />
      </div>
      <p
        id={hintId}
        className={`text-xs mt-1 ${error ? "text-red-600" : phone.network ? "text-slate-600" : "text-slate-400"}`}
        style={sans}
        aria-live="polite"
      >
        {error ??
          status ??
          "MTN (76, 77, 78, 79) or Airtel (70, 74, 75). You can type 07… or 7…, or paste 2567… / +2567…."}
      </p>
    </div>
  );
}
