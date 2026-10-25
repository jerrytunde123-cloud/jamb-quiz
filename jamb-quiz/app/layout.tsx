import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice",
    template: "%s · SUCCESS ACADEMY",
  },
  description:
    "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
}

export const viewport: Viewport = {
  themeColor: "#0d1117",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark h-full ${inter.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  )
}
