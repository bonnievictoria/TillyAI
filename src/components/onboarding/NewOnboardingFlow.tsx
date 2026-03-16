import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Plus,
  X,
  Calendar,
  Target,
  Wallet,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

interface NewOnboardingFlowProps {
  onComplete: () => void;
}

/* ─── Drum-roll date picker ─── */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);

const MONTH_LABELS: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
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
  const paddingItems = Math.floor(VISIBLE / 2);

  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(value);
    if (idx >= 0) {
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }
  }, [value, items]);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
  }, [items, value, onChange]);

  return (
    <div className="relative flex-1" style={{ height: ITEM_H * VISIBLE }}>
      {/* Centre highlight band */}
      <div
        className="absolute inset-x-1 pointer-events-none z-10 rounded-md bg-primary/6"
        style={{ top: paddingItems * ITEM_H, height: ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {/* Top padding so first item can reach centre */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <div key={`pad-top-${i}`} style={{ height: ITEM_H }} />
        ))}
        {items.map((item) => {
          const idx = items.indexOf(item);
          const selectedIdx = items.indexOf(value);
          const distance = Math.abs(idx - selectedIdx);
          const opacity = distance === 0 ? 1 : 0.15;
          const fontSize = distance === 0 ? '13px' : '11px';
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
        {/* Bottom padding so last item can reach centre */}
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
      {subtext && (
        <p className="text-[11px] text-muted-foreground italic">{subtext}</p>
      )}
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

const ACCOUNT_TYPES = [
  { id: "mf", label: "Mutual funds", icon: BarChart3, desc: "CAMS, Karvy & all AMCs" },
  { id: "stock", label: "Stocks", icon: TrendingUp, desc: "NSE, BSE via CDSL / NSDL" },
  { id: "bank", label: "Bank account", icon: Building2, desc: "All banks via account aggregator" },
  { id: "other", label: "Others", icon: Sparkles, desc: "NPS, PPF, Gold, Real estate…" },
];

/* ─── Indian Provider Lists ─── */
const INDIAN_PROVIDERS: Record<string, { name: string; subtitle?: string }[]> = {
  mf: [
    { name: "Groww", subtitle: "Mutual Fund Platform" },
    { name: "Zerodha Coin", subtitle: "Direct MF Investing" },
    { name: "Kuvera", subtitle: "Free Direct Plans" },
    { name: "Paytm Money", subtitle: "MF & SIP Platform" },
    { name: "MF Central", subtitle: "Unified MF Portal" },
    { name: "CAMS", subtitle: "Registrar & Transfer Agent" },
    { name: "KFintech", subtitle: "Registrar & Transfer Agent" },
  ],
  stock: [
    { name: "Zerodha", subtitle: "Discount Broker" },
    { name: "Upstox", subtitle: "Online Trading" },
    { name: "Angel One", subtitle: "Full Service Broker" },
    { name: "ICICI Direct", subtitle: "Banking + Demat" },
    { name: "HDFC Securities", subtitle: "Banking + Demat" },
    { name: "Groww", subtitle: "Stocks & MF" },
  ],
  bank: [
    { name: "SBI", subtitle: "State Bank of India" },
    { name: "HDFC Bank", subtitle: "Private Sector Bank" },
    { name: "ICICI Bank", subtitle: "Private Sector Bank" },
    { name: "Axis Bank", subtitle: "Private Sector Bank" },
    { name: "Kotak Mahindra", subtitle: "Private Sector Bank" },
    { name: "Yes Bank", subtitle: "Private Sector Bank" },
    { name: "IDFC First", subtitle: "Private Sector Bank" },
  ],
  other: [
    { name: "NPS", subtitle: "National Pension System" },
    { name: "PPF", subtitle: "Public Provident Fund" },
    { name: "EPF", subtitle: "Employee Provident Fund" },
    { name: "Gold", subtitle: "Physical / Digital Gold" },
    { name: "Real Estate", subtitle: "Property Investments" },
  ],
};

interface AccountEntry {
  name: string;
  accountNumber?: string;
  amount?: string;
}

interface OtherAsset {
  name: string;
  amount: string;
}

/* ─── Provider Selection Modal ─── */
const ProviderSelectionModal = ({
  open,
  onClose,
  accountType,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  accountType: string;
  onSelect: (providers: string[]) => void;
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const providers = INDIAN_PROVIDERS[accountType] || [];
  const accLabel = ACCOUNT_TYPES.find((a) => a.id === accountType)?.label || "";

  const filtered = providers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProvider = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    setSelected(new Set());
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-semibold">Link {accLabel}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
          </div>
        </div>

        {/* Provider list */}
        <div className="px-2 pb-2 max-h-[50vh] overflow-y-auto">
          {filtered.map((p) => {
            const isSelected = selected.has(p.name);
            return (
              <button
                key={p.name}
                onClick={() => toggleProvider(p.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  isSelected ? "bg-primary/10" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {p.subtitle && (
                    <p className="text-[10px] text-muted-foreground">{p.subtitle}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No providers found</p>
          )}
        </div>

        {/* Confirm */}
        <div className="px-4 pb-4 pt-2 border-t border-border/40">
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Link {selected.size > 0 ? `${selected.size} account${selected.size > 1 ? "s" : ""}` : "selected"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Main component ─── */
const NewOnboardingFlow = ({ onComplete }: NewOnboardingFlowProps) => {
  // -1 = welcome, 0 = about you, 1 = link accounts, 2 = all set
  const [step, setStep] = useState(-1);

  // Section 1 state
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

  // Section 2 state
  const [accounts, setAccounts] = useState<Record<string, AccountEntry[]>>({
    mf: [], stock: [], bank: [], other: [],
  });
  const [providerModal, setProviderModal] = useState<string | null>(null);
  const [otherAssets, setOtherAssets] = useState<OtherAsset[]>([]);
  const [othersExpanded, setOthersExpanded] = useState(false);

  // Confirmation
  const [confirmProgress, setConfirmProgress] = useState(0);

  const toggleGoal = (g: string) =>
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const addCustomGoal = () => {
    if (newGoalText.trim()) {
      setCustomGoals((prev) => [...prev, newGoalText.trim()]);
      setSelectedGoals((prev) => [...prev, newGoalText.trim()]);
      setNewGoalText("");
      setAddingGoal(false);
    }
  };

  const handleProviderSelect = (type: string, providers: string[]) => {
    const entries: AccountEntry[] = providers.map((name) => ({ name }));
    setAccounts((prev) => ({
      ...prev,
      [type]: [...prev[type], ...entries],
    }));
  };

  const removeAccountEntry = (type: string, idx: number) => {
    setAccounts((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== idx),
    }));
  };

  const handleFinish = () => {
    sessionStorage.setItem("completedTellUs", "true");
    sessionStorage.setItem("completedLinkAccounts", "true");
    sessionStorage.setItem("onboardingComplete", "true");
    setStep(2);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setConfirmProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 800);
      }
    }, 30);
  };

  // Compute subtexts
  const avgIncome = (incomeRange[0] + incomeRange[1]) / 2;
  const avgExpense = (expenseRange[0] + expenseRange[1]) / 2;
  const estSavingsLow = Math.max(0, incomeRange[0] - expenseRange[1]);
  const estSavingsHigh = Math.max(0, incomeRange[1] - expenseRange[0]);
  const expensePct = avgIncome > 0 ? Math.round((avgExpense / avgIncome) * 100) : 0;

  const totalLinked = Object.values(accounts).reduce((s, a) => s + a.length, 0);

  /* ─── SCREEN 0: Welcome ─── */
  if (step === -1) {
    return (
      <WelcomeScreen onNext={() => setStep(0)} />
    );
  }

  /* ─── SCREEN 3: All set ─── */
  if (step === 2) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center bg-background px-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-5 w-full"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-wealth-green">
            <Check className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="font-display text-3xl text-foreground">
            You're all set, Bonnie!
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-[280px]">
            We're personalising your dashboard based on your profile.
          </p>
          <div className="w-full max-w-[240px] mt-2">
            <Progress value={confirmProgress} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            Setting things up…
          </p>
        </motion.div>
      </div>
    );
  }

  /* ─── Progress bar (shared between step 0 and 1) ─── */
  const renderProgress = () => (
    <div className="px-4 pt-12 pb-1">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
              step > 0
                ? "bg-wealth-green text-primary-foreground"
                : "wealth-gradient text-primary-foreground"
            }`}
          >
            {step > 0 ? <Check className="h-3 w-3" /> : "1"}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-medium leading-tight ${step === 0 ? "text-foreground" : "text-muted-foreground"}`}>
              About you
            </span>
            <span className="text-[8px] text-muted-foreground/50 leading-tight">~30 secs</span>
          </div>
        </div>

        <div className="flex-1 h-0.5 rounded-full bg-secondary overflow-hidden mx-1">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: step > 0 ? "100%" : "0%" }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
              step === 1
                ? "wealth-gradient text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            2
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-medium leading-tight ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>
              Link accounts
            </span>
            <span className="text-[8px] text-muted-foreground/50 leading-tight">~90 secs</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mobile-container flex flex-col bg-background min-h-screen">
      {renderProgress()}

      <AnimatePresence mode="wait">
        {/* ─── SCREEN 1: Tell us about you ─── */}
        {step === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-6 pb-24 overflow-y-auto"
          >
            <div className="mt-4 mb-1">
              <h2 className="text-xl font-semibold text-foreground">Tell us about you</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Personalise your financial journey
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {/* Segment 1: Age */}
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

              {/* Segment 2: Financial Goals */}
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
                  {/* Goals chips */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2.5">
                      What are your key financial goals?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...DEFAULT_GOALS, ...customGoals.map((g) => ({ label: g, icon: "✦" }))].map((g) => {
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
                      })}
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
                            onClick={() => { setAddingGoal(false); setNewGoalText(""); }}
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

                  {/* Horizon pills — auto-sized */}
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

              {/* Segment 3: Income & Expenses */}
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
                    subtext={`Estimated savings: ${formatINR(estSavingsLow)} – ${formatINR(estSavingsHigh)} / year`}
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

            {/* Fixed CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
              <div className="max-w-md mx-auto">
                <button
                  onClick={() => setStep(1)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl wealth-gradient py-3.5 text-[15px] font-semibold text-primary-foreground tracking-wide transition-all active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SCREEN 2: Link your accounts ─── */}
        {step === 1 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-6 pb-36 overflow-y-auto"
          >
            <div className="mt-4 mb-5">
              <h2 className="text-xl font-semibold text-foreground">Link your accounts</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select accounts to get a complete picture
              </p>
            </div>

            <div className="space-y-3">
              {ACCOUNT_TYPES.map((acc) => {
                const count = accounts[acc.id]?.length || 0;
                const isOther = acc.id === "other";
                const hasContent = isOther ? othersExpanded : count > 0;

                return (
                  <div
                    key={acc.id}
                    className="rounded-xl border border-border/60 bg-card overflow-hidden"
                  >
                    {/* Card header row */}
                    <button
                      onClick={() => {
                        if (isOther) {
                          setOthersExpanded((prev) => !prev);
                          if (!othersExpanded && otherAssets.length === 0) {
                            setOtherAssets([{ name: "", amount: "" }]);
                          }
                        } else {
                          setProviderModal(acc.id);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-all text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <acc.icon className="h-[20px] w-[20px] text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{acc.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{acc.desc}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {count > 0 && !isOther && (
                          <span className="px-2 py-0.5 rounded-full bg-wealth-green/10 text-wealth-green text-[11px] font-semibold">
                            {count} linked
                          </span>
                        )}
                        {isOther ? (
                          <ChevronDown className={`h-4 w-4 text-muted-foreground/50 transition-transform ${othersExpanded ? "rotate-180" : ""}`} />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </button>

                    {/* Linked entries inside card (non-other) */}
                    {!isOther && count > 0 && (
                      <div className="border-t border-border/40 px-4 py-2 space-y-1.5">
                        {accounts[acc.id].map((entry, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5">
                            <span className="text-xs text-foreground">{entry.name}</span>
                            <button
                              onClick={() => removeAccountEntry(acc.id, i)}
                              className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setProviderModal(acc.id)}
                          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline pt-0.5"
                        >
                          <Plus className="h-3 w-3" /> Add another
                        </button>
                      </div>
                    )}

                    {/* Others — inline expand inside card */}
                    {isOther && othersExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border/40 px-4 py-3 space-y-2"
                      >
                        {otherAssets.map((asset, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              placeholder="e.g. NPS"
                              value={asset.name}
                              onChange={(e) => {
                                const next = [...otherAssets];
                                next[i] = { ...next[i], name: e.target.value };
                                setOtherAssets(next);
                              }}
                              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
                            />
                            <div className="flex items-center rounded-lg border border-border bg-background px-2 py-2 w-28">
                              <span className="text-xs text-muted-foreground mr-1">₹</span>
                              <input
                                type="number"
                                placeholder="Amount"
                                value={asset.amount}
                                onChange={(e) => {
                                  const next = [...otherAssets];
                                  next[i] = { ...next[i], amount: e.target.value };
                                  setOtherAssets(next);
                                }}
                                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50 w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                            </div>
                            {otherAssets.length > 1 && (
                              <button
                                onClick={() => setOtherAssets((prev) => prev.filter((_, j) => j !== i))}
                                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setOtherAssets((prev) => [...prev, { name: "", amount: "" }])}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Plus className="h-3 w-3" /> Add another asset
                        </button>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fixed bottom — Back above CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-background via-background to-transparent">
              <div className="max-w-md mx-auto space-y-2">
                <button
                  onClick={() => setStep(0)}
                  className="w-full text-center text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  className="flex w-full items-center justify-center gap-2 rounded-xl wealth-gradient py-3.5 text-[15px] font-semibold text-primary-foreground tracking-wide transition-all active:scale-[0.98]"
                >
                  Generate my portfolio
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider selection modal */}
      {providerModal && (
        <ProviderSelectionModal
          open={!!providerModal}
          onClose={() => setProviderModal(null)}
          accountType={providerModal}
          onSelect={(providers) => handleProviderSelect(providerModal, providers)}
        />
      )}
    </div>
  );
};

export default NewOnboardingFlow;
