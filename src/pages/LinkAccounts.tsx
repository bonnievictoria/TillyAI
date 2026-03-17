import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronDown, Shield, ArrowLeft, ArrowRight, X, Search, Plus, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, Package } from "lucide-react";
import { Input } from "@/components/ui/input";

/* ─── Data ─── */
const CONNECTED_ACCOUNTS = [
  { icon: BarChart3, title: "Mutual funds", subtitle: "CAMS, Karvy & all AMCs" },
  { icon: Landmark, title: "Bank account", subtitle: "All banks via account aggregator" },
];

const BROKERS = [
  { name: "Zerodha" },
  { name: "Groww" },
  { name: "Upstox" },
  { name: "Angel One" },
  { name: "ICICI Direct" },
  { name: "HDFC Securities" },
  { name: "Motilal Oswal" },
  { name: "5Paisa" },
];

const LinkAccounts = () => {
  const navigate = useNavigate();
  const [showStocksModal, setShowStocksModal] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [selectedBanks, setSelectedBanks] = useState<Set<string>>(new Set());
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [otherAssets, setOtherAssets] = useState([{ name: "", amount: "" }]);

  const filteredBanks = BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      b.full.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const toggleBank = (name: string) => {
    setSelectedBanks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addAssetRow = () => setOtherAssets((prev) => [...prev, { name: "", amount: "" }]);

  const updateAsset = (idx: number, field: "name" | "amount", value: string) => {
    setOtherAssets((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 pt-8 pb-6">
      {/* Stepper — Step 1 active, Step 2 inactive */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-0 mb-6 w-full max-w-[340px]"
      >
        {/* Step 1 — active */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
            <span className="text-xs font-semibold text-primary-foreground">1</span>
          </div>
          <span className="text-[10px] text-foreground font-medium mt-1.5">Link accounts</span>
          <span className="text-[10px] text-muted-foreground">~90 secs</span>
        </div>

        {/* Divider */}
        <div className="flex-1 h-[1.5px] bg-border mx-2 mt-[-22px]" />

        {/* Step 2 — inactive */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
            <span className="text-xs font-semibold text-muted-foreground">2</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5">About you</span>
          <span className="text-[10px] text-muted-foreground">~30 secs</span>
        </div>
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
            style={{ backgroundColor: "hsl(120 30% 96%)", borderColor: "hsl(120 30% 75%)" }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(120 30% 93%)" }}>
              <acc.icon className="h-4 w-4" style={{ color: "hsl(120 40% 45%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground">{acc.title}</p>
              <p className="text-[11px] text-muted-foreground">{acc.subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium" style={{ color: "hsl(120 40% 45%)" }}>Connected</span>
              <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: "hsl(120 40% 45%)" }}>
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Stocks card — opens modal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3 border border-border rounded-[10px] bg-card px-3.5 py-3 cursor-pointer hover:bg-accent/10 transition-colors"
          onClick={() => setShowStocksModal(true)}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground">Stocks</p>
            <p className="text-[11px] text-muted-foreground">NSE, BSE via CDSL / NSDL</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.div>

        {/* Others card — expandable inline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border rounded-[10px] bg-card overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-accent/10 transition-colors"
            onClick={() => setOthersExpanded(!othersExpanded)}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground">Others</p>
              <p className="text-[11px] text-muted-foreground">NPS, PPF, Gold, Real estate...</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${othersExpanded ? "rotate-180" : ""}`} />
          </div>

          <AnimatePresence>
            {othersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-3.5 pb-3 space-y-2">
                  {otherAssets.map((asset, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. NPS"
                        value={asset.name}
                        onChange={(e) => updateAsset(idx, "name", e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                      />
                      <input
                        type="number"
                        placeholder="₹ Amount"
                        value={asset.amount}
                        onChange={(e) => updateAsset(idx, "amount", e.target.value)}
                        className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addAssetRow}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add another asset
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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

      {/* Bottom actions — centered, stacked */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-[340px] flex flex-col items-center gap-3"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem("completedLinkAccounts", "true");
            navigate("/about-you");
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-3.5 text-[15px] font-semibold text-primary-foreground"
          style={{ backgroundColor: "hsl(222 47% 14%)" }}
        >
          Tell us about you
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Stocks Modal */}
      <AnimatePresence>
        {showStocksModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStocksModal(false)}
          >
            <motion.div
              className="relative bg-card shadow-xl flex flex-col"
              style={{ width: "88%", maxWidth: 340, borderRadius: 16, padding: 24, maxHeight: "80vh" }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <button
                onClick={() => setShowStocksModal(false)}
                className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-opacity hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="font-medium text-foreground" style={{ fontSize: 17 }}>
                Link Bank account
              </h2>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1 space-y-1.5" style={{ maxHeight: 280 }}>
                {filteredBanks.map((bank) => {
                  const isSelected = selectedBanks.has(bank.name);
                  return (
                    <button
                      key={bank.name}
                      onClick={() => toggleBank(bank.name)}
                      className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-background hover:bg-accent/40"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{bank.name}</p>
                        <p className="text-[11px] text-muted-foreground">{bank.type}</p>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowStocksModal(false)}
                disabled={selectedBanks.size === 0}
                className="w-full mt-4 rounded-xl py-3 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-40 disabled:pointer-events-none"
                style={{ backgroundColor: "hsl(222 47% 14%)" }}
              >
                Link selected
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LinkAccounts;
