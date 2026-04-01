import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, GraduationCap, TrendingUp, X, Copy, Plus, Check, ChevronDown, Link, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

/* ── Types ── */
interface Holding {
  fund: string;
  category: string;
  invested: number;
  current: number;
  gainPct: number;
}
interface ContributionSource {
  source: string;
  amount: number;
  pct: number;
}
interface Goal {
  id: string;
  icon: React.ReactNode;
  label: string;
  slug: string;
  targetAmount: number;
  targetDate: string;
  investedAmount: number;
  currentValue: number;
  progressPct: number;
  status: "on-track" | "behind";
  contributions: ContributionSource[];
  holdings: Holding[];
  suggestedContribution: number;
  suggestedLabel: string;
  monthlyContribution: number;
  priority: "Low" | "Medium" | "High";
}

/* ── Helpers ── */
const formatINR = (v: number): string => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${v.toLocaleString("en-IN")}`;
};

const formatCompact = (v: number): string => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
  return `₹${v.toLocaleString("en-IN")}`;
};

/* ── Data ── */
const initialGoals: Goal[] = [
  {
    id: "1",
    icon: <GraduationCap className="h-5 w-5" />,
    label: "Child's Education",
    slug: "childs-education",
    targetAmount: 250000,
    targetDate: "Dec 2030",
    investedAmount: 98333,
    currentValue: 114000,
    progressPct: 46,
    status: "on-track",
    suggestedContribution: 8500,
    suggestedLabel: "₹8.5k/mo",
    monthlyContribution: 8500,
    priority: "High",
    contributions: [
      { source: "Lump Sum", amount: 50000, pct: 51 },
      { source: "SIP", amount: 48333, pct: 49 },
      { source: "External Support", amount: 10000, pct: 10 },
    ],
    holdings: [
      { fund: "HDFC Mid-Cap Opportunities", category: "Equity - Mid Cap", invested: 50000, current: 58000, gainPct: 16 },
      { fund: "SBI Small Cap Fund", category: "Equity - Small Cap", invested: 30000, current: 35000, gainPct: 16.7 },
      { fund: "ICICI Pru Balanced Adv.", category: "Hybrid", invested: 18333, current: 21000, gainPct: 14.5 },
    ],
  },
  {
    id: "2",
    icon: <TrendingUp className="h-5 w-5" />,
    label: "Retirement",
    slug: "retirement",
    targetAmount: 508000,
    targetDate: "Mar 2045",
    investedAmount: 113333,
    currentValue: 134000,
    progressPct: 27,
    status: "behind",
    suggestedContribution: 12000,
    suggestedLabel: "₹12k/mo",
    monthlyContribution: 12000,
    priority: "Medium",
    contributions: [
      { source: "Lump Sum", amount: 60000, pct: 53 },
      { source: "SIP", amount: 53333, pct: 47 },
    ],
    holdings: [
      { fund: "Axis Bluechip Fund", category: "Equity - Large Cap", invested: 50000, current: 59000, gainPct: 18 },
      { fund: "Mirae Asset Large Cap", category: "Equity - Large Cap", invested: 35000, current: 42000, gainPct: 20 },
      { fund: "Kotak Flexi Cap Fund", category: "Equity - Flexi Cap", invested: 28333, current: 33000, gainPct: 16.5 },
    ],
  },
];

/* ── Donut Ring ── */
const DonutRing = ({ pct, status, size = 140 }: { pct: number; status: "on-track" | "behind"; size?: number }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;
  const ringColor = status === "on-track" ? "hsl(var(--wealth-amber))" : "#D94030";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={ringColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{pct}%</span>
        <span className="text-xs text-muted-foreground">complete</span>
      </div>
    </div>
  );
};

/* ── Status Pill ── */
const StatusPill = ({ status }: { status: "on-track" | "behind" }) => {
  const isOnTrack = status === "on-track";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
      isOnTrack
        ? "bg-[hsl(var(--wealth-amber-light))] text-[hsl(var(--wealth-amber))]"
        : "bg-red-100 text-[#D94030]"
    }`}>
      {isOnTrack ? "🟡" : "🔴"} {isOnTrack ? "On Track" : "Behind"}
    </span>
  );
};

/* ── Month/Year options ── */
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const years = Array.from({ length: 30 }, (_, i) => 2025 + i);

/* ── Main ── */
const GoalPlanner = () => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center", containScroll: "trimSnaps" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [holdingsGoal, setHoldingsGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Edit state
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editMonth, setEditMonth] = useState("Dec");
  const [editYear, setEditYear] = useState("2030");
  const [editSavings, setEditSavings] = useState("");
  const [editMonthly, setEditMonthly] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Sort goals by priority (High first)
  const sortedGoals = [...goals].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const activeGoal = sortedGoals[activeIndex] || sortedGoals[0];

  const totalInvested = goals.reduce((s, g) => s + g.investedAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentValue, 0);
  const overallGainPct = ((totalCurrent - totalInvested) / totalInvested) * 100;

  const openEdit = useCallback((goal: Goal) => {
    setEditGoal(goal);
    setEditName(goal.label);
    setEditTarget(String(goal.targetAmount));
    const parts = goal.targetDate.split(" ");
    setEditMonth(parts[0] || "Dec");
    setEditYear(parts[1] || "2030");
    setEditSavings(String(goal.investedAmount));
    setEditMonthly(String(goal.monthlyContribution));
    setEditPriority(goal.priority);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editGoal) return;
    setGoals(prev => prev.map(g => {
      if (g.id !== editGoal.id) return g;
      return {
        ...g,
        label: editName,
        targetAmount: Number(editTarget) || g.targetAmount,
        targetDate: `${editMonth} ${editYear}`,
        investedAmount: Number(editSavings) || g.investedAmount,
        monthlyContribution: Number(editMonthly) || g.monthlyContribution,
        priority: editPriority,
        progressPct: Math.min(100, Math.round(((Number(editSavings) || g.investedAmount) / (Number(editTarget) || g.targetAmount)) * 100)),
      };
    }));
    setEditGoal(null);
    toast({ title: "✅ Goal updated", description: `${editName} has been saved.` });
  }, [editGoal, editName, editTarget, editMonth, editYear, editSavings, editMonthly, editPriority]);

  const deleteGoal = useCallback(() => {
    if (!editGoal) return;
    setGoals(prev => prev.filter(g => g.id !== editGoal.id));
    setEditGoal(null);
    toast({ title: "Goal deleted", variant: "destructive" });
  }, [editGoal]);

  const openContribute = useCallback((goal: Goal) => {
    setContributeGoal(goal);
    setContributeAmount(String(goal.suggestedContribution));
    setCopied(false);
  }, []);

  const shareLink = contributeGoal
    ? `tilly.in/contribute/${contributeGoal.slug}?amt=${contributeAmount || contributeGoal.suggestedContribution}`
    : "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ title: "✅ Copied!", description: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [shareLink]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Contribute to ${contributeGoal?.label}`,
          text: `Help me reach my ${contributeGoal?.label} goal!`,
          url: `https://${shareLink}`,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  }, [contributeGoal, shareLink, handleCopy]);

  return (
    <div className="mobile-container bg-background min-h-screen pb-44">
      {/* Header */}
      <div className="px-5 pt-10 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-card shadow-sm">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Goal Planner</h1>
      </div>

      {/* Summary Strip */}
      <div className="mx-5 mb-3 rounded-2xl bg-card shadow-wealth p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Total Invested</p>
            <p className="text-sm font-bold text-foreground">{formatINR(totalInvested)}</p>
          </div>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex-1 text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Current Value</p>
            <p className="text-sm font-bold text-foreground">{formatINR(totalCurrent)}</p>
          </div>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex-1 text-right">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Overall Gain</p>
            <p className={`text-sm font-bold ${overallGainPct >= 0 ? "text-[hsl(var(--wealth-green))]" : "text-destructive"}`}>
              +{overallGainPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Inline Announcement Ticker */}
      <div className="mx-5 mb-3 h-10 rounded-xl overflow-hidden flex items-center border"
        style={{ background: "#0A2E1A", borderColor: "rgba(34, 197, 94, 0.5)", boxShadow: "0 0 16px rgba(34, 197, 94, 0.4)" }}>
        <div className="animate-ticker whitespace-nowrap text-[12px] font-medium tracking-wide" style={{ color: "#4ADE80" }}>
          🎉 New Feature — Invite family & friends to contribute to your goals and reach them faster, together! ✨
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          🎉 New Feature — Invite family & friends to contribute to your goals and reach them faster, together! ✨
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      {/* Swipeable Goal Cards */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {sortedGoals.map((goal) => (
            <div key={goal.id} className="flex-[0_0_85%] min-w-0 pl-5 first:pl-5 last:pr-5">
              <div className="bg-card rounded-2xl shadow-wealth p-4 relative">
                {/* Edit button */}
                <button
                  onClick={() => openEdit(goal)}
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80 hover:bg-secondary transition-colors z-10"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {/* Card Header */}
                <div className="flex items-center justify-between mb-3 pr-10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{goal.label}</h3>
                      <p className="text-[10px] text-muted-foreground">{formatCompact(goal.targetAmount)} by {goal.targetDate}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StatusPill status={goal.status} />
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    goal.priority === "High" ? "bg-red-100 text-red-600" :
                    goal.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>{goal.priority}</span>
                </div>

                {/* Donut */}
                <div className="flex justify-center mb-3">
                  <DonutRing pct={goal.progressPct} status={goal.status} />
                </div>

                {/* Current / Target */}
                <div className="flex items-baseline justify-center gap-3 mb-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Current</p>
                    <p className="text-lg font-bold text-foreground">{formatINR(goal.currentValue)}</p>
                  </div>
                  <span className="text-muted-foreground text-lg font-light">/</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Target</p>
                    <p className="text-lg font-bold text-foreground">{formatINR(goal.targetAmount)}</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {sortedGoals.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-6 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,8px))] left-0 right-0 z-30">
        <div className="max-w-md mx-auto bg-card border-t border-border px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground italic">
              Suggested for <span className="font-bold text-foreground not-italic">{activeGoal?.label}</span>
            </p>
            <p className="text-base font-bold text-foreground">{activeGoal?.suggestedLabel}</p>
          </div>
          <button
            onClick={() => activeGoal && openContribute(activeGoal)}
            className="min-h-[48px] px-7 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Contribute
          </button>
        </div>
      </div>

      {/* Edit Goal Bottom Sheet */}
      <AnimatePresence>
        {editGoal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setEditGoal(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-card shadow-xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center mb-3"><div className="h-1.5 w-10 rounded-full bg-border" /></div>
              <h3 className="text-sm font-bold text-foreground mb-4">Edit Goal</h3>

              {/* Goal Name */}
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Goal Name</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              />

              {/* Target Amount */}
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Target Amount (₹)</label>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={editTarget}
                  onChange={e => setEditTarget(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-border bg-secondary/40 pl-8 pr-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  {Number(editTarget) >= 10000000 ? `${(Number(editTarget)/10000000).toFixed(1)}Cr` : Number(editTarget) >= 100000 ? `${(Number(editTarget)/100000).toFixed(0)}L` : ""}
                </span>
              </div>

              {/* Target Date - Month/Year */}
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Target Date</label>
              <div className="flex gap-2 mb-3">
                <select
                  value={editMonth}
                  onChange={e => setEditMonth(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={editYear}
                  onChange={e => setEditYear(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>

              {/* Current Savings */}
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Current Savings Allocated (₹)</label>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={editSavings}
                  onChange={e => setEditSavings(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-border bg-secondary/40 pl-8 pr-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Monthly Contribution */}
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Monthly Contribution (₹)</label>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={editMonthly}
                  onChange={e => setEditMonthly(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-border bg-secondary/40 pl-8 pr-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Priority */}
              <label className="block mb-2 text-[11px] font-medium text-muted-foreground">Priority</label>
              <div className="flex gap-2 mb-5">
                {(["Low", "Medium", "High"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setEditPriority(p)}
                    className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold transition-all ${
                      editPriority === p
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/60 text-muted-foreground border border-border"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Save */}
              <button
                onClick={saveEdit}
                className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors mb-3"
              >
                Save Changes
              </button>

              {/* Delete */}
              <button
                onClick={deleteGoal}
                className="w-full text-center text-xs text-destructive/70 hover:text-destructive transition-colors py-2"
              >
                Delete Goal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holdings Bottom Sheet */}
      <AnimatePresence>
        {holdingsGoal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setHoldingsGoal(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-card shadow-xl p-5 pb-24"
            >
              <div className="flex justify-center mb-3"><div className="h-1.5 w-10 rounded-full bg-border cursor-grab" /></div>
              <h3 className="text-sm font-bold text-foreground mb-4">{holdingsGoal.label} — Holdings</h3>
              <div className="space-y-3 pb-20">
                {holdingsGoal.holdings.map((h, i) => (
                  <motion.div key={h.fund} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl bg-secondary/40 p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{h.fund}</p>
                        <p className="text-[10px] text-muted-foreground">{h.category}</p>
                      </div>
                      <span className={`text-xs font-bold ml-2 ${h.gainPct >= 0 ? "text-[hsl(var(--wealth-green))]" : "text-destructive"}`}>
                        +{h.gainPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Invested</p>
                        <p className="text-[11px] font-semibold text-foreground">{formatINR(h.invested)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Current</p>
                        <p className="text-[11px] font-semibold text-foreground">{formatINR(h.current)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribute Bottom Sheet */}
      <AnimatePresence>
        {contributeGoal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setContributeGoal(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-t-2xl bg-card shadow-xl p-5 pb-24"
            >
              <div className="flex justify-center mb-3"><div className="h-1 w-9 rounded-full bg-border" /></div>
              <h3 className="text-sm font-bold text-foreground mb-4">Contribute to {contributeGoal.label}</h3>

              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Contribution amount (₹)</label>
              <input
                type="number"
                value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-border bg-secondary/40 px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              />

              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Share for external contribution! 🎉</label>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 min-h-[48px] rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground truncate flex items-center">
                  {shareLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-[hsl(var(--wealth-green))]" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground mb-4">Share this link with family or friends to contribute</p>

              <button
                onClick={() => { toast({ title: "💰 Add Funds", description: `Adding ₹${contributeAmount} to ${contributeGoal.label}` }); setContributeGoal(null); }}
                className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Funds
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default GoalPlanner;
