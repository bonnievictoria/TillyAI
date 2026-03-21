import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, PenLine, ChevronDown, Plus, X, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import {
  getFullProfile,
  updatePersonalInfo,
  updateInvestmentProfile,
  updateRiskProfile,
  updateConstraints,
  updateTaxProfile,
  updateReviewPreference,
  type FullProfileResponse,
} from "@/lib/api";

type SectionStatus = "not_started" | "in_progress" | "confirmed";

interface FinancialGoal {
  description: string;
  year: string;
}

interface AllocationRange {
  min: number;
  max: number;
}

const STATUS_LABELS: Record<SectionStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  confirmed: "Confirmed",
};

const STATUS_COLORS: Record<SectionStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-[hsl(38_80%_93%)] text-[hsl(38_80%_38%)]",
  confirmed: "bg-[hsl(160_30%_93%)] text-[hsl(160_50%_38%)]",
};

const SECTION_TITLES = [
  "Who are you?",
  "What are you trying to achieve?",
  "How much risk can you handle?",
  "Your financial picture",
  "Rules & limits",
  "Time horizon",
  "Tax situation",
  "Staying involved",
];

const OBJECTIVES = [
  "Wealth Growth",
  "Retirement Planning",
  "Child's Education",
  "Home Purchase",
  "Emergency Fund",
  "Tax Efficiency",
  "Income Generation",
  "Legacy / Estate Planning",
];

const RISK_LEVELS = ["Conservative", "Moderate-Conservative", "Moderate", "Moderate-Aggressive", "Aggressive"];
const RISK_COLORS = [
  "hsl(var(--wealth-green))",
  "hsl(var(--wealth-green) / 0.6)",
  "hsl(var(--wealth-amber))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
];

const HORIZON_OPTIONS = ["0–5 years", "5–10 years", "10–15 years", "15–20 years", "20+ years"];
const DROP_REACTIONS = [
  "Sell everything immediately",
  "Reduce exposure",
  "Stay invested and wait",
  "Stay invested and buy more",
];

const ASSET_COMFORT = ["Equities", "Bonds", "Real Estate", "Gold", "Crypto", "International Markets"];

const ASSET_TYPES = ["Equities", "Bonds", "Real Estate", "Gold", "Crypto", "International Markets"];

const DEFAULT_ALLOCATIONS: Record<string, AllocationRange> = {
  Equities: { min: 40, max: 100 },
  Bonds: { min: 10, max: 30 },
  "Real Estate": { min: 5, max: 20 },
  Gold: { min: 5, max: 15 },
  Crypto: { min: 0, max: 10 },
  "International Markets": { min: 10, max: 25 },
};

const EMERGENCY_TIMEFRAMES = ["3 months", "6 months", "12 months", "Custom"];
const REVIEW_FREQ = ["Monthly", "Quarterly", "Semi-annual"];
const REVIEW_TRIGGERS = ["Job change", "Marriage or divorce", "New dependant", "Major windfall", "Market drop >20%", "Other"];
const WEALTH_SOURCES = ["Salary", "Business", "Inheritance/gift", "Investment returns", "One-off windfall"];

/* ── Reusable micro-components ── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{children}</label>
);

const TextInput = ({ value, onChange, placeholder, prefix }: { value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string }) => (
  <div className="relative">
    {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors placeholder:text-[12px] ${prefix ? "pl-7" : ""}`}
    />
  </div>
);

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${active ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border hover:border-accent/40"}`}
  >
    {label}
  </button>
);

const Toggle = ({ value, onChange, labelA, labelB }: { value: boolean; onChange: (v: boolean) => void; labelA: string; labelB: string }) => (
  <div className="flex gap-2">
    <button onClick={() => onChange(false)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${!value ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border"}`}>{labelA}</button>
    <button onClick={() => onChange(true)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${value ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border"}`}>{labelB}</button>
  </div>
);

const PrefilledBanner = () => (
  <div className="flex items-start gap-2 rounded-lg bg-[hsl(215_40%_94%)] px-3 py-2.5 mb-4">
    <Info className="h-3.5 w-3.5 mt-0.5 text-accent shrink-0" />
    <p className="text-xs text-accent leading-relaxed">We already have some details from your initial setup — please confirm or update below.</p>
  </div>
);

const SelectInput = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors appearance-none placeholder:text-[12px]">
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

/* ── Allocation Bar Component ── */
const AllocationBar = ({
  asset,
  range,
  onChange,
}: {
  asset: string;
  range: AllocationRange;
  onChange: (r: AllocationRange) => void;
}) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.25 }}
    className="overflow-hidden"
  >
    <div className="rounded-lg border border-border bg-card p-3 mt-2 space-y-2">
      <p className="text-xs font-semibold text-foreground">{asset}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground">Min %</label>
          <input
            type="number"
            min={0}
            max={range.max}
            value={range.min}
            onChange={(e) => {
              const v = Math.min(Number(e.target.value), range.max);
              onChange({ ...range, min: Math.max(0, v) });
            }}
            className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1 pt-4">
          <Slider
            value={[range.min, range.max]}
            onValueChange={([min, max]) => onChange({ min, max })}
            min={0}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_.relative>div]:bg-accent [&_[data-orientation=horizontal]]:h-[6px]"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground">Max %</label>
          <input
            type="number"
            min={range.min}
            max={100}
            value={range.max}
            onChange={(e) => {
              const v = Math.max(Number(e.target.value), range.min);
              onChange({ ...range, max: Math.min(100, v) });
            }}
            className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>
    </div>
  </motion.div>
);

const RISK_TAGLINES = [
  "Capital preservation is your priority",
  "Steady growth with limited downside",
  "Balanced risk and reward over time",
  "Growth-focused with short-term volatility",
  "Maximum growth, maximum swings",
];

/* ── Circular Donut Risk Dial (30% smaller) ── */
const RiskDial = ({ level, onChangeLevel }: { level: number; onChangeLevel: (l: number) => void }) => {
  const size = 154; // 220 * 0.7
  const strokeWidth = 15; // 22 * 0.7
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngleDeg = 135;
  const sweepDeg = 270;
  const segments = 5;

  const degToRad = (d: number) => (d * Math.PI) / 180;

  const polarToXY = (angleDeg: number) => ({
    x: cx + radius * Math.cos(degToRad(angleDeg)),
    y: cy + radius * Math.sin(degToRad(angleDeg)),
  });

  const levelAngle = (idx: number) => startAngleDeg + (idx / (segments - 1)) * sweepDeg;

  const thumbAngle = levelAngle(level);
  const thumbPos = polarToXY(thumbAngle);

  const arcPath = (from: number, to: number) => {
    const s = polarToXY(from);
    const e = polarToXY(to);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const handlePointerEvent = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * size;
    const py = ((e.clientY - rect.top) / rect.height) * size;

    let angle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let relAngle = angle - startAngleDeg;
    if (relAngle < -45) relAngle += 360;
    if (relAngle < 0) relAngle = 0;
    if (relAngle > sweepDeg) relAngle = sweepDeg;

    const closest = Math.round((relAngle / sweepDeg) * (segments - 1));
    onChangeLevel(Math.max(0, Math.min(segments - 1, closest)));
  };

  const [dragging, setDragging] = useState(false);

  // 30% more opaque (reduce saturation/opacity) — softer colors
  const gradientColors = [
    "hsla(210, 45%, 55%, 0.7)",
    "hsla(160, 38%, 45%, 0.7)",
    "hsla(45, 60%, 50%, 0.7)",
    "hsla(20, 60%, 50%, 0.7)",
    "hsla(0, 50%, 50%, 0.7)",
  ];

  const displayLabel = RISK_LEVELS[level];
  const displayTagline = RISK_TAGLINES[level];

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="touch-none cursor-pointer"
        onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); handlePointerEvent(e); }}
        onPointerMove={(e) => { if (dragging) handlePointerEvent(e); }}
        onPointerUp={() => setDragging(false)}
      >
        <path
          d={arcPath(startAngleDeg, startAngleDeg + sweepDeg)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {gradientColors.map((color, i) => {
          const segStart = startAngleDeg + (i / segments) * sweepDeg;
          const segEnd = startAngleDeg + ((i + 1) / segments) * sweepDeg;
          const isActive = i <= level;
          return (
            <path
              key={i}
              d={arcPath(segStart, segEnd)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              opacity={isActive ? 1 : 0.15}
              className="transition-opacity duration-300"
            />
          );
        })}
        {(
          <circle
            cx={thumbPos.x}
            cy={thumbPos.y}
            r={10}
            fill="white"
            stroke="hsl(var(--accent))"
            strokeWidth={2.5}
            className="drop-shadow-md"
          />
        )}
      </svg>
      <div className="relative -mt-[98px] mb-[21px] flex flex-col items-center text-center pointer-events-none" style={{ width: size }}>
        <p className="text-xs font-bold text-foreground">{displayLabel}</p>
        <p className="text-[10px] italic text-muted-foreground mt-0.5 px-4">{displayTagline}</p>
      </div>
    </div>
  );
};

/* ── Helpers ── */
const parseNum = (s: string | undefined | null): string => {
  if (s == null) return "";
  const n = Number(s);
  if (Number.isNaN(n) || n === 0) return "";
  return n.toLocaleString("en-IN");
};

const toNum = (s: string): number | null => {
  const cleaned = s.replace(/[₹,\s]/g, "");
  if (!cleaned) return null;
  const crMatch = cleaned.match(/^([\d.]+)\s*[Cc]r$/);
  if (crMatch) return parseFloat(crMatch[1]) * 10_000_000;
  const lMatch = cleaned.match(/^([\d.]+)\s*[Ll]$/);
  if (lMatch) return parseFloat(lMatch[1]) * 100_000;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
};

/* ── Main Component ── */
const CompleteProfile = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState(0);
  const [statuses, setStatuses] = useState<SectionStatus[]>(Array(8).fill("not_started"));
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Section 1
  const [occupation, setOccupation] = useState("");
  const [family, setFamily] = useState("");
  const [wealthSources, setWealthSources] = useState<string[]>([]);
  const [values, setValues] = useState("");

  // Section 2 — multi-select objectives
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([{ description: "", year: "" }]);
  const [portfolioValue, setPortfolioValue] = useState("");
  const [monthlySavings, setMonthlySavings] = useState("");
  const [targetCorpus, setTargetCorpus] = useState("");
  const [targetTimeline, setTargetTimeline] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [retirementAge, setRetirementAge] = useState("");

  // Section 3 — risk
  const [riskLevelIdx, setRiskLevelIdx] = useState(2);
  const [investmentHorizon, setInvestmentHorizon] = useState("");
  const [dropReaction, setDropReaction] = useState("");
  const [maxDrawdown, setMaxDrawdown] = useState("");
  const [comfortAssets, setComfortAssets] = useState<string[]>([]);

  // Section 4
  const [investableAssets, setInvestableAssets] = useState("");
  const [liabilities, setLiabilities] = useState("");
  const [propertyValue, setPropertyValue] = useState("");
  const [mortgage, setMortgage] = useState("");
  const [expectedInflows, setExpectedInflows] = useState("");
  const [outgoings, setOutgoings] = useState("");
  const [plannedExpenses, setPlannedExpenses] = useState("");
  const [emergencyFund, setEmergencyFund] = useState("");
  const [emergencyTimeframe, setEmergencyTimeframe] = useState("6 months");

  // Section 5 — rules & limits with allocation bars
  const [permittedAssets, setPermittedAssets] = useState<string[]>(["Equities", "Bonds", "Gold"]);
  const [allocations, setAllocations] = useState<Record<string, AllocationRange>>(() => {
    const init: Record<string, AllocationRange> = {};
    ["Equities", "Bonds", "Gold"].forEach((a) => {
      init[a] = { ...DEFAULT_ALLOCATIONS[a] };
    });
    return init;
  });
  const [prohibited, setProhibited] = useState("");
  const [leverage, setLeverage] = useState(false);
  const [leverageNotes, setLeverageNotes] = useState("");
  const [derivatives, setDerivatives] = useState(false);
  const [derivativesNotes, setDerivativesNotes] = useState("");
  const [diversificationNotes, setDiversificationNotes] = useState("");

  // Section 6
  const [multiPhase, setMultiPhase] = useState(false);
  const [phaseDescription, setPhaseDescription] = useState("");
  const [totalHorizon, setTotalHorizon] = useState("");

  // Section 7
  const [incomeTaxRate, setIncomeTaxRate] = useState("");
  const [cgtRate, setCgtRate] = useState("");
  const [taxNotes, setTaxNotes] = useState("");

  // Section 8
  const [reviewFreq, setReviewFreq] = useState("Quarterly");
  const [reviewTriggers, setReviewTriggers] = useState<string[]>([]);
  const [updateProcess, setUpdateProcess] = useState("");

  // ── Load existing profile from backend ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getFullProfile();
        if (cancelled) return;
        const newStatuses: SectionStatus[] = Array(8).fill("not_started");

        // Section 1 — personal info
        if (p.personal_info) {
          const pi = p.personal_info;
          if (pi.occupation) setOccupation(pi.occupation);
          if (pi.family_status) setFamily(pi.family_status);
          if (pi.wealth_sources) setWealthSources(pi.wealth_sources);
          if (pi.personal_values) setValues(pi.personal_values.join(", "));
          if (pi.occupation || pi.family_status) newStatuses[0] = "confirmed";
        }

        // Section 2 + 4 — investment profile
        if (p.investment_profile) {
          const ip = p.investment_profile;
          if (ip.objectives?.length) setSelectedObjectives(ip.objectives);
          if (ip.detailed_goals?.length) {
            setGoals(ip.detailed_goals.map((g) => ({
              description: (g.description as string) ?? "",
              year: (g.year as string) ?? "",
            })));
          }
          setPortfolioValue(parseNum(ip.portfolio_value?.toString()));
          setMonthlySavings(parseNum(ip.monthly_savings?.toString()));
          setTargetCorpus(parseNum(ip.target_corpus?.toString()));
          if (ip.target_timeline) setTargetTimeline(ip.target_timeline);
          setAnnualIncome(parseNum(ip.annual_income?.toString()));
          if (ip.retirement_age) setRetirementAge(String(ip.retirement_age));
          if (ip.objectives?.length) newStatuses[1] = "confirmed";

          // Section 4 — financial situation
          setInvestableAssets(parseNum(ip.investable_assets?.toString()));
          setLiabilities(parseNum(ip.total_liabilities?.toString()));
          setPropertyValue(parseNum(ip.property_value?.toString()));
          setMortgage(parseNum(ip.mortgage_amount?.toString()));
          setExpectedInflows(parseNum(ip.expected_inflows?.toString()));
          setOutgoings(parseNum(ip.regular_outgoings?.toString()));
          setPlannedExpenses(parseNum(ip.planned_major_expenses?.toString()));
          setEmergencyFund(parseNum(ip.emergency_fund?.toString()));
          if (ip.emergency_fund_months) setEmergencyTimeframe(ip.emergency_fund_months);
          if (ip.investable_assets != null) newStatuses[3] = "confirmed";

          // Section 6 — time horizon
          if (ip.is_multi_phase_horizon != null) setMultiPhase(ip.is_multi_phase_horizon);
          if (ip.phase_description) setPhaseDescription(ip.phase_description);
          if (ip.total_horizon) setTotalHorizon(ip.total_horizon);
          if (ip.total_horizon) newStatuses[5] = "confirmed";
        }

        // Section 3 — risk
        if (p.risk_profile) {
          const rp = p.risk_profile;
          if (rp.risk_level != null) setRiskLevelIdx(rp.risk_level);
          if (rp.investment_horizon) setInvestmentHorizon(rp.investment_horizon);
          if (rp.drop_reaction) setDropReaction(rp.drop_reaction);
          if (rp.max_drawdown != null) setMaxDrawdown(String(rp.max_drawdown));
          if (rp.comfort_assets) setComfortAssets(rp.comfort_assets);
          if (rp.risk_level != null) newStatuses[2] = "confirmed";
        }

        // Section 5 — constraints
        if (p.investment_constraint) {
          const ic = p.investment_constraint;
          if (ic.permitted_assets?.length) setPermittedAssets(ic.permitted_assets);
          if (ic.prohibited_instruments?.length) setProhibited(ic.prohibited_instruments.join(", "));
          if (ic.is_leverage_allowed != null) setLeverage(ic.is_leverage_allowed);
          if (ic.is_derivatives_allowed != null) setDerivatives(ic.is_derivatives_allowed);
          if (ic.diversification_notes) setDiversificationNotes(ic.diversification_notes);
          if (ic.allocation_constraints?.length) {
            const loaded: Record<string, AllocationRange> = {};
            ic.allocation_constraints.forEach((ac) => {
              loaded[ac.asset_class] = {
                min: ac.min_allocation ?? 0,
                max: ac.max_allocation ?? 100,
              };
            });
            setAllocations((prev) => ({ ...prev, ...loaded }));
          }
          if (ic.permitted_assets?.length) newStatuses[4] = "confirmed";
        }

        // Section 7 — tax
        if (p.tax_profile) {
          const tp = p.tax_profile;
          if (tp.income_tax_rate != null) setIncomeTaxRate(String(tp.income_tax_rate));
          if (tp.capital_gains_tax_rate != null) setCgtRate(String(tp.capital_gains_tax_rate));
          if (tp.notes) setTaxNotes(tp.notes);
          if (tp.income_tax_rate != null) newStatuses[6] = "confirmed";
        }

        // Section 8 — review
        if (p.review_preference) {
          const rp = p.review_preference;
          if (rp.frequency) setReviewFreq(rp.frequency);
          if (rp.triggers) setReviewTriggers(rp.triggers);
          if (rp.update_process) setUpdateProcess(rp.update_process);
          if (rp.frequency) newStatuses[7] = "confirmed";
        }

        setStatuses(newStatuses);
        const firstIncomplete = newStatuses.findIndex((s) => s !== "confirmed");
        if (firstIncomplete >= 0) setOpenSection(firstIncomplete);
      } catch {
        // first-time user — no profile yet, use defaults
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const confirmedCount = statuses.filter((s) => s === "confirmed").length;
  const progressPercent = Math.round((confirmedCount / 8) * 100);
  const allConfirmed = confirmedCount === 8;

  const totalMaxAllocation = useMemo(() => {
    return permittedAssets.reduce((sum, a) => sum + (allocations[a]?.max || 0), 0);
  }, [permittedAssets, allocations]);

  const confirmSection = useCallback(async (idx: number) => {
    try {
      switch (idx) {
        case 0:
          await updatePersonalInfo({
            occupation: occupation || null,
            family_status: family || null,
            wealth_sources: wealthSources.length ? wealthSources : null,
            personal_values: values ? values.split(",").map((v) => v.trim()).filter(Boolean) : null,
          });
          break;
        case 1:
          await updateInvestmentProfile({
            objectives: selectedObjectives.length ? selectedObjectives : null,
            detailed_goals: goals.filter((g) => g.description).map((g) => ({ description: g.description, year: g.year })),
            portfolio_value: toNum(portfolioValue),
            monthly_savings: toNum(monthlySavings),
            target_corpus: toNum(targetCorpus),
            target_timeline: targetTimeline || null,
            annual_income: toNum(annualIncome),
            retirement_age: retirementAge ? Number(retirementAge) : null,
          });
          break;
        case 2:
          await updateRiskProfile({
            risk_level: riskLevelIdx,
            investment_horizon: investmentHorizon || null,
            drop_reaction: dropReaction || null,
            max_drawdown: maxDrawdown ? Number(maxDrawdown) : null,
            comfort_assets: comfortAssets.length ? comfortAssets : null,
          });
          break;
        case 3:
          await updateInvestmentProfile({
            investable_assets: toNum(investableAssets),
            total_liabilities: toNum(liabilities),
            property_value: toNum(propertyValue),
            mortgage_amount: toNum(mortgage),
            expected_inflows: toNum(expectedInflows),
            regular_outgoings: toNum(outgoings),
            planned_major_expenses: toNum(plannedExpenses),
            emergency_fund: toNum(emergencyFund),
            emergency_fund_months: emergencyTimeframe || null,
          });
          break;
        case 4:
          await updateConstraints({
            permitted_assets: permittedAssets.length ? permittedAssets : null,
            prohibited_instruments: prohibited ? prohibited.split(",").map((s) => s.trim()).filter(Boolean) : null,
            is_leverage_allowed: leverage,
            is_derivatives_allowed: derivatives,
            diversification_notes: diversificationNotes || null,
            allocation_constraints: permittedAssets.map((asset) => ({
              asset_class: asset,
              min_allocation: allocations[asset]?.min ?? null,
              max_allocation: allocations[asset]?.max ?? null,
            })),
          });
          break;
        case 5:
          await updateInvestmentProfile({
            is_multi_phase_horizon: multiPhase,
            phase_description: phaseDescription || null,
            total_horizon: totalHorizon || null,
          });
          break;
        case 6:
          await updateTaxProfile({
            income_tax_rate: incomeTaxRate ? Number(incomeTaxRate) : null,
            capital_gains_tax_rate: cgtRate ? Number(cgtRate) : null,
            notes: taxNotes || null,
          });
          break;
        case 7:
          await updateReviewPreference({
            frequency: reviewFreq || null,
            triggers: reviewTriggers.length ? reviewTriggers : null,
            update_process: updateProcess || null,
          });
          break;
      }
    } catch (err) {
      toast.error(`Failed to save: ${err instanceof Error ? err.message : "unknown error"}`);
      return;
    }

    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = "confirmed";
      return next;
    });
    if (idx < 7) setOpenSection(idx + 1);
    toast.success(`Section ${idx + 1} confirmed ✓`);
  }, [
    occupation, family, wealthSources, values,
    selectedObjectives, goals, portfolioValue, monthlySavings, targetCorpus, targetTimeline, annualIncome, retirementAge,
    riskLevelIdx, investmentHorizon, dropReaction, maxDrawdown, comfortAssets,
    investableAssets, liabilities, propertyValue, mortgage, expectedInflows, outgoings, plannedExpenses, emergencyFund, emergencyTimeframe,
    permittedAssets, allocations, prohibited, leverage, derivatives, diversificationNotes,
    multiPhase, phaseDescription, totalHorizon,
    incomeTaxRate, cgtRate, taxNotes,
    reviewFreq, reviewTriggers, updateProcess,
  ]);

  const markInProgress = useCallback((idx: number) => {
    setStatuses((prev) => {
      if (prev[idx] === "confirmed") return prev;
      const next = [...prev];
      next[idx] = "in_progress";
      return next;
    });
  }, []);

  const toggleSection = (idx: number) => {
    setOpenSection(openSection === idx ? -1 : idx);
    markInProgress(idx);
  };

  const toggleChipArray = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const toggleAsset = (asset: string) => {
    if (permittedAssets.includes(asset)) {
      setPermittedAssets((prev) => prev.filter((a) => a !== asset));
      setAllocations((prev) => {
        const next = { ...prev };
        delete next[asset];
        return next;
      });
    } else {
      setPermittedAssets((prev) => [...prev, asset]);
      setAllocations((prev) => ({
        ...prev,
        [asset]: { ...DEFAULT_ALLOCATIONS[asset] },
      }));
    }
  };

  const updateAllocation = (asset: string, range: AllocationRange) => {
    setAllocations((prev) => ({ ...prev, [asset]: range }));
  };

  const addGoal = () => setGoals((prev) => [...prev, { description: "", year: "" }]);
  const removeGoal = (i: number) => setGoals((prev) => prev.filter((_, idx) => idx !== i));
  const updateGoal = (i: number, field: keyof FinancialGoal, value: string) => {
    setGoals((prev) => prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)));
  };

  const handleTillyMode = () => {
    navigate("/chat");
  };

  const renderSection = (idx: number) => {
    switch (idx) {
      case 0:
        return (
          <div className="space-y-3">
            <div><FieldLabel>Occupation</FieldLabel><TextInput value={occupation} onChange={setOccupation} placeholder="e.g. Software engineer" /></div>
            <div><FieldLabel>Family situation</FieldLabel><TextInput value={family} onChange={setFamily} placeholder="e.g. Partner + 2 children, spouse also earns" /></div>
            <div>
              <FieldLabel>Wealth source (select all that apply)</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {WEALTH_SOURCES.map((s) => (
                  <Chip key={s} label={s} active={wealthSources.includes(s)} onClick={() => toggleChipArray(wealthSources, s, setWealthSources)} />
                ))}
              </div>
            </div>
            <div><FieldLabel>Values / exclusions</FieldLabel><TextInput value={values} onChange={setValues} placeholder="e.g. ESG preferred, no defence stocks" /></div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <PrefilledBanner />
            <div>
              <FieldLabel>Primary objective (select up to 3+)</FieldLabel>
              <p className="text-[10px] text-muted-foreground mb-2">From your initial setup — still correct?</p>
              <div className="grid grid-cols-2 gap-2">
                {OBJECTIVES.map((o) => (
                  <Chip
                    key={o}
                    label={o}
                    active={selectedObjectives.includes(o)}
                    onClick={() => toggleChipArray(selectedObjectives, o, setSelectedObjectives)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <FieldLabel>Financial goals — prefilled</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-muted-foreground">Current Portfolio Value</label><TextInput value={portfolioValue} onChange={setPortfolioValue} prefix="₹" /></div>
                <div><label className="text-[10px] text-muted-foreground">Monthly Savings</label><TextInput value={monthlySavings} onChange={setMonthlySavings} prefix="₹" /></div>
                <div><label className="text-[10px] text-muted-foreground">Target Corpus</label><TextInput value={targetCorpus} onChange={setTargetCorpus} prefix="₹" /></div>
                <div><label className="text-[10px] text-muted-foreground">Target Timeline (yrs)</label><TextInput value={targetTimeline} onChange={setTargetTimeline} /></div>
                <div><label className="text-[10px] text-muted-foreground">Annual Income</label><TextInput value={annualIncome} onChange={setAnnualIncome} prefix="₹" /></div>
                <div><label className="text-[10px] text-muted-foreground">Retirement Age</label><TextInput value={retirementAge} onChange={setRetirementAge} /></div>
              </div>
            </div>
            <div>
              <FieldLabel>Additional goals + target year</FieldLabel>
              {goals.map((g, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="flex-1"><TextInput value={g.description} onChange={(v) => updateGoal(i, "description", v)} placeholder="Goal description" /></div>
                  <div className="w-24"><TextInput value={g.year} onChange={(v) => updateGoal(i, "year", v)} placeholder="Year" /></div>
                  {goals.length > 1 && <button onClick={() => removeGoal(i)} className="mt-2 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
              <button onClick={addGoal} className="flex items-center gap-1 text-xs text-accent font-medium mt-1"><Plus className="h-3 w-3" /> Add goal</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <PrefilledBanner />
            {/* Risk Dial */}
            <div>
              <FieldLabel>Risk tolerance</FieldLabel>
              <RiskDial level={riskLevelIdx} onChangeLevel={setRiskLevelIdx} />
            </div>

            <div>
              <FieldLabel>Investment horizon</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {HORIZON_OPTIONS.map((h) => (
                  <Chip key={h} label={h} active={investmentHorizon === h} onClick={() => setInvestmentHorizon(h)} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Reaction to 20% portfolio drop</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {DROP_REACTIONS.map((d) => (
                  <Chip key={d} label={d} active={dropReaction === d} onClick={() => setDropReaction(d)} />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Max acceptable annual drawdown (%)</FieldLabel>
              <TextInput value={maxDrawdown} onChange={setMaxDrawdown} placeholder="e.g. 25" />
            </div>

            <div>
              <FieldLabel>Comfort across asset classes</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ASSET_COMFORT.map((a) => (
                  <Chip
                    key={a}
                    label={a}
                    active={comfortAssets.includes(a)}
                    onClick={() => toggleChipArray(comfortAssets, a, setComfortAssets)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <div><FieldLabel>Investable assets</FieldLabel><TextInput value={investableAssets} onChange={setInvestableAssets} prefix="₹" placeholder="e.g. 42,00,000" /></div>
            <div><FieldLabel>Total liabilities / debts</FieldLabel><TextInput value={liabilities} onChange={setLiabilities} prefix="₹" placeholder="e.g. 5,00,000" /></div>
            <div><FieldLabel>Property owned (estimated value)</FieldLabel><TextInput value={propertyValue} onChange={setPropertyValue} prefix="₹" placeholder="e.g. 1.20 Cr" /></div>
            <div><FieldLabel>Outstanding mortgage</FieldLabel><TextInput value={mortgage} onChange={setMortgage} prefix="₹" placeholder="e.g. 45,00,000" /></div>
            <div><FieldLabel>Expected inflows</FieldLabel><TextInput value={expectedInflows} onChange={setExpectedInflows} placeholder="e.g. annual bonus, business sale in 2026" /></div>
            <div><FieldLabel>Regular outgoings</FieldLabel><TextInput value={outgoings} onChange={setOutgoings} placeholder="Monthly or annual" /></div>
            <div><FieldLabel>Planned large expenses</FieldLabel><TextInput value={plannedExpenses} onChange={setPlannedExpenses} placeholder="e.g. school fees from 2026, property purchase" /></div>
            <div className="flex gap-3">
              <div className="flex-1"><FieldLabel>Emergency fund target</FieldLabel><TextInput value={emergencyFund} onChange={setEmergencyFund} prefix="₹" placeholder="e.g. 3,00,000" /></div>
              <div className="w-32"><FieldLabel>Timeframe</FieldLabel><SelectInput value={emergencyTimeframe} onChange={setEmergencyTimeframe} options={EMERGENCY_TIMEFRAMES} /></div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Permitted asset types</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ASSET_TYPES.map((a) => (
                  <Chip key={a} label={a} active={permittedAssets.includes(a)} onClick={() => toggleAsset(a)} />
                ))}
              </div>

              {/* Inline allocation bars */}
              <AnimatePresence>
                {permittedAssets.map((asset) => (
                  <AllocationBar
                    key={asset}
                    asset={asset}
                    range={allocations[asset] || DEFAULT_ALLOCATIONS[asset]}
                    onChange={(r) => updateAllocation(asset, r)}
                  />
                ))}
              </AnimatePresence>

              {/* Running total */}
              {permittedAssets.length > 0 && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${totalMaxAllocation > 100 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  {totalMaxAllocation > 100 && <AlertTriangle className="inline h-3 w-3 mr-1 -mt-0.5" />}
                  Total max allocation: {totalMaxAllocation}%
                  {totalMaxAllocation > 100 && " — ⚠ Total max allocation exceeds 100% — please adjust"}
                </div>
              )}
            </div>
            <div><FieldLabel>Prohibited investments</FieldLabel><TextInput value={prohibited} onChange={setProhibited} placeholder="e.g. tobacco, gambling, leveraged products" /></div>
            <div>
              <FieldLabel>Leverage</FieldLabel>
              <Toggle value={leverage} onChange={setLeverage} labelA="No" labelB="Yes" />
              {leverage && <div className="mt-2"><TextInput value={leverageNotes} onChange={setLeverageNotes} placeholder="Notes on leverage use" /></div>}
            </div>
            <div>
              <FieldLabel>Derivatives</FieldLabel>
              <Toggle value={derivatives} onChange={setDerivatives} labelA="No" labelB="Yes" />
              {derivatives && <div className="mt-2"><TextInput value={derivativesNotes} onChange={setDerivativesNotes} placeholder="Notes on derivatives use" /></div>}
            </div>
            <div><FieldLabel>Diversification notes (optional)</FieldLabel><TextInput value={diversificationNotes} onChange={setDiversificationNotes} placeholder="Any specific diversification requirements" /></div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Single or multi-phase</FieldLabel>
              <Toggle value={multiPhase} onChange={setMultiPhase} labelA="One continuous period" labelB="Multiple phases" />
            </div>
            {multiPhase && <div><FieldLabel>Phase description</FieldLabel><TextInput value={phaseDescription} onChange={setPhaseDescription} placeholder="Describe your investment phases" /></div>}
            <div><FieldLabel>Total horizon (years)</FieldLabel><TextInput value={totalHorizon} onChange={setTotalHorizon} placeholder="e.g. 15" /></div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <div><FieldLabel>Income tax rate</FieldLabel><TextInput value={incomeTaxRate} onChange={setIncomeTaxRate} placeholder="e.g. 30" /></div>
            <div><FieldLabel>Capital gains tax rate</FieldLabel><TextInput value={cgtRate} onChange={setCgtRate} placeholder="e.g. 15 (LTCG) / 20 (STCG)" /></div>
            <div><FieldLabel>Additional notes (optional)</FieldLabel><TextInput value={taxNotes} onChange={setTaxNotes} placeholder="e.g. NRI status, HUF structure" /></div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Review frequency</FieldLabel>
              <div className="flex flex-wrap gap-2">{REVIEW_FREQ.map((f) => <Chip key={f} label={f} active={reviewFreq === f} onClick={() => setReviewFreq(f)} />)}</div>
            </div>
            <div>
              <FieldLabel>Review triggers</FieldLabel>
              <div className="flex flex-wrap gap-2">{REVIEW_TRIGGERS.map((t) => <Chip key={t} label={t} active={reviewTriggers.includes(t)} onClick={() => toggleChipArray(reviewTriggers, t, setReviewTriggers)} />)}</div>
            </div>
            <div><FieldLabel>Update process preference (optional)</FieldLabel><TextInput value={updateProcess} onChange={setUpdateProcess} placeholder="How would you like to communicate updates?" /></div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!profileLoaded) {
    return (
      <div className="mobile-container bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-10 pb-1 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-foreground">Complete Your Investment Profile</h1>
          <p className="text-[11px] text-muted-foreground">Takes 10–15 minutes · We've pre-filled what we already know</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground font-medium">Section {Math.min(openSection + 1, 8)} of 8</span>
          <span className="text-[11px] text-muted-foreground">{confirmedCount}/8 confirmed</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={handleTillyMode}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-muted-foreground py-2.5 text-xs font-medium transition-all hover:border-accent/40"
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" /><span>Guide me (Chat with Tilly)</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 text-accent py-2.5 text-xs font-medium"
        >
          <PenLine className="h-3.5 w-3.5" /> I'll fill it in myself
        </button>
      </div>

      {/* Accordion sections */}
      <div className="px-5 space-y-2">
        {SECTION_TITLES.map((title, idx) => {
          const isOpen = openSection === idx;
          const status = statuses[idx];
          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <button onClick={() => toggleSection(idx)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1">
                      {renderSection(idx)}
                      <button onClick={() => confirmSection(idx)} className="w-full mt-4 rounded-xl bg-accent text-accent-foreground py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity">
                        Confirm & continue →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-t border-border px-5 py-4">
        <div className="max-w-md mx-auto">
          <button
            disabled={!allConfirmed}
            onClick={() => {
              toast.success("Generating your Investment Policy Statement…");
              navigate("/profile/ips");
            }}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${allConfirmed ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            Generate My Investment Policy Statement →
          </button>
          <p className="text-[10px] text-center text-muted-foreground mt-1.5">Your answers are saved automatically</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
