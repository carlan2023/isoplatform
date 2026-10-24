import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your NAM QMS enrollments and upcoming training.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
