import Image from "next/image"
import Link from "next/link"
import { Headset, MessageCircle, Send } from "lucide-react"

import { Button } from "@/components/ui/button"

const LINKS = [
  {
    label: "Main Channel",
    href: "https://whatsapp.com/channel/0029VbChP246LwHsgqriNd3t",
    icon: MessageCircle,
    tone: "text-whatsapp",
  },
  {
    label: "Telegram",
    href: "https://t.me/freewassceditto",
    icon: Send,
    tone: "text-telegram",
  },
  {
    label: "Contact",
    href: "https://t.me/Officialkingjay1",
    icon: Headset,
    tone: "text-brand",
  },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image
            src="/logo.png"
            alt="Success Academy logo"
            width={44}
            height={44}
            priority
            className="size-11 shrink-0 rounded-xl border border-border/80 object-cover shadow-sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-extrabold tracking-[0.16em] text-foreground">
              SUCCESS ACADEMY
            </span>
            <span className="block truncate text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              UTME LAB · JAMB/WAEC Practice
            </span>
          </span>
        </Link>

        <nav
          aria-label="Community links"
          className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:items-center"
        >
          {LINKS.map((link) => {
            const Icon = link.icon

            return (
              <Button
                key={link.label}
                asChild
                variant="ghost"
                size="sm"
                className="h-9 min-w-0 justify-center rounded-full px-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground sm:px-3"
              >
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0"
                >
                  <Icon className={link.tone} />
                  <span className="truncate text-[11px] sm:text-xs">
                    {link.label}
                  </span>
                </a>
              </Button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
