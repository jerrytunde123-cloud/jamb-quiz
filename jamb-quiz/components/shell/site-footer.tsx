import { Globe, Send } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        <p className="font-medium tracking-wide text-foreground/80">
          © SUCCESS ACADEMY · UTME LAB
        </p>

        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <a
            href="https://t.me/Officialkingjay1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-brand"
          >
            <Send className="size-3.5" />
            Contact
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="https://utmelab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-brand"
          >
            <Globe className="size-3.5" />
            utmelab.com
          </a>
        </p>
      </div>
    </footer>
  )
}
