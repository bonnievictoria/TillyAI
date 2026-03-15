import AIChatPanel from "@/components/chat/AIChatPanel";
import BottomNav from "@/components/BottomNav";

const Chat = () => (
  <div className="mobile-container h-dvh bg-background flex flex-col overflow-hidden">
    {/* Chat fills all space above the bottom nav (which is ~60px fixed) */}
    <div className="flex-1 overflow-hidden min-h-0 pb-[calc(56px+env(safe-area-inset-bottom,8px))]">
      <AIChatPanel isOpen={true} onClose={() => {}} embedded chatFirst />
    </div>
    <BottomNav />
  </div>
);

export default Chat;
