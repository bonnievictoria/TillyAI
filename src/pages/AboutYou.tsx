import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Check, Plus, Target, Wallet, X } from "lucide-react";
import { saveOnboardingProfile } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

/* ─── Drum-roll date picker ─── */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);

const MONTH_LABELS: Record<number, string> = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

const ITEM_H = 28;
const VISIBLE = 3;

const DrumColumn = ({
  items,
  value,
  onChange,
  renderLabel,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  renderLabel?: (v: number) => string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isSettling = useRef(false);
  const paddingItems = Math.floor(VISIBLE / 2);

  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(value);
    if (idx >= 0) {
      isSettling.current = true;
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      const timer = setTimeout(() => { isSettling.current = false; }, 400);
      return () => clearTimeout(timer);
    }
  }, [value, items]);

  const handleScroll = useCallback(() => {
    if (!ref.current || isSettling.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
  }, [items, value, onChange]);

  return (
    <div className="relative flex-1" style={{ height: ITEM_H * VISIBLE }}>
      <div
        className="absolute inset-x-1 pointer-events-none z-10 rounded-md bg-primary/6"
        style={{ top: Math.floor(VISIBLE / 2) * ITEM_H, height: ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`pad-top-${i}`} style={{ height: ITEM_H }} />
        ))}
        {items.map((item) => {
          const idx = items.indexOf(item);
          const selectedIdx = items.indexOf(value);
          const distance = Math.abs(idx - selectedIdx);
          const opacity = distance === 0 ? 1 : 0.15;
          const fontSize = distance === 0 ? "13px" : "11px";
          return (
            <div
              key={item}
              className="flex items-center justify-center snap-center transition-all"
              style={{ height: ITEM_H, opacity, fontWeight: distance === 0 ? 600 : 400, fontSize }}
              onClick={() => onChange(item)}
            >
              {renderLabel ? renderLabel(item) : String(item).padStart(2, "0")}
            </div>
          );
        })}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`pad-bot-${i}`} style={{ height: ITEM_H }} />
        ))}
      </div>
    </div>
  );
};

/* ─── Format INR ─── */
const formatINR = (v: number) => {
  if (v >= 100000000) return "₹10 Cr+";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

/* ─── Dual Range Slider ─── */
const SLIDER_TICKS = [
  { value: 0, label: "₹0" },
  { value: 2500000, label: "₹25L" },
  { value: 5000000, label: "₹50L" },
  { value: 10000000, label: "₹1Cr" },
  { value: 50000000, label: "₹5Cr" },
  { value: 100000000, label: "₹10Cr+" },
];

const DualRangeSlider = ({
  label,
  range,
  onChange,
  subtext,
}: {
  label: string;
  range: [number, number];
  onChange: (r: [number, number]) => void;
  subtext?: string;
}) => {
  const max = 100000000;
  const minPct = (range[0] / max) * 100;
  const maxPct = (range[1] / max) * 100;
  const isSingleValue = range[0] === range[1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">
          {isSingleValue ? formatINR(range[0]) : `${formatINR(range[0])} – ${formatINR(range[1])}`}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-secondary">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={100000}
          value={range[0]}
          onChange={(e) => {
            const v = Math.max(0, Math.min(Number(e.target.value), range[1]));
            onChange([v, range[1]]);
          }}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-md pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={100000}
          value={range[1]}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), range[0]);
            onChange([range[0], v]);
          }}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card [&::-webkit-slider-thumb]:shadow-md pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
        />
      </div>
      <div className="flex justify-between">
        {SLIDER_TICKS.map((t) => (
          <span key={t.value} className="text-[9px] text-muted-foreground/50">
            {t.label}
          </span>
        ))}
      </div>
      {subtext && <p className="text-[11px] text-muted-foreground italic">{subtext}</p>}
    </div>
  );
};

/* ─── Constants ─── */
const DEFAULT_GOALS = [
  { label: "Buying a home", icon: "🏡" },
  { label: "Retiring", icon: "🌴" },
  { label: "Education", icon: "🎓" },
  { label: "Marriage", icon: "💍" },
];

const HORIZON_OPTIONS = [
  { label: "Short term", sub: "< 2 years" },
  { label: "Medium term", sub: "2–5 years" },
  { label: "Long term", sub: "5+ years" },
];

const TellUsAboutYou = ({ onComplete, onBack }: Props) => {
  const [dobDay, setDobDay] = useState(15);
  const [dobMonth, setDobMonth] = useState(6);
  const [dobYear, setDobYear] = useState(1990);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [horizon, setHorizon] = useState("");
  const [incomeRange, setIncomeRange] = useState<[number, number]>([30000000, 70000000]);
  const [expenseRange, setExpenseRange] = useState<[number, number]>([20000000, 50000000]);

  const toggleGoal = (g: string) =>
    setSelectedGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const addCustomGoal = () => {
    if (newGoalText.trim()) {
      setCustomGoals((prev) => [...prev, newGoalText.trim()]);
      setSelectedGoals((prev) => [...prev, newGoalText.trim()]);
      setNewGoalText("");
      setAddingGoal(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const dob = `${dobYear}-${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`;
    try {
      await saveOnboardingProfile({
        date_of_birth: dob,
        selected_goals: selectedGoals,
        custom_goals: customGoals,
        investment_horizon: horizon || undefined,
        annual_income_min: incomeRange[0],
        annual_income_max: incomeRange[1],
        annual_expense_min: expenseRange[0],
        annual_expense_max: expenseRange[1],
      });
    } catch {
      // continue even if save fails
    }
    onComplete();
  };

  const canContinue = selectedGoals.length > 0;

  const avgIncome = (incomeRange[0] + incomeRange[1]) / 2;
  const avgExpense = (expenseRange[0] + expenseRange[1]) / 2;
  const estSavingsLow = Math.max(0, incomeRange[0] - expenseRange[1]);
  const estSavingsHigh = Math.max(0, incomeRange[1] - expenseRange[0]);
  const expensePct = avgIncome > 0 ? Math.round((avgExpense / avgIncome) * 100) : 0;

  return (
    <div className="mobile-container flex flex-col bg-background min-h-screen">
      {/* Stepper — Step 1 completed, Step 2 active */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-0 px-4 pt-8 pb-6 w-full max-w-[340px] mx-auto"
      >
        {/* Step 1 — completed */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
            <Check className="h-3.5 w-3.5 text-muted-foreground" />
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
      <div className="flex-1 flex flex-col px-6 pb-24 overflow-y-auto">
        <div className="mt-4 mb-1">
          <h2 className="text-xl font-semibold text-foreground">Tell us about you</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Personalise your financial journey
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {/* Age / DOB */}
          <AccordionItem
            value="age"
            className="border rounded-xl bg-card overflow-hidden border-border/60"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Calendar className="h-[20px] w-[20px] text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Age</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex gap-1 rounded-xl overflow-hidden bg-secondary/20 p-2 max-w-[260px] mx-auto">
                <DrumColumn items={DAYS} value={dobDay} onChange={setDobDay} />
                <DrumColumn
                  items={MONTHS}
                  value={dobMonth}
                  onChange={setDobMonth}
                  renderLabel={(v) => MONTH_LABELS[v]}
                />
                <DrumColumn
                  items={YEARS}
                  value={dobYear}
                  onChange={setDobYear}
                  renderLabel={(v) => String(v)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Financial Goals */}
          <AccordionItem
            value="goals"
            className="border rounded-xl bg-card overflow-hidden border-border/60"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Target className="h-[20px] w-[20px] text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Financial Goals</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  What are your key financial goals?
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...DEFAULT_GOALS, ...customGoals.map((g) => ({ label: g, icon: "✦" }))].map(
                    (g) => {
                      const isSelected = selectedGoals.includes(g.label);
                      return (
                        <button
                          key={g.label}
                          onClick={() => toggleGoal(g.label)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-muted"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{g.icon}</span>
                          {g.label}
                        </button>
                      );
                    }
                  )}
                  {addingGoal ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={newGoalText}
                        onChange={(e) => setNewGoalText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCustomGoal()}
                        placeholder="Type goal"
                        className="px-3 py-2 rounded-full text-xs bg-secondary text-foreground outline-none w-28 border border-border"
                      />
                      <button
                        onClick={addCustomGoal}
                        className="p-1.5 rounded-full bg-primary text-primary-foreground"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setAddingGoal(false);
                          setNewGoalText("");
                        }}
                        className="p-1.5 rounded-full bg-secondary text-muted-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingGoal(true)}
                      className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:bg-muted border border-dashed border-border"
                    >
                      <Plus className="h-3 w-3" /> Add your own
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  Investment Horizon
                </p>
                <div className="flex flex-wrap gap-2">
                  {HORIZON_OPTIONS.map((h) => {
                    const isSelected = horizon === h.label;
                    return (
                      <button
                        key={h.label}
                        onClick={() => setHorizon(h.label)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-medium text-center transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        {h.label}
                      </button>
                    );
                  })}
                </div>
                {horizon && (
                  <p className="text-[11px] text-muted-foreground mt-2 text-center w-full">
                    {HORIZON_OPTIONS.find((h) => h.label === horizon)?.sub}
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Income & Expenses */}
          <AccordionItem
            value="income"
            className="border rounded-xl bg-card overflow-hidden border-border/60"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Wallet className="h-[20px] w-[20px] text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Income & Expenses</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-5">
              <DualRangeSlider
                label="Annual Income Range (₹)"
                range={incomeRange}
                onChange={setIncomeRange}
                subtext={`Estimated savings: ${formatINR(estSavingsLow)} – ${formatINR(
                  estSavingsHigh
                )} / year`}
              />
              <DualRangeSlider
                label="Annual Expenses Range (₹)"
                range={expenseRange}
                onChange={setExpenseRange}
                subtext={`That's roughly ${expensePct}% of your income range`}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={!canContinue}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-semibold tracking-wide transition-all active:scale-[0.98] disabled:pointer-events-none ${
              canContinue
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            Generate my portfolio ✦
          </button>
        </div>
      </div>
    </div>
  );
};

const AboutYouPage = () => {
  const navigate = useNavigate();
  return (
    <TellUsAboutYou
      onComplete={() => {
        sessionStorage.setItem("onboardingComplete", "true");
        navigate("/chat");
      }}
      onBack={() => navigate("/link-accounts")}
    />
  );
};

export default AboutYouPage;
