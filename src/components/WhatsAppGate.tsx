"use client";

import { useEffect } from "react";
import { GateModal } from "./GateModal";
import { ChallengeBanner } from "./ChallengeBanner";
import { ChannelList } from "./ChannelList";
import { ContinueButton } from "./ContinueButton";
import { NicknameForm } from "./NicknameForm";
import { ShareButton } from "./ShareButton";
import { useWhatsAppChannels } from "@/hooks/useWhatsAppChannel";
import { useNickname } from "@/hooks/useNickname";
import { useGateState } from "@/hooks/useGateState";
import { CHANNELS } from "@/lib/constants";
import type { Channel } from "@/lib/constants";

interface WhatsAppGateProps {
  subjectName: string;
  subjectSlug: string;
  isOpen: boolean;
  onClose?: () => void;
  onUnlocked: (nickname: string) => void;
  challengeInfo?: {
    challenger: string;
    score: string;
  } | null;
}

export function WhatsAppGate({
  subjectName,
  subjectSlug,
  isOpen,
  onClose,
  onUnlocked,
  challengeInfo,
}: WhatsAppGateProps) {
  // Hooks
  const { channels, allReady, joinChannel } = useWhatsAppChannels(CHANNELS);
  const [nickname, setNickname, getFinalNickname] = useNickname();
  const { step, goToNickname, unlock, close, reset } = useGateState(onUnlocked, onClose);

  // Reset step when gate opens (handles re-opening after successful unlock)
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handlers
  const handleChannelClick = (channelId: Channel["id"]) => {
    joinChannel(channelId);
  };

  const handleContinue = () => {
    if (!allReady) return;
    setNickname(nickname || "");
    goToNickname();
  };

  const handleStartQuiz = () => {
    const finalNick = getFinalNickname();
    unlock(finalNick);
  };

  const handleClose = () => {
    reset();
    close();
  };

  return (
    <>
      {/* Step 1: Channel Gate */}
      <GateModal isOpen={isOpen && step === "gate"} onClose={handleClose}>
        <div className="gate-icon">
          <i className="fab fa-whatsapp" style={{ color: "#25d366" }} aria-hidden="true" />
        </div>
        <h3>Join Both Channels to Unlock</h3>
        <ChallengeBanner challengeInfo={challengeInfo} />
        {!challengeInfo && (
          <p>
            You must join <strong>both</strong> WhatsApp channels before
            starting the <strong>{subjectName}</strong> quiz.
          </p>
        )}

        <ChannelList channels={channels} onJoin={handleChannelClick} />

        <ContinueButton disabled={!allReady} onClick={handleContinue} />

        <ShareButton subjectName={subjectName} subjectSlug={subjectSlug} />
      </GateModal>

      {/* Step 2: Nickname Entry */}
      <GateModal isOpen={isOpen && step === "nickname"} onClose={handleClose}>
        <NicknameForm
          initialValue={nickname}
          onSubmit={handleStartQuiz}
          onChange={setNickname}
          subjectName={subjectName}
        />
      </GateModal>
    </>
  );
}

export default WhatsAppGate;