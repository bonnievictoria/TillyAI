import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import NetWorthSparkline from "./NetWorthSparkline";
import CurrentAllocationCard from "./CurrentAllocationCard";
import DailyInsights from "./DailyInsights";
import ProfileButton from "./ProfileButton";

const PortfolioDashboard = () => {
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<"1M" | "6M" | "1Y" | "All">("All");

  return (
    <div className="mobile-container bg-background flex flex-col min-h-screen">
      {/* Top bar with profile button */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div>
          <p className="text-xs text-muted-foreground">Total Portfolio</p>
        </div>
        <ProfileButton />
      </div>

      {/* Hero net worth */}
      <div className="px-5 pb-2">
        <div className="flex items-center gap-2.5">
          <p className="text-2xl font-bold text-foreground tracking-tight">₹47,82,350</p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-wealth-green/15 px-2 py-0.5 text-[10px] font-semibold text-wealth-green">
            <TrendingUp className="h-2.5 w-2.5" /> +12.4%
          </span>
        </div>
      </div>

      {/* Time period chips */}
      <div className="px-5 pb-2">
        <div className="flex gap-1.5">
          {(["1M", "6M", "1Y", "All"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                timePeriod === period
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/60 text-muted-foreground/50 hover:text-muted-foreground/70"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Sparkline chart */}
      <div className="px-5 pb-2">
        <NetWorthSparkline />
      </div>

      {/* Current Allocation */}
      <div className="px-5 pb-2">
        <CurrentAllocationCard />
      </div>

      {/* Asset breakdown */}
      <div className="px-5 pb-2">
        {[
          { label: "Equity", value: "₹29.6L", change: "+18.2%", positive: true },
          { label: "Debt", value: "₹11.5L", change: "+6.8%", positive: true },
          { label: "Real Estate", value: "₹5.2L", change: "+3.1%", positive: true },
          { label: "Cash & Others", value: "₹1.5L", change: "-0.2%", positive: false },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-foreground">{item.value}</span>
                <span className={`text-[10px] font-medium ${item.positive ? "text-wealth-green" : "text-destructive"}`}>{item.change}</span>
              </div>
            </div>
            {i < arr.length - 1 && <div className="h-px bg-border/20" />}
          </div>
        ))}
      </div>

      <div className="px-5 pb-24">
        <DailyInsights />
      </div>

      {/* Discovery FAB */}
      <motion.button
        onClick={() => navigate("/discovery")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-20 right-5 z-40 flex h-12 items-center gap-2 rounded-full px-4 wealth-gradient"
        style={{
          boxShadow:
            "0 4px 24px -4px hsl(var(--wealth-navy) / 0.5), 0 0 16px 2px hsl(var(--wealth-blue) / 0.25)",
        }}
      >
        <Compass className="h-4 w-4 text-primary-foreground" />
        <span className="text-xs font-semibold text-primary-foreground">Discovery</span>
      </motion.button>

      <BottomNav />
    </div>
  );
};

export default PortfolioDashboard;
