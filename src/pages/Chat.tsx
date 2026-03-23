import { useState } from "react";
import AIChatPanel from "@/components/chat/AIChatPanel";
import VoiceOnboardInline from "@/components/chat/VoiceOnboardInline";
import BottomNav from "@/components/BottomNav";

const Chat = () => {
  const [voiceOnboardActive, setVoiceOnboardActive] = useState(false);
  const [onboardComplete, setOnboardComplete] = useState(false);

  const handleVoiceOnboardComplete = () => {
    setVoiceOnboardActive(false);
    setOnboardComplete(true);
  };

  return (
    <div className="mobile-container h-dvh bg-background flex flex-col overflow-hidden">
      {/* Content area */}
      <div className="flex-1 overflow-hidden min-h-0 pb-[calc(56px+env(safe-area-inset-bottom,8px))]">
        {voiceOnboardActive ? (
          <VoiceOnboardInline onComplete={handleVoiceOnboardComplete} />
        ) : (
          <AIChatPanel
            isOpen={true}
            onClose={() => {}}
            embedded
            chatFirst
            onVoiceOnboard={() => setVoiceOnboardActive(true)}
            completionMessage={onboardComplete ? "Great — your investment profile is complete! I've saved everything." : undefined}
            onCompletionShown={() => setOnboardComplete(false)}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
