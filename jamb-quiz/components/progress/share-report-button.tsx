"use client"

import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

type ShareReportButtonProps = {
  reportPath: string
  studentName: string
}

export function ShareReportButton({
  reportPath,
  studentName,
}: ShareReportButtonProps) {
  function shareOnWhatsApp() {
    const reportUrl = new URL(reportPath, window.location.origin).toString()
    const message = `${studentName}'s JAMB progress report: ${reportUrl}`

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={shareOnWhatsApp}
    >
      <MessageCircle />
      Share on WhatsApp
    </Button>
  )
}
