import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const inter  = Inter ({ subsets: ["latin"], variable: "--font-inter",  display: "swap" });

export const metadata: Metadata = {
  title: "MUET Archive — Past Papers, Notes & AI Assistant",
  description:
    "Your ultimate MUET study archive. Access thousands of past papers, notes & handouts. Ace your exams with our intelligent AI assistant.",
  keywords: ["MUET", "past papers", "study notes", "engineering", "handouts", "AI assistant", "MUET Archive"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} antialiased min-h-screen flex flex-col bg-bg text-text`}
        style={{ fontFamily: "var(--font-outfit), var(--font-inter), system-ui, sans-serif" }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer
            className="border-t"
            style={{
              borderColor: "rgba(168,85,247,0.12)",
              background: "rgba(7,5,15,0.98)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="container mx-auto px-6 py-10">
              {/* Top row — brand + links */}
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-8">
                {/* Brand */}
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 14px rgba(168,85,247,0.4)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <span className="text-base font-bold text-text tracking-tight">
                      MUET <span style={{ color: "#a855f7" }}>Archive</span>
                    </span>
                  </div>
                  <p className="text-xs text-text-subtle max-w-[220px] text-center md:text-left leading-relaxed">
                    Developed for MUETians, by a MUETian.
                  </p>
                </div>

                {/* Quick links */}
                <div className="flex items-center gap-6 text-sm">
                  <a href="/browse" className="text-text-muted hover:text-primary transition-colors">Browse</a>
                  <a href="/upload" className="text-text-muted hover:text-primary transition-colors">Upload</a>
                  <a href="/ai-assistant" className="text-text-muted hover:text-primary transition-colors">AI Assistant</a>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t mb-6" style={{ borderColor: "rgba(168,85,247,0.08)" }} />

              {/* Bottom row — copyright */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs text-text-subtle">
                  © {new Date().getFullYear()} MUET Archive. Made with ❤️ by{" "}
                  <span className="text-text-muted font-medium">Muhammad Yahya</span>{" "}
                  <span className="text-text-subtle">(22CS)</span>
                </p>
                <p className="text-xs text-text-subtle">All rights reserved.</p>
              </div>
            </div>
          </footer>

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(18,16,31,0.95)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "#f0eaff",
                backdropFilter: "blur(12px)",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
