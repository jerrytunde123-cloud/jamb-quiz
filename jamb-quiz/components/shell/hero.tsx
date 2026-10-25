import { StreakPill } from "@/components/shell/streak-pill"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute top-10 -right-32 size-72 rounded-full bg-brand-2/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.12]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-5 pt-14 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-14">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
          Free JAMB &amp; WAEC practice
        </p>

        <h1 className="mt-4 text-4xl leading-[1.03] font-black tracking-tight text-balance uppercase sm:text-6xl">
          Practice 1000+{" "}
          <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
            JAMB &amp; WAEC
          </span>{" "}
          questions
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          15 questions · 5 minutes · Randomised every attempt
        </p>

        <StreakPill />
      </div>
    </section>
  )
}
