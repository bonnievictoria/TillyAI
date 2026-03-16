import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

/* ─── Age Picker ─── */
const AgePicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 24;
  const ages = Array.from({ length: 83 }, (_, i) => 18 + i);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = (value - 18) * ITEM_H;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / ITEM_H);
    onChange(ages[Math.max(0, Math.min(idx, ages.length - 1))]);
  }, [onChange, ages]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 72,
        maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ paddingTop: 24, paddingBottom: 24 }}
      >
        {ages.map((age) => {
          const distance = Math.abs(age - value);
          return (
            <div key={age} className="h-[24px] flex items-center justify-center snap-center">
              {distance === 0 ? (
                <span className="text-base font-semibold text-foreground">{age}</span>
              ) : distance <= 1 ? (
                <span className="text-sm text-muted-foreground/50">{age}</span>
              ) : (
                <span className="text-sm text-muted-foreground/30">{age}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Goal Options ─── */
const goalOptions = [
  { label: "Buying a home", icon: "🏠" },
  { label: "Retiring", icon: "📈" },
  { label: "Building generational wealth", icon: "🌱" },
  { label: "Funding education", icon: "🎓" },
  { label: "Not yet sure", icon: "✨" },
];

const netWorthBrackets = ["Under £50K", "£50K – £250K", "£250K – £1M", "£1M – £5M", "£5M+"];

/* ─── Dual Range Slider ─── */
const DualRangeSlider = ({ min, max, value, onChange }: { min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const getPercent = (v: number) => ((v - min) / (max - min)) * 100;

  const handlePointer = (idx: 0 | 1) => (e: React.PointerEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const move = (ev: PointerEvent) => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const raw = Math.round(min + pct * (max - min));
      const next: [number, number] = [...value];
      next[idx] = raw;
      if (next[0] > next[1]) { if (idx === 0) next[0] = next[1]; else next[1] = next[0]; }
      onChange(next);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div ref={trackRef} className="relative h-10 flex items-center touch-none">
      <div className="absolute inset-x-0 h-1 rounded-full bg-muted" />
      <div className="absolute h-1 rounded-full bg-accent" style={{ left: `${getPercent(value[0])}%`, width: `${getPercent(value[1]) - getPercent(value[0])}%` }} />
      {[0, 1].map((idx) => (
        <div key={idx} onPointerDown={handlePointer(idx as 0 | 1)} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary border-2 border-primary-foreground cursor-grab active:cursor-grabbing shadow-wealth" style={{ left: `${getPercent(value[idx as 0 | 1])}%` }} />
      ))}
    </div>
  );
};

/* ─── Main Page ─── */
const AboutYou = () => {
  const navigate = useNavigate();
  const [age, setAge] = useState(30);
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [goalDetails, setGoalDetails] = useState<Record<string, { amount: string; date: string }>>({});
  const [netWorth, setNetWorth] = useState<string | null>(null);
  const [horizonRange, setHorizonRange] = useState<[number, number]>([5, 15]);

  const toggleGoal = (g: string) => {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(g)) {
        next.delete(g);
        setGoalDetails((d) => { const n = { ...d }; delete n[g]; return n; });
      } else {
        next.add(g);
        if (g !== "Not yet sure") {
          setGoalDetails((d) => ({ ...d, [g]: { amount: "", date: "" } }));
        }
      }
      return next;
    });
  };

  const updateGoalDetail = (goal: string, field: "amount" | "date", value: string) => {
    setGoalDetails((prev) => ({
      ...prev,
      [goal]: { ...prev[goal], [field]: value },
    }));
  };

  const hasValidGoal = Array.from(goals).some((g) => {
    const d = goalDetails[g];
    return d && d.amount.trim() !== "" && d.date.trim() !== "";
  });

  const canComplete = age > 0 && hasValidGoal;

  const handleGenerate = () => {
    sessionStorage.setItem("completedTellUs", "true");
    sessionStorage.setItem("onboardingComplete", "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 pt-8 pb-6">
      {/* Stepper — Step 1 completed, Step 2 active */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-0 mb-6 w-full max-w-[340px]"
      >
        {/* Step 1 — completed */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(160_50%_38%)]">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5">Link accounts</span>
          <span className="text-[10px] text-muted-foreground">~90 secs</span>
        </div>

        {/* Divider */}
        <div className="flex-1 h-[1.5px] bg-border mx-2 mt-[-22px]" />

        {/* Step 2 — active */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
            <span className="text-xs font-semibold text-primary-foreground">2</span>
          </div>
          <span className="text-[10px] text-foreground font-medium mt-1.5">About you</span>
          <span className="text-[10px] text-muted-foreground">~30 secs</span>
        </div>
      </motion.div>

      {/* Content */}
      <div className="w-full max-w-[340px] flex-1 overflow-y-auto pb-32">
        <h2 className="text-xl font-semibold text-foreground">Tell us about you</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-5">Takes about 30 seconds. You can update this anytime.</p>

        {/* 1. Age */}
        <section>
          <p className="text-sm font-medium tracking-tight text-foreground mb-2">How old are you?</p>
          <AgePicker value={age} onChange={setAge} />
        </section>

        <div className="h-px bg-border my-6" />

        {/* 2. Goals */}
        <section>
          <p className="text-sm font-medium tracking-tight text-foreground mb-2">What are your main goals?</p>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((opt) => {
              const isActive = goals.has(opt.label);
              return (
                <button
                  key={opt.label}
                  onClick={() => toggleGoal(opt.label)}
                  className={`rounded-xl px-3 py-2 text-xs font-medium tracking-tight border transition-all flex items-center gap-1.5 ${
                    isActive ? "wealth-gradient text-primary-foreground border-transparent" : "bg-card text-foreground border-border/60 hover:border-foreground/20"
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Goal sub-fields */}
          <AnimatePresence>
            {goalOptions.filter((o) => goals.has(o.label) && o.label !== "Not yet sure").map((opt) => (
              <motion.div
                key={opt.label}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-2 ml-1 p-2.5 rounded-xl bg-card border border-border/60">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{opt.icon} {opt.label}</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] uppercase tracking-wide text-muted-foreground/60 mb-0.5 block">Target amount</label>
                      <div className="flex items-center rounded-lg border border-border bg-background px-2 h-7">
                        <span className="text-xs text-muted-foreground mr-1">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 50,00,000"
                          value={goalDetails[opt.label]?.amount || ""}
                          onChange={(e) => updateGoalDetail(opt.label, "amount", e.target.value)}
                          className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <div className="w-24">
                      <label className="text-[11px] uppercase tracking-wide text-muted-foreground/60 mb-0.5 block">Target year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2035"
                        maxLength={4}
                        value={goalDetails[opt.label]?.date || ""}
                        onChange={(e) => updateGoalDetail(opt.label, "date", e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-lg border border-border bg-background px-2 h-7 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        <div className="h-px bg-border my-6" />

        {/* 3. Net worth */}
        <section>
          <p className="text-sm font-medium tracking-tight text-foreground mb-2">What is your total net worth?</p>
          <div className="space-y-2">
            {netWorthBrackets.map((b) => (
              <button
                key={b}
                onClick={() => setNetWorth(b)}
                className={`w-full rounded-xl px-3 py-2.5 text-xs font-medium tracking-tight border text-left transition-all ${
                  netWorth === b ? "wealth-gradient text-primary-foreground border-transparent" : "bg-card text-foreground border-border/60 hover:border-foreground/20"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-border my-6" />

        {/* 4. Investment horizon */}
        <section>
          <p className="text-sm font-medium tracking-tight text-foreground mb-1">Investment horizon?</p>
          <p className="text-sm font-semibold text-foreground mb-3">
            {horizonRange[0]} – {horizonRange[1] >= 30 ? "30+" : horizonRange[1]} years
          </p>
          <div className="px-1">
            <DualRangeSlider min={1} max={30} value={horizonRange} onChange={setHorizonRange} />
            <div className="flex justify-between mt-1">
              <div className="text-left leading-tight">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">1 yr</span>
                <span className="text-[9px] text-muted-foreground/70 italic mt-0.5 block">Short term</span>
              </div>
              <div className="text-center leading-tight">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">10 yrs</span>
                <span className="text-[9px] text-muted-foreground/70 italic mt-0.5 block">Medium</span>
              </div>
              <div className="text-right leading-tight">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">20+ yrs</span>
                <span className="text-[9px] text-muted-foreground/70 italic mt-0.5 block">Long haul</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom actions — pinned */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-6 py-4">
        <div className="max-w-[340px] mx-auto flex flex-col items-center gap-3">
          <button
            onClick={() => navigate("/link-accounts")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canComplete}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-[15px] font-semibold text-primary-foreground tracking-wide transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            style={{ backgroundColor: "hsl(222 47% 14%)" }}
          >
            Generate my portfolio
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutYou;
