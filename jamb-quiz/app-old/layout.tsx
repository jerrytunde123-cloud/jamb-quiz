import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
    default: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice",
    template: "%s · SUCCESS ACADEMY",
  },
  description:
    "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
  openGraph: {
    title: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice",
    description:
      "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
    images: [
      {
        url: "/logo.png",
        width: 500,
        height: 500,
        alt: "Success Academy Logo",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
