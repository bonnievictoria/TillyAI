import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, RotateCcw, AlertTriangle, Mic } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AIChatSheet from "@/components/dashboard/AIChatSheet";

/* ── Asset type ── */
interface Asset {
  name: string;
  shortName: string;
  houseRec: number; // house recommendation %
}

const ASSETS: Asset[] = [
  { name: "Nifty 50", shortName: "Nifty 50", houseRec: 30 },
  { name: "Next 50", shortName: "Next 50", houseRec: 15 },
  { name: "Midcap 150", shortName: "Midcap 150", houseRec: 10 },
  { name: "S&P 500", shortName: "S&P 500", houseRec: 5 },
  { name: "Bharat Bond", shortName: "Bharat Bond", houseRec: 20 },
  { name: "PSU Bank", shortName: "PSU Bank", houseRec: 8 },
  { name: "Gold", shortName: "Gold", houseRec: 7 },
  { name: "IT ETF", shortName: "IT ETF", houseRec: 5 },
];

const houseDefaults = ASSETS.map((a) => a.houseRec);

/* ── Blue ramp helpers ── */
const PALE_BLUE = "#E8F0FE";
const MID_BLUE = "#A8C4E8";
const NAVY = "#1A3A6B";
const LIGHT_BADGE = "#C5D8F5";

/** Interpolate hex color between two colors */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function sliderFillColor(pct: number): string {
  const t = Math.min(pct / 30, 1);
  return lerpColor(MID_BLUE, NAVY, t);
}

/* ── Format ── */
const formatINR = (n: number) => {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return (n / 100000).toFixed(2) + "L";
  return n.toLocaleString("en-IN");
};

/* ── Portfolio Summary Generator ── */
function generateSummary(allocations: number[]): string {
  const equity = allocations[0] + allocations[1] + allocations[2]; // Nifty50 + Next50 + Midcap
  const intl = allocations[3]; // S&P 500
  const debt = allocations[4]; // Bharat Bond
  const sectoral = allocations[5] + allocations[7]; // PSU Bank + IT ETF
  const gold = allocations[6];

  let profile = "balanced";
  if (equity + intl > 65) profile = "aggressive";
  else if (equity + intl < 40) profile = "conservative";

  const parts: string[] = [];
  parts.push(
    `Your portfolio leans **${profile}** with **${equity + intl}% in equities** (including ${intl}% international via S&P 500).`
  );

  if (equity > 40) {
    parts.push(
      `Domestic equity is concentrated at **${equity}%**, led by large-cap Nifty 50 at **${allocations[0]}%**.`
    );
  } else {
    parts.push(
      `Domestic equity sits at **${equity}%**, providing measured market exposure.`
    );
  }

  parts.push(
    `Debt anchors stability at **${debt}%** via Bharat Bond.`
  );

  if (gold > 0 || sectoral > 0) {
    const extras: string[] = [];
    if (gold > 0) extras.push(`gold (${gold}%)`);
    if (sectoral > 0) extras.push(`sectoral bets (${sectoral}%)`);
    parts.push(`Diversifiers include ${extras.join(" and ")}.`);
  }

  return parts.join(" ");
}

/** Parse bold **text** into JSX */
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-bold" style={{ color: NAVY }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Delta Badge ── */
function DeltaBadge({ current, rec }: { current: number; rec: number }) {
  const delta = current - rec;
  const absDelta = Math.abs(delta);
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const label = `${sign}${absDelta}%`;

  let bg: string;
  let color: string;

  if (absDelta <= 1) {
    // Within tolerance
    bg = PALE_BLUE;
    color = NAVY;
  } else if (delta > 0) {
    // Overweight
    bg = NAVY;
    color = "#FFFFFF";
  } else {
    // Underweight
    bg = LIGHT_BADGE;
    color = NAVY;
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2 py-0.5"
      style={{
        backgroundColor: bg,
        color,
        fontSize: "11px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontWeight: 600,
        minWidth: "40px",
      }}
    >
      {label}
    </span>
  );
}

/* ── Page ── */
const Invest = () => {
  const [allocations, setAllocations] = useState<number[]>([...houseDefaults]);
  const [totalInvestment, setTotalInvestment] = useState<number>(8300000);
  const [chatOpen, setChatOpen] = useState(false);

  const totalAlloc = allocations.reduce((s, a) => s + a, 0);
  const isValid = totalAlloc === 100;

  const summary = useMemo(() => generateSummary(allocations), [allocations]);

  const updateAllocation = useCallback((idx: number, val: number) => {
    setAllocations((prev) => {
      const next = [...prev];
      next[idx] = Math.max(0, Math.min(50, val));
      return next;
    });
  }, []);

  const updateFromRupee = useCallback(
    (idx: number, rupeeVal: number) => {
      if (totalInvestment <= 0) return;
      const pct = Math.round((rupeeVal / totalInvestment) * 100);
      updateAllocation(idx, pct);
    },
    [totalInvestment, updateAllocation]
  );

  const resetToHouse = () => setAllocations([...houseDefaults]);

  return (
    <div className="mobile-container bg-background min-h-screen pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-foreground">Adjust your allocation</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drag sliders or edit values · House recommendation shown as tick
        </p>
      </div>

      <div className="pb-36">
        {/* Portfolio Summary Card — sticky */}
        <div className="sticky top-0 z-20 px-5 pt-1 pb-3" style={{ backgroundColor: "hsl(var(--background))" }}>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "#F5F5F5" }}
          >
            <p
              className="text-xs leading-relaxed text-foreground/80"
              style={{ fontSize: "12px", lineHeight: "1.6" }}
            >
              {renderBoldText(summary)}
            </p>
          </div>
        </div>

        {/* Total Investment Input */}
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between">
            <label
              className="text-muted-foreground"
              style={{ fontSize: "11px" }}
            >
              Total investment (₹)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={totalInvestment.toLocaleString("en-IN")}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setTotalInvestment(Number(raw) || 0);
              }}
              className="border border-border rounded-lg bg-card px-3 py-2 text-right text-foreground"
              style={{
                width: "160px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {/* Asset Allocation Cards */}
        <div className="px-5 space-y-2.5">
          {ASSETS.map((asset, i) => {
            const pct = allocations[i];
            const rupee = Math.round((totalInvestment * pct) / 100);
            const fillColor = sliderFillColor(pct);
            const fillPct = (pct / 50) * 100; // slider max is 50

            return (
              <div
                key={asset.shortName}
                className="bg-card rounded-xl"
                style={{
                  border: "0.5px solid hsl(var(--border))",
                  padding: "14px 16px",
                }}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="text-foreground font-medium flex-shrink-0"
                    style={{ fontSize: "14px" }}
                  >
                    {asset.name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* % input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pct}
                        onChange={(e) => {
                          const v = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                          updateAllocation(i, isNaN(v) ? 0 : v);
                        }}
                        className="border border-border rounded-md bg-card text-right text-foreground px-1.5 py-1"
                        style={{
                          width: "48px",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: "13px",
                        }}
                      />
                      <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
                        %
                      </span>
                    </div>
                    {/* ₹ input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatINR(rupee)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          updateFromRupee(i, Number(raw) || 0);
                        }}
                        className="border border-border rounded-md bg-card text-right text-foreground px-1.5 py-1"
                        style={{
                          width: "80px",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: "13px",
                        }}
                      />
                      <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
                        ₹
                      </span>
                    </div>
                    {/* Delta badge */}
                    <DeltaBadge current={pct} rec={asset.houseRec} />
                  </div>
                </div>

                {/* Slider row */}
                <div className="relative h-6 flex items-center">
                  {/* Track bg */}
                  <div
                    className="absolute inset-x-0 h-2 rounded-full"
                    style={{ backgroundColor: PALE_BLUE }}
                  />
                  {/* Fill */}
                  <div
                    className="absolute left-0 h-2 rounded-full transition-all"
                    style={{
                      width: `${fillPct}%`,
                      backgroundColor: fillColor,
                    }}
                  />
                  {/* House recommendation tick */}
                  <div
                    className="absolute h-4 w-0.5 rounded-full z-10"
                    style={{
                      left: `${(asset.houseRec / 50) * 100}%`,
                      transform: "translateX(-50%)",
                      backgroundColor: "#9CA3AF",
                    }}
                    title={`Rec: ${asset.houseRec}%`}
                  />
                  {/* Range input */}
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={pct}
                    onChange={(e) => updateAllocation(i, Number(e.target.value))}
                    className="absolute inset-x-0 h-6 w-full appearance-none bg-transparent cursor-pointer z-20
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-sm
                      [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:bg-card"
                    style={{
                      // thumb border color
                      // @ts-ignore
                      "--tw-slider-thumb-border": fillColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer bar — sticky bottom */}
      <div
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,8px))] left-0 right-0 z-30 border-t border-border"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Left: allocation status */}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-foreground">
              Allocated:{" "}
              <span
                className="font-bold"
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  color: isValid ? NAVY : undefined,
                }}
              >
                {totalAlloc}%
              </span>
            </span>
            <span className="ml-1.5" style={{ fontSize: "11px" }}>
              {isValid ? (
                <span style={{ color: NAVY }} className="font-medium">✓ fully allocated</span>
              ) : totalAlloc > 100 ? (
                <span className="text-muted-foreground">{totalAlloc - 100}pt% over</span>
              ) : (
                <span className="text-muted-foreground">{100 - totalAlloc}% remaining</span>
              )}
            </span>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={resetToHouse}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: NAVY, fontSize: "11px" }}
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              disabled={!isValid}
              onClick={() => {
                if (!isValid) return;
                // proceed
              }}
              className="rounded-full text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: NAVY,
                color: "#FFFFFF",
                height: "36px",
                padding: "0 16px",
              }}
            >
              Confirm & invest <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {!isValid && (
          <div className="max-w-md mx-auto px-4 pb-2">
            <span className="flex items-center gap-1 text-destructive" style={{ fontSize: "11px" }}>
              <AlertTriangle className="h-3 w-3" /> Total must equal 100% to proceed
            </span>
          </div>
        )}
      </div>

      {/* FAB */}
      {!chatOpen && (
        <div className="fixed bottom-[156px] right-5 z-40">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setChatOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full wealth-gradient text-primary-foreground"
            style={{ boxShadow: "0 4px 24px -4px hsl(var(--wealth-navy) / 0.5)" }}
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
