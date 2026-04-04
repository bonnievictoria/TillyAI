import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AIChatPanel from "@/components/chat/AIChatPanel";
import BottomNav from "@/components/BottomNav";

const PORTFOLIO_MESSAGE =
  "Your portfolio is built around a diversified mix of Indian equity ETFs (Nifty 50, Next 50, Midcap 150), a US equity allocation via the S&P 500, government bonds through Bharat Bond, and tactical positions in sectoral (PSU Banks, IT) and gold ETFs. This blend was recommended to balance long-term growth from equities with stability from bonds and inflation protection from gold — all calibrated to your risk profile and goals. The aim is steady, risk-adjusted wealth accumulation while keeping costs low through passive ETFs.\n\nFeel free to ask me anything about your portfolio.";

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromExecute = searchParams.get("from") === "execute";

  return (
    <div className="mobile-container h-dvh bg-background flex flex-col overflow-hidden">
      {fromExecute && (
        <button
          onClick={() => navigate("/execute")}
          className="flex items-center gap-1 px-4 pt-3 pb-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portfolio
        </button>
      )}
      <div className="flex-1 overflow-hidden min-h-0 pb-[calc(56px+env(safe-area-inset-bottom,8px))]">
        <AIChatPanel
          isOpen={true}
          onClose={() => {}}
          embedded
          chatFirst
          initialAiMessage={fromExecute ? PORTFOLIO_MESSAGE : undefined}
        />
      </div>
      <BottomNav />
    </div>
  );
};

export default Chat;
