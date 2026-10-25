import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ReportNotFound() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">JAMB Readiness</p>
            <p className="text-[11px] text-muted-foreground">
              Progress report
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            This report link is not valid.
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask the student to share a fresh link from their progress page.
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/">Open JAMB Readiness</Link>
        </Button>
      </main>
    </div>
  )
}
