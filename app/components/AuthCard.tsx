import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const authInputClass =
  "w-full border border-slate-200 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500";

export const authSansFont = { fontFamily: "system-ui, sans-serif" as const };

/** Shared chrome for the login, forgot-password, and reset-password cards. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-md">
        <div className="p-8 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: "#0d9488" }}
            >
              <ShieldCheck size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">
              NAM Quality Management Systems
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
          <p className="text-slate-500 text-sm">{subtitle}</p>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
