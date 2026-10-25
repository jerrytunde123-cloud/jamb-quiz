"use client"

import { MessageCircle, Share2, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useLocalStorage } from "@/lib/use-local-storage"
import { WHATSAPP_CHANNELS } from "@/lib/gate/channels"
import {
  whatsappChannelHref,
} from "@/lib/gate/channels"
import { useCoarsePointer } from "@/hooks/use-coarse-pointer"

type Step = "channels" | "nickname"

type WhatsAppGateProps = {
  subject: { name: string; slug: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
}

export function WhatsAppGate({
  subject,
  open,
  onOpenChange,
  onContinue,
}: WhatsAppGateProps) {
  const [step, setStep] = useState<Step>("channels")
  const [openedChannels, setOpenedChannels] = useState<Set<string>>(new Set())
  const [nickname, setNickname] = useState("")
  const coarsePointer = useCoarsePointer()
  const [savedNickname] = useLocalStorage("jamb-quiz:nickname:v1", "")

  const allOpened =
    WHATSAPP_CHANNELS.length > 0 &&
    WHATSAPP_CHANNELS.every((ch) => openedChannels.has(ch.id))

  useEffect(() => {
    if (step === "nickname" && savedNickname && !nickname) {
      const id = window.setTimeout(() => setNickname(savedNickname), 0)
      return () => window.clearTimeout(id)
    }
  }, [step, savedNickname, nickname])

  function markOpened(id: string) {
    setOpenedChannels((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  if (!open || !subject) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[400px] max-h-[90dvh] overflow-y-auto p-0"
        style={{
          backgroundColor: "#161b22",
          borderColor: "#30363d",
          borderRadius: "14px",
        }}
      >
        <div className="flex flex-col items-center px-8 py-8 gap-4 text-center">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 rounded-full text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>

          <MessageCircle className="size-7.5 text-brand" />

          {step === "channels" ? (
            <>
              <DialogTitle className="text-base font-semibold text-brand">
                Join Both Channels to Unlock
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground max-w-[320px]">
                You must join both WhatsApp channels before starting the{" "}
                <span className="font-medium">{subject.name}</span> quiz.
              </DialogDescription>

              <div className="w-full flex flex-col items-center gap-2 mt-2">
                {WHATSAPP_CHANNELS.map((channel) => {
                  const isOpened = openedChannels.has(channel.id)
                  const href = whatsappChannelHref(channel.code)

                  return (
                    <Button
                      key={channel.id}
                      asChild
                      className="w-full h-11 rounded-lg text-sm font-medium gap-2"
                      style={{
                        backgroundColor: isOpened ? "#22c55e" : "#25d366",
                        color: "#052e16",
                      }}
                    >
                      <a
                        href={href}
                        target={coarsePointer ? undefined : "_blank"}
                        rel={coarsePointer ? undefined : "noopener noreferrer"}
                        onClick={() => markOpened(channel.id)}
                        className="flex w-full items-center justify-center gap-2"
                      >
                        <MessageCircle className="size-5" />
                        {isOpened ? "Opened" : `Join ${channel.name}`}
                      </a>
                    </Button>
                  )
                })}

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-10 rounded-lg border-whatsapp text-whatsapp hover:bg-whatsapp/10"
                >
                  <a
                    href="https://wa.me/?text=Join%20me%20for%20free%20JAMB%20practice%20at%20SUCCESS%20ACADEMY%20UTME%20LAB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Share2 className="size-4.5" />
                    Share with Friends on WhatsApp
                  </a>
                </Button>

                <p className="text-[11px] text-muted-foreground">
                  Optional channel: 2027 JAMBITES
                </p>

                <Button
                  size="lg"
                  className="w-full h-12 rounded-lg mt-2 font-bold"
                  disabled={!allOpened}
                  onClick={() => setStep("nickname")}
                  style={{
                    background: allOpened
                      ? "linear-gradient(135deg, #f5a623 0%, #ff6b35 100%)"
                      : "linear-gradient(135deg, #f5a62388 0%, #ff6b3588 100%)",
                    color: allOpened ? "#000" : "#0008",
                  }}
                >
                  {allOpened ? "Continue to Nickname" : "Join both channels first"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="text-base font-semibold text-brand">
                Enter Your Nickname
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground max-w-[320px]">
                This will appear on the{" "}
                <span className="font-medium">{subject.name}</span> leaderboard.
              </DialogDescription>

              <div className="w-full max-w-[320px] space-y-2">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="nickname" className="text-sm font-medium">
                    Nickname
                  </Label>
                  <Input
                    id="nickname"
                    maxLength={20}
                    placeholder="e.g. Scholar01"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    className="text-center"
                    style={{ backgroundColor: "#0d1117", borderColor: "#30363d" }}
                  />
                  <p className="text-[11px] text-muted-foreground text-right">
                    {nickname.length}/20
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full h-12 rounded-lg mt-2 font-bold"
                  disabled={!nickname.trim()}
                  onClick={() => {
                    try {
                      window.localStorage.setItem(
                        "jamb-quiz:nickname:v1",
                        nickname.trim().slice(0, 20)
                      )
                    } catch {}
                    onContinue()
                  }}
                  style={{
                    background: nickname.trim()
                      ? "linear-gradient(135deg, #f5a623 0%, #ff6b35 100%)"
                      : "linear-gradient(135deg, #f5a62388 0%, #ff6b3588 100%)",
                    color: nickname.trim() ? "#000" : "#0008",
                  }}
                >
                  Start Quiz
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}