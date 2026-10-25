export type WhatsAppChannelId = "main" | "utme"

export type WhatsAppChannel = {
  id: WhatsAppChannelId
  name: string
  description: string
  code: string
  required: boolean
  followers?: string
}

/**
 * The channel codes are the public invite codes from the parent app.
 * Both channels are required — this is the client's gate, not an optional
 * growth suggestion.
 */
export const WHATSAPP_CHANNELS: readonly WhatsAppChannel[] = [
  {
    id: "main",
    name: "Main Channel",
    description: "Daily JAMB questions, exam tips, and study updates.",
    code: "0029VbD2bkWLNSZwxGpz2k0x",
    required: true,
    followers: "Join 13K+ students",
  },
  {
    id: "utme",
    name: "JAMB UTME",
    description: "More practice updates and announcements.",
    code: "0029VbDTOmB1t90jcv9gLf0q",
    required: true,
  },
]

export function whatsappChannelWebUrl(code: string): string {
  return `https://whatsapp.com/channel/${code}`
}

/**
 * WhatsApp's own channel invite page uses this exact scheme for mobile
 * visitors: `whatsapp://channel/<code>`. Keeping it behind a coarse-pointer
 * check means desktop users still get the https page, and the server-rendered
 * HTML never contains a scheme that a desktop browser cannot handle.
 */
export function whatsappChannelAppUrl(code: string): string {
  // iOS Safari does not reliably open the custom `whatsapp://` scheme from a
  // tap; the https channel URL is a universal link that opens the app when
  // installed and falls back to the web page otherwise.
  return `https://whatsapp.com/channel/${code}`
}

export function whatsappChannelHref(code: string): string {
  return whatsappChannelWebUrl(code)
}
