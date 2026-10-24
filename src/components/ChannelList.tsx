"use client";

import type { Channel } from "@/lib/constants";
import { ChannelButton } from "./ChannelButton";

interface ChannelListProps {
  channels: Array<Channel & { status: "idle" | "pending" | "done"; secondsLeft: number }>;
  onJoin: (channelId: Channel["id"]) => void;
}

/**
 * List of channel buttons.
 */
export function ChannelList({ channels, onJoin }: ChannelListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {channels.map((channel) => (
        <ChannelButton key={channel.id} channel={channel} onJoin={onJoin} />
      ))}
    </div>
  );
}