"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldCheck, BookOpen, Clock, LogOut } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profile);

      if (profile?.role === "admin") {
        router.push("/admin");
        return;
      }

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false });
      setEnrollments(enrollments || []);
      setLoading(false);
    };
    load();
  }, [router]);

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
        </Link>
        <div className="flex items-center gap-4">
          <span
            className="text-sm text-slate-500"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {profile?.full_name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome back
          {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p
          className="text-slate-500 text-sm mb-8"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Here are your enrolled courses.
        </p>

        {enrollments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <BookOpen size={32} className="text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">
              No enrollments yet
            </h3>
            <p
              className="text-slate-400 text-sm mb-6"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Browse our upcoming courses and request an enrollment.
            </p>
            <Link
              href="/#courses"
              className="inline-block text-white text-sm px-5 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: "#0d9488",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e: any) => (
              <div
                key={e.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between"
              >
                <div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded border inline-block mb-2"
                    style={{
                      backgroundColor: "#f0fdfa",
                      borderColor: "#99f6e4",
                      color: "#0f766e",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {e.courses?.standard}
                  </span>
                  <h3 className="font-bold text-slate-900">
                    {e.courses?.title}
                  </h3>
                  <div
                    className="flex items-center gap-4 mt-2 text-sm text-slate-400"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(e.courses?.start_date).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${e.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {e.status === "confirmed" ? "Confirmed" : "Pending Payment"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
