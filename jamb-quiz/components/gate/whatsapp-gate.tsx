"use client"

import { Check, Lock, MessageCircle, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WhatsAppChannelButton } from "@/components/gate/whatsapp-channel-button"
import { WHATSAPP_CHANNELS } from "@/lib/gate/channels"

type WhatsAppGateProps = {
  subject: { name: string } | null
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
  const [openedChannels, setOpenedChannels] = useState<ReadonlySet<string>>(
    () => new Set()
  )

  const allChannelsOpened =
    WHATSAPP_CHANNELS.length > 0 &&
    WHATSAPP_CHANNELS.every((channel) => openedChannels.has(channel.id))

  function markOpened(channelId: string) {
    setOpenedChannels((current) => {
      if (current.has(channelId)) return current

      const next = new Set(current)
      next.add(channelId)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
      >
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 rounded-full text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>

        <DialogHeader className="pr-10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <DialogTitle className="text-xl">
            Join Both Channels to Unlock
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            You must join both WhatsApp channels before starting the{" "}
            {subject?.name ?? "subject"} quiz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {WHATSAPP_CHANNELS.map((channel) => (
            <WhatsAppChannelButton
              key={channel.id}
              channel={channel}
              opened={openedChannels.has(channel.id)}
              onOpen={markOpened}
            />
          ))}
        </div>

        <div className="sticky bottom-0 z-10 -mx-6 -mb-6 rounded-b-xl border-t bg-popover px-6 pt-4 pb-6">
          <Button
            size="lg"
            className="h-12 w-full rounded-xl"
            disabled={!allChannelsOpened}
            aria-label={
              allChannelsOpened
                ? "Continue to Quiz"
                : "Join both channels to continue"
            }
            onClick={onContinue}
          >
            {allChannelsOpened ? <Check /> : <Lock />}
            Continue to Quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
