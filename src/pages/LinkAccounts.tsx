import { motion } from "framer-motion";
import { Check, ChevronRight, Shield, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Landmark, TrendingUp, Package } from "lucide-react";

const CONNECTED_ACCOUNTS = [
  {
    icon: BarChart3,
    title: "Mutual funds",
    subtitle: "CAMS, Karvy & all AMCs",
  },
  {
    icon: Landmark,
    title: "Bank account",
    subtitle: "All banks via account aggregator",
  },
];

const AVAILABLE_ACCOUNTS = [
  {
    icon: TrendingUp,
    title: "Stocks",
    subtitle: "NSE, BSE via CDSL / NSDL",
  },
  {
    icon: Package,
    title: "Others",
    subtitle: "NPS, PPF, Gold, Real estate...",
  },
];

const LinkAccounts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 pt-8 pb-6">
      {/* Stepper */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-0 mb-8 w-full max-w-[340px]"
      >
        {/* Step 1 */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(160_50%_38%)]">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5">About you</span>
        </div>

        {/* Divider */}
        <div className="flex-1 h-[1.5px] bg-border mx-2 mt-[-14px]" />

        {/* Step 2 */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
            <span className="text-xs font-semibold text-primary-foreground">2</span>
          </div>
          <span className="text-[10px] text-foreground font-medium mt-1.5">Link accounts</span>
        </div>
      </motion.div>

      {/* Timer pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-3 mb-6"
      >
        <span className="rounded-full bg-secondary px-3 py-1 text-[14.4px] font-medium text-muted-foreground">
          ~30 secs
        </span>
        <span className="rounded-full bg-secondary px-3 py-1 text-[14.4px] font-medium text-muted-foreground">
          ~90 secs
        </span>
      </motion.div>

      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-[340px] mb-5"
      >
        <h1 className="text-xl font-semibold text-foreground">Link your accounts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select accounts to get a complete picture
        </p>
      </motion.div>

      {/* Account cards */}
      <div className="w-full max-w-[340px] flex flex-col gap-1.5">
        {/* Connected accounts */}
        {CONNECTED_ACCOUNTS.map((acc, i) => (
          <motion.div
            key={acc.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="flex items-center gap-3 border rounded-[10px] px-3.5 py-3"
            style={{
              backgroundColor: "#f1f8f1",
              borderColor: "#a5d6a7",
            }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#e8f5e9" }}>
              <acc.icon className="h-4 w-4" style={{ color: "#4caf50" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground">{acc.title}</p>
              <p className="text-[11px] text-muted-foreground">{acc.subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium" style={{ color: "#4caf50" }}>Connected</span>
              <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: "#4caf50" }}>
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Available accounts */}
        {AVAILABLE_ACCOUNTS.map((acc, i) => (
          <motion.div
            key={acc.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="flex items-center gap-3 border border-border rounded-[10px] bg-card px-3.5 py-3 cursor-pointer hover:bg-accent/10 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <acc.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground">{acc.title}</p>
              <p className="text-[11px] text-muted-foreground">{acc.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Trust badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-1.5 mt-8 mb-4"
      >
        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          Secured by RBI-regulated account aggregator
        </span>
      </motion.div>

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-[340px] flex items-center justify-between"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem("completedLinkAccounts", "true");
            navigate("/landing");
          }}
          className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          style={{ backgroundColor: "hsl(222 47% 14%)" }}
        >
          Generate my portfolio
          <Sparkles className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </div>
  );
};

export default LinkAccounts;
