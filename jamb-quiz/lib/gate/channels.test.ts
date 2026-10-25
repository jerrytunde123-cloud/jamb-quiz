import { describe, expect, it } from "vitest"

import {
  whatsappChannelAppUrl,
  whatsappChannelHref,
  whatsappChannelWebUrl,
} from "./channels"

const CODE = "0029VbD2bkWLNSZwxGpz2k0x"

describe("WhatsApp channel links", () => {
  it("builds the official web link for desktop and fallback", () => {
    expect(whatsappChannelWebUrl(CODE)).toBe(
      `https://whatsapp.com/channel/${CODE}`
    )
  })

  it("uses an https universal link on mobile too", () => {
    expect(whatsappChannelAppUrl(CODE)).toBe(
      `https://whatsapp.com/channel/${CODE}`
    )
  })

  it("always returns the https channel URL", () => {
    expect(whatsappChannelHref(CODE)).toBe(
      `https://whatsapp.com/channel/${CODE}`
    )
  })
})
