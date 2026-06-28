import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRISM — Medical Document Intelligence",
  description: "Five AI agents that digitize handwritten medical records in seconds. Powered by Gemma 4 31B on Cerebras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#06060f] text-[#e8eaf6] font-[var(--font-space-grotesk)]">
        {children}
      </body>
    </html>
  );
}
