import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Research Lab Grant & Budget Management",
  description:
    "A comprehensive system for managing university lab grant funding and project budgets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
