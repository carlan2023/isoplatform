import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student portal",
  description: "Sign in to the NAM QMS student portal.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
