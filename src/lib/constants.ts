export const CHANNELS = [
  {
    id: "ch1",
    label: "Join Main Channel",
    icon: "fab fa-whatsapp",
    href: "https://whatsapp.com/channel/0029VbD2bkWLNSZwxGpz2k0x",
    deepLinkCode: "0029VbD2bkWLNSZwxGpz2k0x",
  },
  {
    id: "ch2",
    label: "JAMB UTME",
    icon: "fab fa-whatsapp",
    href: "https://whatsapp.com/channel/0029VbDTOmB1t90jcv9gLf0q",
    deepLinkCode: "0029VbDTOmB1t90jcv9gLf0q",
  },
] as const;

export const OPTIONAL_CHANNEL = {
  label: "2027 JAMBITES",
  href: "https://whatsapp.com/channel/0029VbCwT4KAojYzRNFvpT1h",
  deepLinkCode: "0029VbCwT4KAojYzRNFvpT1h",
} as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];
export type Channel = (typeof CHANNELS)[number];