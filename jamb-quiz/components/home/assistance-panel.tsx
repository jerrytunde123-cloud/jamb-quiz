import {
  BookOpen,
  Globe,
  GraduationCap,
  Headset,
  Laptop,
  MessageCircle,
  Send,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const CHIPS = [
  { label: "Study materials", icon: BookOpen },
  { label: "Full CBT simulator", icon: Laptop },
  { label: "1-on-1 assistance", icon: Headset },
  { label: "Exam guide", icon: TrendingUp },
] as const

export function AssistancePanel() {
  return (
    <Card className="mt-12 gap-0 overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-brand/5 py-0 shadow-lg shadow-black/10">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">
            <GraduationCap className="size-4" />
            SUCCESS ACADEMY · UTME LAB
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Need the full exam guide &amp; preparation help?
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Go beyond practice quizzes — get complete JAMB/Past-question prep,
            study materials, CBT simulation and 1-on-1 assistance from our team.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {CHIPS.map((chip) => {
              const Icon = chip.icon

              return (
                <Badge
                  key={chip.label}
                  variant="outline"
                  className="h-7 gap-1.5 border-border/80 bg-background/40 px-2.5 text-[11px] font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5 text-brand" />
                  {chip.label}
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <Button
            asChild
            className="h-11 justify-start rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 text-primary-foreground hover:opacity-90"
          >
            <a href="https://utmelab.com" target="_blank" rel="noopener noreferrer">
              <Globe />
              Visit utmelab.com
            </a>
          </Button>

          <Button
            asChild
            className="h-11 justify-start rounded-xl bg-whatsapp px-4 text-[#052e16] hover:bg-whatsapp/90"
          >
            <a
              href="https://wa.me/2349114187843?text=Hi%2C%20I%20need%20JAMB%20assistance"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Chat on WhatsApp
            </a>
          </Button>

          <Button
            asChild
            className="h-11 justify-start rounded-xl bg-telegram px-4 text-white hover:bg-telegram/90"
          >
            <a
              href="https://t.me/Officialkingjay1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send />
              Chat on Telegram
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 justify-start rounded-xl border-border/80 bg-background/40 px-4 hover:bg-secondary"
          >
            <a
              href="https://jamb-lab.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Laptop />
              JAMB Practice (Vercel)
            </a>
          </Button>
        </div>
      </div>
    </Card>
  )
}
