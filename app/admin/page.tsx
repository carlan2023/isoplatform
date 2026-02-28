"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  BookOpen,
  LogOut,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0 });

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      const { data } = await supabase
        .from("enrollments")
        .select(
          `
          *,
          courses (title, standard, start_date)
        `,
        )
        .order("enrolled_at", { ascending: false });

      const list = data || [];
      setEnrollments(list);
      setStats({
        total: list.length,
        confirmed: list.filter((e: any) => e.status === "confirmed").length,
        pending: list.filter((e: any) => e.status === "pending").length,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("enrollments").update({ status }).eq("id", id);
    setEnrollments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e)),
    );
    setStats((prev) => ({
      ...prev,
      confirmed:
        status === "confirmed" ? prev.confirmed + 1 : prev.confirmed - 1,
      pending: status === "pending" ? prev.pending + 1 : prev.pending - 1,
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div
          className="text-slate-400 text-sm"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Loading...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: "#0d9488" }}
          >
            <ShieldCheck size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">Alrena Group</span>
          <span
            className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Admin
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">
          Enrollment Dashboard
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Enrollments",
              value: stats.total,
              icon: <Users size={18} className="text-teal-600" />,
            },
            {
              label: "Confirmed",
              value: stats.confirmed,
              icon: <CheckCircle size={18} className="text-green-500" />,
            },
            {
              label: "Pending Payment",
              value: stats.pending,
              icon: <BookOpen size={18} className="text-amber-500" />,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-4"
            >
              {s.icon}
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {s.value}
                </div>
                <div
                  className="text-sm text-slate-400"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enrollments table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">
              All Enrollment Requests
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    "Course",
                    "Standard",
                    "Start Date",
                    "Amount",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e: any) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {e.courses?.title}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {e.courses?.standard}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(e.courses?.start_date).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      UGX {Number(e.amount_paid).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${e.status === "confirmed" ? "bg-green-100 text-green-700" : e.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {e.status !== "confirmed" && (
                          <button
                            onClick={() => updateStatus(e.id, "confirmed")}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            <CheckCircle size={13} /> Confirm
                          </button>
                        )}
                        {e.status !== "cancelled" && (
                          <button
                            onClick={() => updateStatus(e.id, "cancelled")}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 font-medium"
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
