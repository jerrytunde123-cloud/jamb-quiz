import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://utmelab.com"),
  title: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice Quiz",
  description:
    "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
  openGraph: {
    title: "SUCCESS ACADEMY · UTME LAB",
    description: "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes. Challenge your friends!",
    images: [{ url: "/logo.png", width: 500, height: 500, alt: "Success Academy UTME Lab" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SUCCESS ACADEMY · UTME LAB",
    description: "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
