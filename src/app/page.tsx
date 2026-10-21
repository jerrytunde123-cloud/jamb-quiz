import type { Metadata } from "next";
import Image from "next/image";
import { getSubjects } from "@/lib/quiz";
import { Home } from "@/components/Home";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice",
  description:
    "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
  openGraph: {
    title: "SUCCESS ACADEMY · UTME LAB — JAMB/WAEC Practice",
    description: "Practice 1000+ JAMB & WAEC questions. 15 questions · 5 minutes · randomised every attempt.",
    images: [{ url: "/logo.png", width: 500, height: 500, alt: "Success Academy Logo" }],
  },
};

export default async function Page() {
  const subjects = await getSubjects();

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <Image src="/logo.png" alt="Success Academy Logo" width={42} height={42} className="logo-img" priority />
          <div>
            <h1>SUCCESS ACADEMY</h1>
            <span>UTME LAB · JAMB/WAEC Practice</span>
          </div>
        </div>
        <nav className="socials">
          <a
            href="https://whatsapp.com/channel/0029VbChP246LwHsgqriNd3t"
            target="_blank"
            rel="noopener"
            className="wa"
          >
            <i className="fab fa-whatsapp" /> Main Channel
          </a>
          <a
            href="https://t.me/freewassceditto"
            target="_blank"
            rel="noopener"
            className="tg"
          >
            <i className="fab fa-telegram" /> Telegram
          </a>
          <a
            href="https://t.me/Officialkingjay1"
            target="_blank"
            rel="noopener"
            className="contact-link"
          >
            <i className="fas fa-headset" /> Contact
          </a>
        </nav>
      </header>

      <Home subjects={subjects} />

      <footer className="site-footer">
        <p>© SUCCESS ACADEMY · UTME LAB</p>
        <p>
          <a href="https://t.me/Officialkingjay1" target="_blank" rel="noopener">
            <i className="fab fa-telegram" /> Contact
          </a>
          {" · "}
          <a href="https://utmelab.com" target="_blank" rel="noopener">
            <i className="fas fa-globe" /> utmelab.com
          </a>
        </p>
      </footer>
    </>
  );
}
