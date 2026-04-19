import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DialDynamics — Master the Cold Call Opener",
  description:
    "Practice your cold call opener with AI prospects. Get scored in 30 seconds. Fix what breaks your call.",
  openGraph: {
    title: "DialDynamics — Master the Cold Call Opener",
    description:
      "Practice your cold call opener with AI prospects. Get scored in 30 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
