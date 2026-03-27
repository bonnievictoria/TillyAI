import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import NetWorthSparkline from "./NetWorthSparkline";
import CurrentAllocationCard from "./CurrentAllocationCard";
import DailyInsights from "./DailyInsights";
import ProfileSwitcher from "./ProfileSwitcher";
import { useFamily } from "@/context/FamilyContext";
import {
  getCumulativePortfolio,
  getFamilyMemberPortfolio,
  getFullProfile,
  getMyPortfolio,
  getPortfolioHistory,
  type CumulativePortfolioResponse,
  type FullProfileResponse,
  type PortfolioDetail,
} from "@/lib/api";
import {
  buildDemoSparkline,
  cloneDemoCumulativePortfolio,
  cloneDemoFullProfile,
  cloneDemoMemberPortfolio,
  cloneDemoSelfPortfolio,
} from "@/lib/portfolioDemoData";
import { formatInrCompact, formatInrPaisa } from "@/lib/utils";

/** Map cumulative API payload into a PortfolioDetail so we can reuse PortfolioMainPanel / CurrentAllocationCard. */
function cumulativeToPortfolioDetail(c: CumulativePortfolioResponse): PortfolioDetail {
  return {
    id: "cumulative-family",
    name: "Family combined",
    total_value: c.total_value,
    total_invested: c.total_invested,
    total_gain_percentage: c.total_gain_percentage,
    is_primary: true,
    created_at: "",
    updated_at: "",
    allocations: c.combined_allocations.map((a, i) => ({
      id: `cumulative-alloc-${i}`,
      asset_class: a.asset_class,
      allocation_percentage: a.allocation_percentage,
      amount: a.total_amount,
      performance_percentage: null,
    })),
    holdings: [],
  };
}

/** Same main layout as homepage (self) — net worth, sparkline, allocation card, breakdown, optional holdings card. */
function PortfolioMainPanel({
  portfolio,
  timePeriod,
  setTimePeriod,
  sparkline,
  riskCategory,
  horizonLabel,
  showHoldingsCard,
  middleSlot,
}: {
  portfolio: PortfolioDetail;
  timePeriod: "1M" | "6M" | "1Y" | "All";
  setTimePeriod: (p: "1M" | "6M" | "1Y" | "All") => void;
  sparkline?: number[];
  riskCategory: string | null;
  horizonLabel: string | null;
  showHoldingsCard?: boolean;
  /** Renders between allocation card and optional holdings (e.g. cumulative member breakdown). */
  middleSlot?: ReactNode;
}) {
  return (
    <>
      <div className="px-5 pb-2">
        <div className="flex items-center gap-2.5">
          <p className="text-2xl font-bold text-foreground tracking-tight">{formatInrPaisa(portfolio.total_value)}</p>
          {portfolio.total_gain_percentage != null && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                portfolio.total_gain_percentage >= 0
                  ? "bg-wealth-green/15 text-wealth-green"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {portfolio.total_gain_percentage >= 0 ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              {portfolio.total_gain_percentage >= 0 ? "+" : ""}
              {portfolio.total_gain_percentage}%
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-1">Invested {formatInrPaisa(portfolio.total_invested)}</p>
      </div>

      <div className="px-5 pb-2">
        <div className="flex gap-1.5">
          {(["1M", "6M", "1Y", "All"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimePeriod(period)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                timePeriod === period
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/60 text-muted-foreground/50 hover:text-muted-foreground/70"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-2">
        <NetWorthSparkline values={sparkline} />
      </div>

      <div className="px-5 pb-2">
        <CurrentAllocationCard
          portfolio={portfolio}
          riskCategory={riskCategory}
          horizonLabel={horizonLabel}
        />
      </div>

      {middleSlot}

      {showHoldingsCard && portfolio.holdings.length > 0 && (
        <div className="px-5 pb-2">
          <div className="rounded-2xl bg-card p-4 border border-border/40">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">Holdings</p>
            <div className="space-y-0">
              {portfolio.holdings.map((h, i, arr) => (
                <div key={h.id}>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{h.instrument_name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {h.instrument_type}
                        {h.ticker_symbol ? ` · ${h.ticker_symbol}` : ""}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-foreground">{formatInrPaisa(h.current_value)}</p>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-border/20" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pb-2">
        {portfolio.allocations.length > 0 ? (
          portfolio.allocations.map((item, i, arr) => {
            const perf = item.performance_percentage;
            const positive = perf == null ? true : perf >= 0;
            return (
              <div key={item.id}>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">{item.asset_class}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-foreground">{formatInrCompact(item.amount)}</span>
                    {perf != null && (
                      <span
                        className={`text-[10px] font-medium ${
                          positive ? "text-wealth-green" : "text-destructive"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {perf.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-border/20" />}
              </div>
            );
          })
        ) : (
          <p className="text-[11px] text-muted-foreground py-2">
            No allocation rows saved yet. Update allocations in Portfolio to see a breakdown.
          </p>
        )}
      </div>
    </>
  );
}

function CumulativeMemberBreakdownCard({ data }: { data: CumulativePortfolioResponse }) {
  if (!data.members.length) return null;
  return (
    <div className="px-5 pb-2">
      <div className="rounded-2xl bg-card p-4 border border-border/40">
        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
          Member breakdown
        </p>
        <div className="space-y-0">
          {data.members.map((m, i, arr) => (
            <div key={m.member_id}>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent">
                    {(m.nickname[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{m.nickname}</p>
                    <p className="text-[9px] text-muted-foreground capitalize">{m.relationship_type}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-semibold text-foreground">{formatInrPaisa(m.portfolio_value)}</p>
                  {m.gain_percentage != null && (
                    <p
                      className={`text-[9px] font-medium ${
                        m.gain_percentage >= 0 ? "text-wealth-green" : "text-destructive"
                      }`}
                    >
                      {m.gain_percentage >= 0 ? "+" : ""}
                      {m.gain_percentage}%
                    </p>
                  )}
                </div>
              </div>
              {i < arr.length - 1 && <div className="h-px bg-border/20" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PortfolioDashboard = () => {
  const navigate = useNavigate();
  const { activeView } = useFamily();
  const [timePeriod, setTimePeriod] = useState<"1M" | "6M" | "1Y" | "All">("All");

  const [cumulativeData, setCumulativeData] = useState<CumulativePortfolioResponse | null>(null);
  const [memberPortfolio, setMemberPortfolio] = useState<PortfolioDetail | null>(null);
  const [familyLoading, setFamilyLoading] = useState(false);

  const [selfPortfolio, setSelfPortfolio] = useState<PortfolioDetail | null>(null);
  const [selfProfile, setSelfProfile] = useState<FullProfileResponse | null>(null);
  const [selfSparkline, setSelfSparkline] = useState<number[] | undefined>(undefined);
  /** Start true so we never flash the error state before the first fetch (or demo fallback). */
  const [selfLoading, setSelfLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (activeView.type === "cumulative") {
      setFamilyLoading(true);
      getCumulativePortfolio()
        .then((d) => { if (!cancelled) setCumulativeData(d); })
        .catch(() => {
          if (!cancelled) setCumulativeData(cloneDemoCumulativePortfolio());
        })
        .finally(() => { if (!cancelled) setFamilyLoading(false); });
    } else if (activeView.type === "member") {
      setFamilyLoading(true);
      const nick = activeView.member.nickname;
      getFamilyMemberPortfolio(activeView.member.id)
        .then((d) => { if (!cancelled) setMemberPortfolio(d); })
        .catch(() => {
          if (!cancelled) setMemberPortfolio(cloneDemoMemberPortfolio(nick));
        })
        .finally(() => { if (!cancelled) setFamilyLoading(false); });
    }
    return () => { cancelled = true; };
  }, [activeView]);

  useEffect(() => {
    if (activeView.type !== "self") return;
    let cancelled = false;
    setSelfLoading(true);
    Promise.all([
      getMyPortfolio().catch(() => null),
      getFullProfile().catch(() => null),
      getPortfolioHistory(60).catch(() => []),
    ])
      .then(([port, prof, hist]) => {
        if (cancelled) return;
        const useDemoPortfolio = port === null;
        setSelfPortfolio(useDemoPortfolio ? cloneDemoSelfPortfolio() : port);
        setSelfProfile(useDemoPortfolio ? (prof ?? cloneDemoFullProfile()) : prof);
        const sorted = [...hist].sort(
          (a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
        );
        if (sorted.length > 1) {
          const scale = sorted.map((h) => h.total_value / 100000);
          setSelfSparkline(scale);
        } else if (sorted.length === 1) {
          setSelfSparkline([sorted[0].total_value / 100000]);
        } else {
          setSelfSparkline(useDemoPortfolio ? buildDemoSparkline() : undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelfPortfolio(cloneDemoSelfPortfolio());
          setSelfProfile(cloneDemoFullProfile());
          setSelfSparkline(buildDemoSparkline());
        }
      })
      .finally(() => {
        if (!cancelled) setSelfLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeView.type]);

  const viewLabel =
    activeView.type === "self"
      ? "Total Portfolio"
      : activeView.type === "cumulative"
      ? "Family Portfolio"
      : `${activeView.member.nickname}'s Portfolio`;

  return (
    <div className="mobile-container bg-background flex flex-col min-h-screen">
      {/* Top bar with profile switcher */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div>
          <p className="text-xs text-muted-foreground">{viewLabel}</p>
          {activeView.type === "cumulative" && cumulativeData && (
            <p className="text-[9px] text-muted-foreground/60">
              {cumulativeData.member_count} members combined
            </p>
          )}
        </div>
        <ProfileSwitcher />
      </div>

      {/* Loading state for family views */}
      {familyLoading && activeView.type !== "self" && (
        <div className="px-5 py-8 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      )}

      {/* ─── Combined family — same layout as homepage: sparkline, allocation card, member breakdown, insights ─── */}
      {activeView.type === "cumulative" && (
        <>
          {!familyLoading && cumulativeData && cumulativeData.total_value > 0 && (
            <>
              <PortfolioMainPanel
                portfolio={cumulativeToPortfolioDetail(cumulativeData)}
                timePeriod={timePeriod}
                setTimePeriod={setTimePeriod}
                sparkline={[cumulativeData.total_value / 100000]}
                riskCategory={null}
                horizonLabel="Combined family"
                showHoldingsCard={false}
                middleSlot={<CumulativeMemberBreakdownCard data={cumulativeData} />}
              />
              <div className="px-5 pb-24">
                <DailyInsights />
              </div>
            </>
          )}
          {!familyLoading && cumulativeData && cumulativeData.total_value === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground">No combined portfolio data yet.</p>
            </div>
          )}
          {!familyLoading && !cumulativeData && (
            <div className="px-5 py-6 text-center text-xs text-muted-foreground">
              Could not load family portfolio. Check your connection and try again.
            </div>
          )}
        </>
      )}

      {/* ─── Member portfolio — same layout as homepage (self): sparkline, allocation card, insights ─── */}
      {activeView.type === "member" && (
        <>
          {!familyLoading && memberPortfolio && memberPortfolio.total_value > 0 && (
            <>
              <PortfolioMainPanel
                portfolio={memberPortfolio}
                timePeriod={timePeriod}
                setTimePeriod={setTimePeriod}
                sparkline={[memberPortfolio.total_value / 100000]}
                riskCategory={null}
                horizonLabel={null}
                showHoldingsCard
              />
              <div className="px-5 pb-24">
                <DailyInsights />
              </div>
            </>
          )}
          {!familyLoading && memberPortfolio && memberPortfolio.total_value === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground">No portfolio data available for this member yet.</p>
            </div>
          )}
          {!familyLoading && !memberPortfolio && (
            <div className="px-5 py-6 text-center text-xs text-muted-foreground">
              Could not load this member&apos;s portfolio. Check your connection and try again.
            </div>
          )}
        </>
      )}

      {/* ─── Default Self View — DB-backed when available ─── */}
      {activeView.type === "self" && (
        <>
          {selfLoading && (
            <div className="px-5 py-8 flex justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
          )}

          {!selfLoading && selfPortfolio && (
            <>
              <PortfolioMainPanel
                portfolio={selfPortfolio}
                timePeriod={timePeriod}
                setTimePeriod={setTimePeriod}
                sparkline={selfSparkline}
                riskCategory={selfProfile?.risk_profile?.risk_category ?? null}
                horizonLabel={
                  selfProfile?.investment_profile?.total_horizon ??
                  selfProfile?.risk_profile?.investment_horizon ??
                  null
                }
                showHoldingsCard={false}
              />
            </>
          )}

          {!selfLoading && !selfPortfolio && (
            <div className="px-5 py-6 text-center text-xs text-muted-foreground">
              Could not load your portfolio from the server. Check your connection and try again.
            </div>
          )}

          <div className="px-5 pb-24">
            <DailyInsights />
          </div>
        </>
      )}

      {/* Discovery FAB */}
      <motion.button
        onClick={() => navigate("/discovery")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-20 right-5 z-40 flex h-12 items-center gap-2 rounded-full px-4 wealth-gradient"
        style={{
          boxShadow:
            "0 4px 24px -4px hsl(var(--wealth-navy) / 0.5), 0 0 16px 2px hsl(var(--wealth-blue) / 0.25)",
        }}
      >
        <Compass className="h-4 w-4 text-primary-foreground" />
        <span className="text-xs font-semibold text-primary-foreground">Discovery</span>
      </motion.button>

      <BottomNav />
    </div>
  );
};

export default PortfolioDashboard;
