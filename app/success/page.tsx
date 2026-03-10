import Link from "next/link";
import { CheckCircle, Mail, Clock } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <CheckCircle size={56} className="text-teal-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Request Received!
        </h1>
        <p
          className="text-slate-500 mb-8"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Thank you for your interest. A confirmation has been sent to your
          email and our team will be in touch within 24 hours with your invoice
          and next steps.
        </p>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-8 space-y-3 text-left">
          <div
            className="flex items-center gap-3 text-sm text-slate-600"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <Mail size={15} className="text-teal-600 shrink-0" />
            Check your inbox for a confirmation email
          </div>
          <div
            className="flex items-center gap-3 text-sm text-slate-600"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <Clock size={15} className="text-teal-600 shrink-0" />
            We respond within 24 business hours
          </div>
        </div>
        <Link
          href="/"
          className="inline-block text-white font-bold px-6 py-3 rounded-lg transition-colors"
          style={{
            backgroundColor: "#0d9488",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Browse More Courses
        </Link>
      </div>
    </div>
  );
}
