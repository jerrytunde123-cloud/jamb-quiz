"use client"

import { Check, ExternalLink, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCoarsePointer } from "@/hooks/use-coarse-pointer"
import {
  whatsappChannelHref,
  type WhatsAppChannel,
} from "@/lib/gate/channels"
import { cn } from "@/lib/utils"

type WhatsAppChannelButtonProps = {
  channel: WhatsAppChannel
  opened: boolean
  onOpen: (channelId: WhatsAppChannel["id"]) => void
}

export function WhatsAppChannelButton({
  channel,
  opened,
  onOpen,
}: WhatsAppChannelButtonProps) {
  const coarsePointer = useCoarsePointer()
  const href = whatsappChannelHref(channel.code)

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        opened
          ? "border-primary/40 bg-primary/5"
          : "border-border/70 bg-background"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            opened
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          {opened ? (
            <Check className="size-5" />
          ) : (
            <MessageCircle className="size-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{channel.name}</p>
          {channel.followers ? (
            <p className="mt-1 text-xs font-medium text-primary">
              {channel.followers}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        asChild
        variant={opened ? "secondary" : "default"}
        className="mt-3 h-11 w-full rounded-lg"
      >
        <a
          href={href}
          target={coarsePointer ? undefined : "_blank"}
          rel={coarsePointer ? undefined : "noopener noreferrer"}
          onClick={() => onOpen(channel.id)}
        >
          {opened ? "Open again" : `Join ${channel.name}`}
          <ExternalLink />
        </a>
      </Button>


    </div>
  )
}
