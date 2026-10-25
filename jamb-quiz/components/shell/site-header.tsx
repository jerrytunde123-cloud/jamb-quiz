import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Headset, Menu, MessageCircle, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const CHANNELS = [
  {
    label: "Main Channel",
    description: "Daily questions, exam tips and study updates.",
    href: "https://whatsapp.com/channel/0029VbChP246LwHsgqriNd3t",
    icon: MessageCircle,
    iconClassName: "text-whatsapp",
  },
  {
    label: "Telegram",
    description: "Free materials and revision drops.",
    href: "https://t.me/freewassceditto",
    icon: Send,
    iconClassName: "text-telegram",
  },
  {
    label: "Contact",
    description: "Talk to the team about prep and support.",
    href: "https://t.me/Officialkingjay1",
    icon: Headset,
    iconClassName: "text-brand",
  },
] as const

function Brand() {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="relative flex size-10 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-white/5 transition-colors group-hover:border-brand/40">
        <Image
          src="/logo.png"
          alt="Success Academy"
          fill
          priority
          sizes="40px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[12px] font-extrabold tracking-[0.15em] text-foreground sm:text-[13px]">
          SUCCESS ACADEMY
        </span>
        <span className="block truncate text-[9px] font-medium tracking-[0.08em] text-muted-foreground uppercase sm:text-[10px]">
          UTME LAB · JAMB/WAEC
          <span className="hidden sm:inline"> Practice</span>
        </span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />

        <nav
          aria-label="Community links"
          className="hidden items-center gap-1 md:flex"
        >
          {CHANNELS.map((channel, index) => {
            const Icon = channel.icon

            return (
              <Button
                key={channel.label}
                asChild
                variant={index === 0 ? "outline" : "ghost"}
                size="sm"
                className={
                  index === 0
                    ? "h-9 rounded-full border-brand/25 bg-brand/10 px-3.5 text-brand hover:border-brand/40 hover:bg-brand/15 hover:text-brand"
                    : "h-9 rounded-full px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              >
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className={channel.iconClassName} />
                  {channel.label}
                </a>
              </Button>
            )
          })}
        </nav>

        <div className="flex items-center gap-1.5 md:hidden">
          <Button
            asChild
            size="sm"
            className="h-9 rounded-full px-3.5 shadow-sm shadow-brand/10"
          >
            <a
              href={CHANNELS[0].href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Join
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[88%] max-w-sm gap-0 p-0"
            >
              <SheetHeader className="border-b border-border/70 p-5 pr-12">
                <SheetTitle className="flex items-center gap-3">
                  <span className="relative flex size-10 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card">
                    <Image
                      src="/logo.png"
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-extrabold tracking-[0.08em]">
                      SUCCESS ACADEMY
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
                      JAMB/WAEC Practice
                    </span>
                  </span>
                </SheetTitle>
                <SheetDescription className="pt-2">
                  Join the community, get study updates, or reach the team.
                </SheetDescription>
              </SheetHeader>

              <nav
                aria-label="Community links"
                className="flex flex-col gap-1 p-3"
              >
                {CHANNELS.map((channel) => {
                  const Icon = channel.icon

                  return (
                    <SheetClose key={channel.label} asChild>
                      <a
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/60">
                          <Icon className={`size-4.5 ${channel.iconClassName}`} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">
                            {channel.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                            {channel.description}
                          </span>
                        </span>

                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
                      </a>
                    </SheetClose>
                  )
                })}
              </nav>

              <SheetFooter className="mt-auto border-t border-border/70 p-5">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  15 questions · 5 minutes · free JAMB &amp; WAEC practice.
                </p>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
