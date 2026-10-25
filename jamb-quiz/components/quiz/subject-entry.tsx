"use client"

import Link from "next/link"
import { ArrowLeft, Check, Lock, MessageCircle } from "lucide-react"
import { useState } from "react"

import { WhatsAppGate } from "@/components/gate/whatsapp-gate"
import { QuizRunner } from "@/components/quiz/quiz-runner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWhatsAppGate } from "@/hooks/use-whatsapp-gate"

type SubjectEntryProps = {
  subject: { slug: string; name: string }
}

export function SubjectEntry({ subject }: SubjectEntryProps) {
  const gate = useWhatsAppGate()
  const [gateOpen, setGateOpen] = useState(false)

  if (!gate.isUnlocked) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/quiz">
            <ArrowLeft />
            Subjects
          </Link>
        </Button>

        <main className="flex flex-1 flex-col justify-center gap-6 py-10">
          <div className="space-y-3">
            <Badge variant="secondary">
              <Lock />
              Locked
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight">
              {subject.name}
            </h1>
            <p className="text-muted-foreground">
              Join our WhatsApp channel to unlock this subject. One join
              unlocks every subject on this device for 30 days.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="h-12 w-full rounded-xl"
              onClick={() => setGateOpen(true)}
            >
              <MessageCircle />
              Unlock with WhatsApp
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Takes about 10 seconds. No phone number needed.
            </p>
          </div>
        </main>

        <WhatsAppGate
          subject={subject}
          open={gateOpen}
          onOpenChange={setGateOpen}
          onContinue={() => {
            gate.unlock()
            setGateOpen(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/quiz">
            <ArrowLeft />
            Subjects
          </Link>
        </Button>

        <Badge variant="secondary">
          <Check />
          Unlocked
        </Badge>
      </div>

      <QuizRunner subject={subject} />
    </div>
  )
}
