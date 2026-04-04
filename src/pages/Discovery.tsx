import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Search, ArrowRight, ArrowLeft, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import {
  listDiscoveryFunds,
  listDiscoveryHouseView,
  listDiscoverySectors,
  listDiscoveryTrending,
  type DiscoveryFund,
  type DiscoverySector,
} from "@/lib/api";

/* ── Sparkline SVGs — unique per sector ── */
const sparklines: Record<string, string> = {
  Technology: "0,18 8,14 16,16 24,8 32,10 40,2",
  Healthcare: "0,16 8,18 16,12 24,14 32,8 40,6",
  "Banking & Finance": "0,20 8,16 16,18 24,10 32,6 40,4",
  Energy: "0,14 8,18 16,10 24,12 32,6 40,2",
  "Consumer Goods": "0,18 8,20 16,16 24,14 32,10 40,8",
  Infrastructure: "0,20 8,16 16,14 24,12 32,8 40,6",
  FMCG: "0,18 8,16 16,20 24,14 32,10 40,8",
  Auto: "0,20 8,14 16,16 24,10 32,8 40,4",
};

/* ── Sector icon SVG paths ── */
const SectorIcon = ({ sector }: { sector: string }) => {
  const icons: Record<string, React.ReactNode> = {
    Technology: <path d="M4 6h16v10H4zM8 20h8M12 16v4" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    Healthcare: <><path d="M12 4v16M4 12h16" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" /><rect x="8" y="8" width="8" height="8" rx="1" strokeWidth="1.5" stroke="currentColor" fill="none" /></>,
    "Banking & Finance": <><path d="M3 21h18M5 21V10l7-6 7 6v11" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" /><rect x="9" y="14" width="6" height="7" strokeWidth="1.5" stroke="currentColor" fill="none" /></>,
    Energy: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    "Consumer Goods": <><circle cx="9" cy="20" r="1.5" strokeWidth="1.5" stroke="currentColor" fill="none" /><circle cx="17" cy="20" r="1.5" strokeWidth="1.5" stroke="currentColor" fill="none" /><path d="M3 3h2l2.5 12h10l2-7H7" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    Infrastructure: <path d="M4 21V8l4-4 4 4v13M16 21V12l4-4v13M8 11v2M8 16v2M12 11v2M12 16v2" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />,
    FMCG: <><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.5" stroke="currentColor" fill="none" /><path d="M8 10h8M8 14h5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" /></>,
    Auto: <><path d="M5 17h14M7 17l1-5h8l1 5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8" cy="17" r="1.5" strokeWidth="1.5" stroke="currentColor" fill="none" /><circle cx="16" cy="17" r="1.5" strokeWidth="1.5" stroke="currentColor" fill="none" /><path d="M9 12l1-3h4l1 3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" /></>,
    default: <circle cx="12" cy="12" r="8" strokeWidth="1.5" stroke="currentColor" fill="none" />,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5">{icons[sector] ?? icons.default}</svg>;
};

/* ── Sectors ── */
const FALLBACK_SECTORS = [
  { label: "Technology", badgeBg: "bg-blue-100 dark:bg-blue-900/40", badgeText: "text-blue-700 dark:text-blue-300", return1Y: "+22.1%" },
  { label: "Healthcare", badgeBg: "bg-teal-100 dark:bg-teal-900/40", badgeText: "text-teal-700 dark:text-teal-300", return1Y: "+9.8%" },
  { label: "Banking & Finance", badgeBg: "bg-amber-100 dark:bg-amber-900/40", badgeText: "text-amber-700 dark:text-amber-300", return1Y: "+14.2%" },
  { label: "Energy", badgeBg: "bg-red-100 dark:bg-red-900/40", badgeText: "text-red-600 dark:text-red-300", return1Y: "+10.5%" },
  { label: "Consumer Goods", badgeBg: "bg-emerald-100 dark:bg-emerald-900/40", badgeText: "text-emerald-700 dark:text-emerald-300", return1Y: "+7.9%" },
  { label: "Infrastructure", badgeBg: "bg-slate-200 dark:bg-slate-800/50", badgeText: "text-slate-600 dark:text-slate-300", return1Y: "+11.3%" },
  { label: "FMCG", badgeBg: "bg-violet-100 dark:bg-violet-900/40", badgeText: "text-violet-700 dark:text-violet-300", return1Y: "+8.4%" },
  { label: "Auto", badgeBg: "bg-pink-100 dark:bg-pink-900/40", badgeText: "text-pink-600 dark:text-pink-300", return1Y: "+12.4%" },
];

/* ── Sector fund details ── */
const sectorFunds: Record<string, { name: string; category: string; returns1Y: string; returns3Y: string; risk: string }[]> = {
  "Technology": [
    { name: "ICICI Pru Technology Fund", category: "Sectoral", returns1Y: "+28.4%", returns3Y: "+18.2%", risk: "High" },
    { name: "Tata Digital India Fund", category: "Sectoral", returns1Y: "+24.1%", returns3Y: "+16.8%", risk: "High" },
    { name: "SBI Technology Opp. Fund", category: "Sectoral", returns1Y: "+19.6%", returns3Y: "+14.3%", risk: "Moderate" },
  ],
  "Healthcare": [
    { name: "Nippon India Pharma Fund", category: "Sectoral", returns1Y: "+12.8%", returns3Y: "+14.1%", risk: "Moderate" },
    { name: "SBI Healthcare Opp. Fund", category: "Sectoral", returns1Y: "+10.4%", returns3Y: "+11.7%", risk: "Moderate" },
  ],
  "Banking & Finance": [
    { name: "ICICI Pru Banking & Fin.", category: "Sectoral", returns1Y: "+16.2%", returns3Y: "+13.5%", risk: "Moderate" },
    { name: "Kotak Banking ETF", category: "ETF", returns1Y: "+14.8%", returns3Y: "+12.1%", risk: "Moderate" },
  ],
  "Consumer Goods": [
    { name: "Mirae Asset Great Consumer", category: "Thematic", returns1Y: "+9.2%", returns3Y: "+11.4%", risk: "Moderate" },
    { name: "ICICI Pru FMCG Fund", category: "Sectoral", returns1Y: "+7.6%", returns3Y: "+9.8%", risk: "Low" },
  ],
  "Energy": [
    { name: "DSP Natural Resources Fund", category: "Thematic", returns1Y: "+18.1%", returns3Y: "+15.7%", risk: "High" },
    { name: "Tata Resources & Energy", category: "Sectoral", returns1Y: "+14.9%", returns3Y: "+12.3%", risk: "High" },
  ],
  "Infrastructure": [
    { name: "HDFC Infrastructure Fund", category: "Sectoral", returns1Y: "+13.7%", returns3Y: "+11.8%", risk: "High" },
    { name: "Kotak Infra & Eco Reform", category: "Thematic", returns1Y: "+10.9%", returns3Y: "+9.4%", risk: "Moderate" },
  ],
  "FMCG": [
    { name: "ICICI Pru FMCG Fund", category: "Sectoral", returns1Y: "+8.4%", returns3Y: "+10.2%", risk: "Low" },
    { name: "Nippon India Consumption", category: "Thematic", returns1Y: "+7.8%", returns3Y: "+9.1%", risk: "Low" },
  ],
  "Auto": [
    { name: "Mahindra Manulife Auto", category: "Sectoral", returns1Y: "+14.2%", returns3Y: "+12.8%", risk: "Moderate" },
    { name: "UTI Auto Sector Fund", category: "Thematic", returns1Y: "+11.6%", returns3Y: "+10.3%", risk: "Moderate" },
  ],
};

/* ── Trending funds ── */
const FALLBACK_TRENDING = [
  { name: "HDFC Mid-Cap Opportunities", category: "Mid Cap", returns: "+18.2%", returns3Y: "+14.6%", returns5Y: "+12.1%", positive: true, risk: "Moderate", minInvestment: "₹5,000", description: "Invests in high-growth mid-cap companies with strong fundamentals." },
  { name: "SBI Small Cap Fund", category: "Small Cap", returns: "+22.4%", returns3Y: "+18.1%", returns5Y: "+15.3%", positive: true, risk: "High", minInvestment: "₹5,000", description: "Focuses on emerging small-cap stocks with high return potential." },
  { name: "Axis Bluechip Fund", category: "Large Cap", returns: "+14.1%", returns3Y: "+12.4%", returns5Y: "+11.2%", positive: true, risk: "Low", minInvestment: "₹1,000", description: "Stable large-cap fund investing in top blue-chip companies." },
  { name: "Motilal Oswal Nasdaq 100", category: "International", returns: "+28.6%", returns3Y: "+20.3%", returns5Y: "+18.7%", positive: true, risk: "High", minInvestment: "₹500", description: "Tracks the Nasdaq 100 index for US tech exposure." },
  { name: "ICICI Pru Balanced Adv.", category: "Hybrid", returns: "-2.3%", returns3Y: "+8.4%", returns5Y: "+9.1%", positive: false, risk: "Moderate", minInvestment: "₹1,000", description: "Balanced fund dynamically shifting between equity and debt." },
];

/* ── For you funds ── */
const FALLBACK_FOR_YOU = [
  { name: "HDFC Mid-Cap Opportunities", subtitle: "Matches your long-term goal", category: "Mid Cap", returns: "+18.2%", returns3Y: "+14.6%", returns5Y: "+12.1%", positive: true, risk: "Moderate", minInvestment: "₹5,000", description: "Invests in high-growth mid-cap companies with strong fundamentals.", badgeBg: "bg-emerald-100 dark:bg-emerald-900/40", badgeText: "text-emerald-700 dark:text-emerald-300" },
  { name: "Parag Parikh Flexi Cap", subtitle: "Good for your retirement horizon", category: "Flexi Cap", returns: "+22.1%", returns3Y: "+16.8%", returns5Y: "+14.2%", positive: true, risk: "Moderate", minInvestment: "₹1,000", description: "Diversified flexi-cap fund with international equity allocation.", badgeBg: "bg-violet-100 dark:bg-violet-900/40", badgeText: "text-violet-700 dark:text-violet-300" },
];

const riskColor = (r: string) => {
  if (r === "Low") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (r === "High") return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
};

const SECTOR_STYLES = FALLBACK_SECTORS.map((s) => ({ badgeBg: s.badgeBg, badgeText: s.badgeText }));

function fmtRetPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function mapApiTrending(f: DiscoveryFund): (typeof FALLBACK_TRENDING)[number] {
  const r1 = f.return_1y;
  const positive = r1 == null || r1 >= 0;
  return {
    name: f.name,
    category: f.category ?? "—",
    returns: fmtRetPct(r1),
    returns3Y: fmtRetPct(f.return_3y),
    returns5Y: fmtRetPct(f.return_5y),
    positive,
    risk: f.risk_level ?? "Moderate",
    minInvestment: f.min_investment != null ? `₹${f.min_investment.toLocaleString("en-IN")}` : "—",
    description: f.description ?? "",
  };
}

function mapApiSector(s: DiscoverySector, i: number): (typeof FALLBACK_SECTORS)[number] {
  const st = SECTOR_STYLES[i % SECTOR_STYLES.length];
  const staticMatch = FALLBACK_SECTORS.find((x) => x.label.toLowerCase() === s.sector.toLowerCase());
  return {
    label: s.sector,
    badgeBg: st.badgeBg,
    badgeText: st.badgeText,
    return1Y: staticMatch?.return1Y ?? `${s.fund_count} funds`,
  };
}

function mapForYouFromFunds(funds: DiscoveryFund[]): typeof FALLBACK_FOR_YOU {
  const subtitles = ["Matches your long-term goal", "Aligned with your profile"];
  return funds.map((f, i) => ({
    name: f.name,
    subtitle: subtitles[i % subtitles.length],
    category: f.category ?? "—",
    returns: fmtRetPct(f.return_1y),
    returns3Y: fmtRetPct(f.return_3y),
    returns5Y: fmtRetPct(f.return_5y),
    positive: f.return_1y == null || f.return_1y >= 0,
    risk: f.risk_level ?? "Moderate",
    minInvestment: f.min_investment != null ? `₹${f.min_investment.toLocaleString("en-IN")}` : "—",
    description: f.description ?? "",
    badgeBg: SECTOR_STYLES[i % SECTOR_STYLES.length].badgeBg,
    badgeText: SECTOR_STYLES[i % SECTOR_STYLES.length].badgeText,
  }));
}

function mapFundToSectorRows(funds: DiscoveryFund[]): { name: string; category: string; returns1Y: string; returns3Y: string; risk: string }[] {
  return funds.map((f) => ({
    name: f.name,
    category: f.category ?? "—",
    returns1Y: fmtRetPct(f.return_1y),
    returns3Y: fmtRetPct(f.return_3y),
    risk: f.risk_level ?? "Moderate",
  }));
}

interface FundDetail {
  name: string;
  category: string;
  returns: string;
  returns3Y: string;
  returns5Y: string;
  risk: string;
  minInvestment: string;
  description: string;
}

const Discovery = () => {
  const navigate = useNavigate();
  const [viewFund, setViewFund] = useState<FundDetail | null>(null);
  const [viewSector, setViewSector] = useState<string | null>(null);
  const [trendingRows, setTrendingRows] = useState<(typeof FALLBACK_TRENDING)[number][] | null>(null);
  const [sectorRows, setSectorRows] = useState<(typeof FALLBACK_SECTORS)[number][] | null>(null);
  const [forYouFunds, setForYouFunds] = useState<typeof FALLBACK_FOR_YOU>(FALLBACK_FOR_YOU);
  const [sectorFundsFromApi, setSectorFundsFromApi] = useState<
    Record<string, ReturnType<typeof mapFundToSectorRows>>
  >({});
  const sectorFetchStarted = useRef<Set<string>>(new Set());

  useEffect(() => {
    listDiscoveryTrending()
      .then((funds) => {
        if (funds.length) setTrendingRows(funds.map(mapApiTrending));
      })
      .catch(() => {});
    listDiscoverySectors()
      .then((secs) => {
        if (secs.length) setSectorRows(secs.map(mapApiSector));
      })
      .catch(() => {});
    Promise.all([listDiscoveryHouseView(), listDiscoveryFunds({ limit: 4 })])
      .then(([hv, fl]) => {
        const src = hv.length ? hv : fl.funds;
        if (src.length) setForYouFunds(mapForYouFromFunds(src.slice(0, 2)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!viewSector) return;
    if (sectorFetchStarted.current.has(viewSector)) return;
    sectorFetchStarted.current.add(viewSector);
    listDiscoveryFunds({ sector: viewSector, limit: 20 })
      .then((res) => {
        setSectorFundsFromApi((prev) => ({ ...prev, [viewSector]: mapFundToSectorRows(res.funds) }));
      })
      .catch(() => {
        setSectorFundsFromApi((prev) => ({ ...prev, [viewSector]: [] }));
      });
  }, [viewSector]);

  const trending = trendingRows ?? FALLBACK_TRENDING;
  const sectors = sectorRows ?? FALLBACK_SECTORS;

  return (
    <div className="mobile-container bg-background min-h-screen">
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-full bg-secondary hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground mb-0.5">Discover</h1>
          <p className="text-xs text-muted-foreground">Top-rated funds, curated for you</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground/50" />
          <input
            placeholder="Search funds, stocks, ETFs..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
        </div>
      </div>

      {/* Scrollable content — pb accounts for: Start Investing btn (~48px) + gap (12px) + bottom nav (~56px) + safe area + 16px buffer */}
      <div className="pb-[160px]">

        {/* ── House View editorial card ── */}
        <div className="px-5 mb-5">
          <div className="rounded-2xl overflow-hidden border border-border/40">
            {/* Navy header */}
            <div className="bg-[#1B3A6B] px-4 pt-4 pb-5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                House view · March 2026
              </p>
              <h3 className="text-base font-bold text-white leading-snug mb-1.5">
                Stay invested, ignore the noise
              </h3>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Near-term volatility is sentiment-driven. Fundamentals remain strong — we favour large-cap and flexi-cap allocations for 2026.
              </p>
            </div>
            {/* Light bottom */}
            <div className="bg-card px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-foreground">Our top pick: Flexi Cap</p>
                <p className="text-[10px] text-muted-foreground">+19.4% avg. 1Y</p>
              </div>
              <button className="px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                Read more
              </button>
            </div>
          </div>
        </div>

        {/* ── For you · Based on your goals ── */}
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            For you · Based on your goals
          </p>
          <div className="space-y-2">
            {forYouFunds.map((fund) => (
              <motion.button
                key={fund.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setViewFund(fund)}
                className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-3.5 text-left transition-all hover:shadow-sm active:scale-[0.99]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fund.badgeBg} ${fund.badgeText}`}>
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{fund.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fund.subtitle}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-bold text-[hsl(var(--wealth-green))]">{fund.returns}</p>
                  <p className="text-[9px] text-muted-foreground">1Y return</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Explore by Sector — 2-column card grid ── */}
        <div className="mb-5 px-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Explore by Sector</p>
          <div className="grid grid-cols-2 gap-2.5">
            {sectors.map((s, i) => (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setViewSector(s.label)}
                className="flex flex-col items-start rounded-2xl border border-border/60 bg-card p-3.5 text-left transition-all hover:shadow-sm active:scale-[0.98]"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2.5 ${s.badgeBg} ${s.badgeText}`}>
                  <SectorIcon sector={s.label} />
                </div>
                <p className="text-xs font-bold text-foreground leading-tight">{s.label}</p>
                <p className="text-[11px] font-bold text-[hsl(var(--wealth-green))] mt-0.5">{s.return1Y} <span className="font-normal text-muted-foreground text-[10px]">1Y</span></p>
                {/* Sparkline */}
                <svg viewBox="0 0 40 22" className="w-full h-4 mt-2" preserveAspectRatio="none">
                  <polyline
                    points={sparklines[s.label] ?? sparklines.Technology}
                    fill="none"
                    stroke="hsl(var(--wealth-green))"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Trending Now ── */}
        <div className="px-5 mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Trending Now</p>
          <div className="space-y-2">
            {trending.map((item, i) => (
              <motion.button
                key={item.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                onClick={() => setViewFund(item)}
                className="w-full flex items-center justify-between rounded-xl bg-card border border-border p-3 text-left transition-all hover:shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <TrendingUp className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{item.category}</span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${riskColor(item.risk)}`}>
                        {item.risk}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {item.positive ? (
                    <ArrowUpRight className="h-3 w-3 text-[hsl(var(--wealth-green))]" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className={`text-xs font-semibold ${item.positive ? "text-[hsl(var(--wealth-green))]" : "text-destructive"}`}>
                    {item.returns}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Invest CTA */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,8px)+12px)] left-0 right-0 z-30">
        <div className="max-w-md mx-auto px-5">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors"
          >
            Start Investing <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Fund Detail Bottom Sheet */}
      <AnimatePresence>
        {viewFund && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setViewFund(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] rounded-t-2xl bg-card shadow-xl p-5 pb-8 overflow-y-auto"
            >
              <div className="flex justify-center mb-4"><div className="h-1.5 w-10 rounded-full bg-border" /></div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground mb-0.5">{viewFund.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{viewFund.category}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${riskColor(viewFund.risk)}`}>
                      {viewFund.risk} Risk
                    </span>
                  </div>
                </div>
                <button onClick={() => setViewFund(null)} className="p-1.5 rounded-full bg-secondary hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{viewFund.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "1Y Return", value: viewFund.returns },
                  { label: "3Y Return", value: viewFund.returns3Y },
                  { label: "5Y Return", value: viewFund.returns5Y },
                ].map((r) => (
                  <div key={r.label} className="rounded-xl bg-secondary/60 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{r.label}</p>
                    <p className="text-sm font-bold text-[hsl(var(--wealth-green))]">{r.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-5 px-1">
                <span className="text-xs text-muted-foreground">Min. Investment</span>
                <span className="text-sm font-semibold text-foreground">{viewFund.minInvestment}</span>
              </div>

              <button
                onClick={() => setViewFund(null)}
                className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Invest Now <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sector Detail Bottom Sheet */}
      <AnimatePresence>
        {viewSector && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setViewSector(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] rounded-t-2xl bg-card shadow-xl p-5 pb-8 overflow-y-auto"
            >
              <div className="flex justify-center mb-4"><div className="h-1.5 w-10 rounded-full bg-border" /></div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">{viewSector}</h3>
                <button onClick={() => setViewSector(null)} className="p-1.5 rounded-full bg-secondary hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2.5">
                {(sectorFundsFromApi[viewSector] ?? sectorFunds[viewSector] ?? []).map((fund) => (
                  <div key={fund.name} className="rounded-xl bg-secondary/40 border border-border/40 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">{fund.name}</p>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${riskColor(fund.risk)}`}>
                        {fund.risk}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">{fund.category}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[hsl(var(--wealth-green))]">{fund.returns1Y} <span className="text-[9px] font-normal text-muted-foreground">1Y</span></span>
                      <span className="text-xs font-semibold text-[hsl(var(--wealth-green))]">{fund.returns3Y} <span className="text-[9px] font-normal text-muted-foreground">3Y</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Discovery;
