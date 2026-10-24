import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a reset link for your NAM QMS student portal password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
