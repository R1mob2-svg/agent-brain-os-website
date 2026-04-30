import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Agent Brain OS | Governed memory for serious AI builders",
  description:
    "Agent Brain OS turns a static AI workflow into a governed memory system: doctrine, retrieval, proofs, candidate promotion, and a Librarian control room.",
  metadataBase: new URL("https://agent-brain-os-website.vercel.app")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
