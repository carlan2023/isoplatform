"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";

export default function EnrollPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setCourse(data));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: id, ...form }),
    });
    if (res.ok) router.push("/success");
    else alert("Something went wrong. Please try again.");
    setLoading(false);
  };

  if (!course)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full">
        <span className="text-xs font-mono text-teal-400">
          {course.standard}
        </span>
        <h1 className="text-2xl font-bold text-white mt-2 mb-1">
          {course.title}
        </h1>

        <div className="bg-slate-800 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Calendar size={15} className="text-teal-400 shrink-0" />
            {new Date(course.start_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Clock size={15} className="text-teal-400 shrink-0" />
            {course.duration_days} days · {course.format}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Users size={15} className="text-teal-400 shrink-0" />
            {course.seats_total - course.seats_taken} seats remaining
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            UGX 1,000,000 per person · UGX 700,000 for teams of 3+
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "name", placeholder: "Full Name", type: "text" },
            {
              name: "company",
              placeholder: "Company / Organisation",
              type: "text",
            },
            { name: "email", placeholder: "Work Email", type: "email" },
            { name: "phone", placeholder: "Phone Number", type: "tel" },
          ].map((field) => (
            <input
              key={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.name as keyof typeof form]}
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? "Submitting..." : "Request Enrollment →"}
          </button>
        </form>
        <p className="text-slate-500 text-xs text-center mt-4">
          We'll contact you within 24 hours with invoice and payment details.
        </p>
      </div>
    </div>
  );
}
