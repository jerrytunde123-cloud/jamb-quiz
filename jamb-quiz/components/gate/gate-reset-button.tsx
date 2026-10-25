"use client"

import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { lockGate } from "@/lib/gate/store"

export function GateResetButton() {
  const router = useRouter()

  function resetGate() {
    lockGate()
    router.push("/quiz")
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full text-muted-foreground"
      onClick={resetGate}
    >
      <RotateCcw />
      Use a different WhatsApp account
    </Button>
  )
}
