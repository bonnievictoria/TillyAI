import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, RotateCcw, AlertTriangle, Mic } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AIChatSheet from "@/components/dashboard/AIChatSheet";

/* ── ETF Data ── */
interface ETF {
  name: string;
  shortName: string;
  description: string;
  allocation: number;
  amount: number;
  category: string;
  color: string;
  exchange: string;
  houseRec: boolean;
  customerPref?: boolean;
  returns1Y: string;
  returns2Y: string;
  returns3Y: string;
  expenseRatio: string;
  exitLoad: string;
  minInvestment: string;
}

const TOTAL = 8300000;

/* Category colors — private bank palette */
const CAT_COLORS: Record<string, string> = {
  "India Equity": "#1B3A6B",
  "US Equity": "#4A7FA5",
  "Bonds": "#8BA7BC",
  "Sectoral": "#C4B99A",
  "Gold": "#D4AF70",
};

const defaultETFs: ETF[] = [
  { name: "Nifty 50 ETF (Nippon)", shortName: "Nifty 50", description: "India large-cap, tracks Nifty 50", allocation: 30, amount: 2490000, category: "India Equity", color: CAT_COLORS["India Equity"], exchange: "NSE", houseRec: true, returns1Y: "+14.8%", returns2Y: "+12.6%", returns3Y: "+13.2%", expenseRatio: "0.05%", exitLoad: "Nil", minInvestment: "1 unit (~₹240)" },
  { name: "Nifty Next 50 ETF (ICICI)", shortName: "Next 50", description: "India mid-large, next 50 companies", allocation: 15, amount: 1245000, category: "India Equity", color: CAT_COLORS["India Equity"], exchange: "NSE", houseRec: true, returns1Y: "+18.2%", returns2Y: "+14.1%", returns3Y: "+15.7%", expenseRatio: "0.08%", exitLoad: "Nil", minInvestment: "1 unit (~₹58)" },
  { name: "Nifty Midcap 150 ETF (Motilal)", shortName: "Midcap 150", description: "India mid-cap growth exposure", allocation: 10, amount: 830000, category: "India Equity", color: CAT_COLORS["India Equity"], exchange: "NSE", houseRec: true, returns1Y: "+22.4%", returns2Y: "+16.8%", returns3Y: "+18.1%", expenseRatio: "0.12%", exitLoad: "Nil", minInvestment: "1 unit (~₹16)" },
  { name: "S&P 500 ETF (Mirae)", shortName: "S&P 500", description: "US large-cap equities, customer preference", allocation: 5, amount: 415000, category: "US Equity", color: CAT_COLORS["US Equity"], exchange: "NSE", houseRec: false, customerPref: true, returns1Y: "+26.3%", returns2Y: "+18.4%", returns3Y: "+20.1%", expenseRatio: "0.18%", exitLoad: "Nil", minInvestment: "₹500" },
  { name: "Bharat Bond ETF (2032)", shortName: "Bharat Bond", description: "AAA-rated PSU bonds, low risk", allocation: 20, amount: 1660000, category: "Bonds", color: CAT_COLORS["Bonds"], exchange: "NSE", houseRec: true, returns1Y: "+7.2%", returns2Y: "+6.8%", returns3Y: "+7.5%", expenseRatio: "0.0005%", exitLoad: "Nil", minInvestment: "1 unit (~₹1,250)" },
  { name: "Nifty PSU Bank ETF (SBI)", shortName: "PSU Bank", description: "Indian public sector banks", allocation: 8, amount: 664000, category: "Sectoral", color: CAT_COLORS["Sectoral"], exchange: "BSE", houseRec: true, returns1Y: "+16.1%", returns2Y: "+28.4%", returns3Y: "+24.6%", expenseRatio: "0.20%", exitLoad: "Nil", minInvestment: "1 unit (~₹64)" },
  { name: "Gold ETF (HDFC)", shortName: "Gold", description: "Physical gold, inflation hedge", allocation: 7, amount: 581000, category: "Gold", color: CAT_COLORS["Gold"], exchange: "NSE", houseRec: true, returns1Y: "+12.8%", returns2Y: "+10.2%", returns3Y: "+11.4%", expenseRatio: "0.15%", exitLoad: "Nil", minInvestment: "1 unit (~₹58)" },
  { name: "Nifty IT ETF (Kotak)", shortName: "IT ETF", description: "Indian IT sector exposure", allocation: 5, amount: 415000, category: "Sectoral", color: CAT_COLORS["Sectoral"], exchange: "NSE", houseRec: true, returns1Y: "+19.6%", returns2Y: "+8.4%", returns3Y: "+12.3%", expenseRatio: "0.20%", exitLoad: "Nil", minInvestment: "1 unit (~₹38)" },
];

/* ── Helpers ── */
const TILLY_RATIONALE: Record<string, string> = {
  "Nifty 50 ETF (Nippon)": "A core holding for any long-term Indian investor. Low cost, highly liquid, and tracks the 50 largest companies in India. Ideal as the foundation of your portfolio given your long-term horizon.",
  "Nifty Next 50 ETF (ICICI)": "Bridges large and mid-cap exposure. Historically outperforms Nifty 50 over 7+ year periods with moderate additional volatility. Suits your growth objective.",
  "Nifty Midcap 150 ETF (Motilal)": "Higher growth potential with increased short-term volatility. Recommended at 10% to add upside without overconcentrating in mid-cap risk.",
  "S&P 500 ETF (Mirae)": "Added at 5% based on your preference for US exposure. Provides geographic diversification and access to global technology leaders outside India.",
  "Bharat Bond ETF (2032)": "AAA-rated PSU bonds providing stability and predictable returns. Anchors the portfolio against equity volatility. The 2032 maturity aligns with a medium-to-long investment window.",
  "Nifty PSU Bank ETF (SBI)": "Tactical exposure to Indian public sector banks, which trade at a discount to private peers. Included for value upside as the rate cycle turns.",
  "Gold ETF (HDFC)": "Gold acts as a hedge against inflation and currency depreciation. A 7% allocation is within the classical 5–10% range advised for balanced portfolios.",
  "Nifty IT ETF (Kotak)": "India's IT sector offers export-linked dollar revenues. Included for diversification against domestic macro risk and long-term structural growth.",
};

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

/* ── Donut chart (SVG) — compact 140px ── */
const DonutChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 140;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {data.map((seg) => {
          const pct = seg.value / total;
          const dashLen = pct * circumference;
          const dashOff = cumulative * circumference;
          cumulative += pct;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-dashOff}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-base font-bold text-foreground">₹83L</p>
        <p className="text-[9px] text-muted-foreground">Total</p>
      </div>
    </div>
  );
};

/* ── Page ── */
const Invest = () => {
  const houseAllocations = defaultETFs.map((e) => e.allocation);
  const [allocations, setAllocations] = useState<number[]>(houseAllocations);
  const [selectedETF, setSelectedETF] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showTillyPill, setShowTillyPill] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowTillyPill(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const totalAlloc = allocations.reduce((s, a) => s + a, 0);
  const isValid = totalAlloc === 100;

  const handleSlider = useCallback((idx: number, val: number) => {
    setAllocations((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  const resetToHouse = () => setAllocations([...houseAllocations]);

  // Build donut data by grouping categories
  const categoryMap = new Map<string, { value: number; color: string }>();
  defaultETFs.forEach((etf, i) => {
    const existing = categoryMap.get(etf.category);
    if (existing) {
      existing.value += allocations[i];
    } else {
      categoryMap.set(etf.category, { value: allocations[i], color: etf.color });
    }
  });
  const donutData = Array.from(categoryMap.entries()).map(([label, d]) => ({
    label,
    value: d.value,
    color: d.color,
  }));

  const activeETF = selectedETF !== null ? defaultETFs[selectedETF] : null;

  return (
    <div className="mobile-container bg-background min-h-screen pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-1">
        <h1 className="text-xl font-bold text-foreground">Recommended investment plan</h1>
        <p className="text-sm text-foreground/80 mt-0.5">Recommended portfolio · ₹83,00,000 (~£100,000)</p>
        <p className="text-xs text-muted-foreground mt-0.5">Built around your goals and risk profile</p>
      </div>

      <div className="pb-32">
        {/* Donut + Legend */}
        <div className="px-5 py-6">
          <div className="flex items-start gap-5">
            <DonutChart data={donutData} />
            <div className="flex-1 pt-2">
              <div className="grid grid-cols-1 gap-2">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center gap-2.5">
                    <div className="h-[10px] w-[10px] rounded-[2px] shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-foreground flex-1 truncate">{d.label}</span>
                    <span className="text-xs font-bold text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ETF Cards */}
        <div className="px-5 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recommended ETF Allocation</p>
          <div className="space-y-2.5">
            {defaultETFs.map((etf, i) => (
              <motion.button
                key={etf.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedETF(i)}
                className="w-full rounded-2xl bg-card border border-border p-4 text-left transition-all hover:shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-1.5 rounded-full shrink-0" style={{ backgroundColor: etf.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground leading-tight">{etf.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{etf.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-foreground">{allocations[i]}%</p>
                        <p className="text-[11px] text-muted-foreground">{formatINR(TOTAL * allocations[i] / 100)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{etf.category}</span>
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{etf.exchange}</span>
                      {etf.houseRec && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" /> House rec.
                        </span>
                      )}
                      {etf.customerPref && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Customer preference
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Allocation Editor */}
        <div className="px-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Adjust your allocation</p>
          <p className="text-[11px] text-muted-foreground mb-4">Drag to customise · House recommendation shown in green</p>

          <div className="space-y-4">
            {defaultETFs.map((etf, i) => {
              const housePct = houseAllocations[i];
              return (
                <div key={etf.shortName}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{etf.shortName}</span>
                    <span className={`text-xs font-bold ${allocations[i] !== housePct ? "text-foreground" : "text-[hsl(var(--wealth-green))]"}`}>
                      {allocations[i]}%
                    </span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <div className="absolute inset-x-0 h-1.5 rounded-full bg-secondary" />
                    <div
                      className="absolute left-0 h-1.5 rounded-full bg-primary/60"
                      style={{ width: `${allocations[i]}%` }}
                    />
                    <div
                      className="absolute h-3.5 w-0.5 rounded-full bg-[hsl(var(--wealth-green))] z-10"
                      style={{ left: `${housePct}%`, transform: "translateX(-50%)" }}
                      title={`House: ${housePct}%`}
                    />
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={allocations[i]}
                      onChange={(e) => handleSlider(i, Number(e.target.value))}
                      className="absolute inset-x-0 h-6 w-full appearance-none bg-transparent cursor-pointer z-20
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm
                        [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total counter */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Total:</span>
              <span className={`text-sm font-bold ${isValid ? "text-[hsl(var(--wealth-green))]" : "text-destructive"}`}>
                {totalAlloc}%
              </span>
              {!isValid && (
                <span className="flex items-center gap-1 text-[10px] text-destructive">
                  <AlertTriangle className="h-3 w-3" /> Allocation must total 100%
                </span>
              )}
            </div>
            <button
              onClick={resetToHouse}
              className="flex items-center gap-1 text-[11px] text-primary font-medium hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Reset to recommendation
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA — solid background */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,8px))] left-0 right-0 z-30" style={{ backgroundColor: "#F8F7F3" }}>
        <div className="max-w-md mx-auto px-5 pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground text-center mb-2">You can update this anytime from your portfolio</p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            disabled={!isValid}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & invest <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* ETF Detail Bottom Sheet */}
      <AnimatePresence>
        {activeETF && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setSelectedETF(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-card shadow-xl p-5 pb-8"
            >
              {/* Drag pill */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setSelectedETF(null)}
                  className="h-1.5 w-10 rounded-full bg-border cursor-pointer hover:bg-muted-foreground/30 transition-colors"
                />
              </div>

              {/* Title + category */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-foreground mb-1">{activeETF.name}</h3>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: activeETF.color }}
                >
                  {activeETF.category}
                </span>
              </div>

              {/* Tilly's view */}
              <div className="rounded-xl bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 p-3.5 mb-5">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Tilly's view</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{TILLY_RATIONALE[activeETF.name] || "Recommended based on your risk profile and investment goals."}</p>
              </div>

              {/* Performance */}
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Performance</p>
              <div className="space-y-0">
                {[
                  { label: "1 Year return", value: activeETF.returns1Y },
                  { label: "2 Year return (CAGR)", value: activeETF.returns2Y },
                  { label: "3 Year return (CAGR)", value: activeETF.returns3Y },
                ].map((r, idx) => (
                  <div
                    key={r.label}
                    className={`flex items-center justify-between py-2.5 ${idx < 2 ? "border-b border-border/30" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                    <span className="text-sm font-bold text-[hsl(var(--wealth-green))]">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-border/60 my-4" />

              {/* Fees & charges */}
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Fees & Charges</p>
              <div className="space-y-0">
                {[
                  { label: "Expense ratio", value: activeETF.expenseRatio },
                  { label: "Exit load", value: activeETF.exitLoad },
                  { label: "Minimum investment", value: activeETF.minInvestment },
                ].map((r, idx) => (
                  <div
                    key={r.label}
                    className={`flex items-center justify-between py-2.5 ${idx < 2 ? "border-b border-border/30" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                    <span className="text-xs font-semibold text-foreground">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-[9px] text-muted-foreground/60 mt-3 text-center">
                Past performance is not indicative of future returns
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB + Tilly pill */}
      {!chatOpen && (
        <div className="fixed bottom-[156px] right-5 z-40 flex flex-col items-center">
          <AnimatePresence>
            {showTillyPill && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                exit={{ opacity: 0, y: 4 }}
                transition={{
                  opacity: { duration: 0.4, ease: "easeOut" },
                  y: { duration: 2.5, ease: "easeInOut", repeat: Infinity },
                }}
                className="mb-1 flex flex-col items-center"
              >
                <span
                  style={{
                    background: "rgba(184, 134, 11, 0.70)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: "99px",
                    whiteSpace: "nowrap",
                  }}
                >
                  💬 Speak to Tilly
                </span>
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid #B8860B",
                    marginTop: "-1px",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setChatOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full wealth-gradient text-primary-foreground"
            style={{
              boxShadow: "0 4px 24px -4px hsl(var(--wealth-navy) / 0.5)",
            }}
          >
            <Mic className="h-5 w-5" />
          </motion.button>
        </div>
      )}

      <AIChatSheet isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <BottomNav />
    </div>
  );
};

export default Invest;
