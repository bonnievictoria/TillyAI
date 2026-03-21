import { useState } from "react";
import AIChatPanel from "@/components/chat/AIChatPanel";
import VoiceOnboardInline from "@/components/chat/VoiceOnboardInline";
import BottomNav from "@/components/BottomNav";

type ChatMode = "chat" | "voice-onboard";

const modePills: { label: string; value: ChatMode }[] = [
  { label: "Chat", value: "chat" },
  { label: "Voice Onboard", value: "voice-onboard" },
];

const Chat = () => {
  const [mode, setMode] = useState<ChatMode>("chat");

  return (
    <div className="mobile-container h-dvh bg-background flex flex-col overflow-hidden">
      {/* Pill bar */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0">
        {modePills.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setMode(pill.value)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
              mode === pill.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden min-h-0 pb-[calc(56px+env(safe-area-inset-bottom,8px))]">
        {mode === "chat" ? (
          <AIChatPanel isOpen={true} onClose={() => {}} embedded chatFirst />
        ) : (
          <VoiceOnboardInline onComplete={() => setMode("chat")} />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
