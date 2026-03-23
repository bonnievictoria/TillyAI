import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts";
import BottomNav from "@/components/BottomNav";
import confetti from "canvas-confetti";
const projectionData = [
  { year: "2024", actual: 9600000, projected: 9600000 },
  { year: "2025", actual: 12400000, projected: 12400000 },
  { year: "2026", actual: 15000000, projected: 15000000 },
  { year: "2027", actual: null, projected: 21200000 },
  { year: "2028", actual: null, projected: 27600000 },
  { year: "2029", actual: null, projected: 34400000 },
  { year: "2030", actual: null, projected: 40000000 },
];

const milestones = [
  { label: "25% reached", year: "2025", done: true, emoji: "🎉" },
  { label: "50% by 2028", year: "2028", done: false, emoji: "🚀" },
  { label: "100% target", year: "2030", done: false, emoji: "🏆" },
];

const stats = [
  { emoji: "💰", label: "Saved so far", value: "₹1,50,00,000" },
  { emoji: "🎯", label: "Remaining", value: "₹2,50,00,000" },
  { emoji: "📅", label: "Years to goal", value: "4" },
];

const formatINR = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
  return `₹${v / 1000}k`;
};

const TARGET_VALUE = 37.5;

const GoalTracker = () => {
  const navigate = useNavigate();
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [fillDone, setFillDone] = useState(false);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const start = performance.now();
    const duration = 1350;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(eased * TARGET_VALUE);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setFillDone(true);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const handleBarTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    clearTimeout(tooltipTimer.current);
    setTooltip({ visible: true, x: Math.min(Math.max(x, 10), 90) });
    tooltipTimer.current = setTimeout(() => setTooltip(null), 2500);
  };

  useEffect(() => {
    const colors = ["#1e3a5f", "#3b82f6", "#f59e0b", "#10b981"];
    setTimeout(() => {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.3, x: 0.5 }, colors, gravity: 0.8 });
    }, 600);
  }, []);

  return (
    <div className="mobile-container bg-background pb-16 min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-2 flex items-center gap-3">
        <button onClick={() => navigate("/profile")} className="flex h-7 w-7 items-center justify-center rounded-xl bg-secondary">
          <ArrowLeft className="h-3.5 w-3.5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Goal Tracker</h1>
      </div>

      {/* Goal Card */}
      <div className="px-5 mb-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="wealth-card !p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏡</span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Save for a New Property</h2>
              <p className="text-[10px] text-muted-foreground">Target: ₹4,00,00,000 (4 Crore) by 2030</p>
            </div>
          </div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Progress</span>
            <span className="text-[10px] font-semibold text-foreground">37.5%</span>
          </div>

          {/* Custom animated progress bar */}
          <div className="relative mb-1">
            <div
              ref={barRef}
              onClick={handleBarTap}
              className="relative h-1.5 w-full rounded-full bg-secondary cursor-pointer overflow-visible"
            >
              <div
                className="h-full rounded-full bg-primary transition-none"
                style={{ width: `${animatedValue}%` }}
              />
              {/* Pulsing glow at tip */}
              {fillDone && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full"
                  style={{
                    left: `${TARGET_VALUE}%`,
                    transform: `translate(-50%, -50%)`,
                    background: "hsl(var(--primary))",
                    animation: "goal-tip-pulse 2s ease-in-out infinite",
                  }}
                />
              )}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {tooltip?.visible && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -top-9 px-2 py-1 rounded-lg bg-card shadow-wealth border border-border text-[9px] font-medium text-foreground whitespace-nowrap pointer-events-none z-10"
                  style={{ left: `${tooltip.x}%`, transform: "translateX(-50%)" }}
                >
                  ₹1,00,00,000 more to reach your 50% milestone!
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] font-medium text-accent text-center"
          >
            You're 37% of the way there — great momentum! 🚀
          </motion.p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-2">
        <div className="grid grid-cols-3 gap-1.5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHoveredStat(i)}
              onHoverEnd={() => setHoveredStat(null)}
              className={`wealth-card flex flex-col items-center text-center !py-2 !px-1 cursor-default transition-shadow duration-200 ${hoveredStat === i ? "shadow-wealth-lg" : ""}`}
            >
              <motion.span
                className="text-sm mb-0.5"
                animate={hoveredStat === i ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {s.emoji}
              </motion.span>
              <p className="text-[9px] text-muted-foreground mb-0.5">{s.label}</p>
              <p className="text-[10px] font-semibold text-foreground">{s.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Projection Chart */}
      <div className="px-5 mb-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="wealth-card !p-3">
          <h3 className="text-[11px] font-semibold text-foreground mb-1.5">Projected Trajectory</h3>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(215, 60%, 48%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(215, 60%, 48%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 50%, 38%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(160, 50%, 38%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 8, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 7, fill: "hsl(220, 10%, 46%)" }} axisLine={false} tickLine={false} tickFormatter={formatINR} />
                <ReferenceLine y={40000000} stroke="hsl(38, 80%, 48%)" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Target", position: "right", fontSize: 7, fill: "hsl(38, 80%, 48%)" }} />
                <Area type="monotone" dataKey="actual" stroke="hsl(215, 60%, 48%)" strokeWidth={2} fill="url(#actualGrad)" dot={{ r: 2, fill: "hsl(215, 60%, 48%)" }} connectNulls={false} />
                <Area type="monotone" dataKey="projected" stroke="hsl(160, 50%, 38%)" strokeWidth={2} strokeDasharray="6 3" fill="url(#projGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Milestones */}
      <div className="px-5 mb-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="wealth-card !p-3">
          <h3 className="text-[11px] font-semibold text-foreground mb-1.5">Milestones</h3>
          <div className="space-y-1.5">
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-2"
              >
                <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-semibold ${m.done ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {m.done ? "✓" : "○"}
                </div>
                <p className={`flex-1 text-[11px] ${m.done ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {m.label} {m.done && <span>{m.emoji}</span>}
                </p>
                <span className="text-[9px] text-muted-foreground">{m.year}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Add New Goal */}
      <div className="px-5 mb-1">
        <button className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add New Goal
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default GoalTracker;
