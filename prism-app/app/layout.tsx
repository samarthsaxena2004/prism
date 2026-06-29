import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { GeistPixelGrid } from "geist/font/pixel";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRISM — Enterprise Document Intelligence",
  description: "Five AI agents that digitize complex handwritten documents in seconds. Powered by Gemma 4 31B on Cerebras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${GeistPixelGrid.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 text-center py-2 px-4 text-xs font-mono border-b border-orange-500/20 flex items-center justify-center gap-2">
            <span>⚠️</span>
            <strong>BETA NOTICE:</strong> 
            This demonstration heavily relies on the Cerebras Gemma-4-31b beta model. You may experience downtime or rate-limits. Not for production use.
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
