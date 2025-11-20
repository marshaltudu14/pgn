import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PGN Admin Dashboard",
    template: "%s | PGN Admin Dashboard"
  },
  description: "Internal enterprise location tracking and attendance management system with face recognition capabilities. Monitor your workforce, track attendance, and manage employee data efficiently.",
  keywords: ["PGN", "admin dashboard", "employee management", "attendance tracking", "face recognition", "location tracking", "HR system", "internal system"],
  authors: [{ name: "PGN Systems" }],
  creator: "PGN Systems",
  publisher: "PGN Systems",
  robots: "noindex, nofollow, noarchive, nosnippet, notranslate, noimageindex, unavailable_after: 2025-01-01", // Block all indexing
  openGraph: {
    title: "PGN Admin Dashboard",
    description: "Internal enterprise location tracking and attendance management system with face recognition capabilities.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "PGN Admin Dashboard",
    description: "Internal enterprise location tracking and attendance management system with face recognition capabilities.",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://pgn.example.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
