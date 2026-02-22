import Link from "next/link";
import { CheckCircle, Mail, Clock } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={56} className="text-teal-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          Request Received!
        </h1>
        <p className="text-slate-400 mb-8">
          Thank you for your interest. A confirmation has been sent to your
          email and our team will be in touch within 24 hours with your invoice
          and next steps.
        </p>
        <div className="bg-slate-800 rounded-lg p-4 mb-8 space-y-3 text-left">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Mail size={15} className="text-teal-400 shrink-0" />
            Check your inbox for a confirmation email
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Clock size={15} className="text-teal-400 shrink-0" />
            We respond within 24 business hours
          </div>
        </div>
        <Link
          href="/"
          className="inline-block bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-lg transition-colors"
        >
          Browse More Courses
        </Link>
      </div>
    </div>
  );
}
