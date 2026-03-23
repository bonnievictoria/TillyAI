import { useState, useEffect } from "react";
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
  type CumulativePortfolioResponse,
  type PortfolioDetail,
} from "@/lib/api";

const fmtInr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const PortfolioDashboard = () => {
  const navigate = useNavigate();
  const { activeView } = useFamily();
  const [timePeriod, setTimePeriod] = useState<"1M" | "6M" | "1Y" | "All">("All");

  const [cumulativeData, setCumulativeData] = useState<CumulativePortfolioResponse | null>(null);
  const [memberPortfolio, setMemberPortfolio] = useState<PortfolioDetail | null>(null);
  const [familyLoading, setFamilyLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (activeView.type === "cumulative") {
      setFamilyLoading(true);
      getCumulativePortfolio()
        .then((d) => { if (!cancelled) setCumulativeData(d); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setFamilyLoading(false); });
    } else if (activeView.type === "member") {
      setFamilyLoading(true);
      getFamilyMemberPortfolio(activeView.member.id)
        .then((d) => { if (!cancelled) setMemberPortfolio(d); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setFamilyLoading(false); });
    }
    return () => { cancelled = true; };
  }, [activeView]);

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

      {/* ─── Cumulative Family View ─── */}
      {activeView.type === "cumulative" && cumulativeData && !familyLoading && (
        <>
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2.5">
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {fmtInr(cumulativeData.total_value)}
              </p>
              {cumulativeData.total_gain_percentage != null && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    cumulativeData.total_gain_percentage >= 0
                      ? "bg-wealth-green/15 text-wealth-green"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {cumulativeData.total_gain_percentage >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {cumulativeData.total_gain_percentage >= 0 ? "+" : ""}
                  {cumulativeData.total_gain_percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Member breakdown */}
          <div className="px-5 pb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Member Breakdown
            </p>
            <div className="space-y-1">
              {cumulativeData.members.map((m) => (
                <div
                  key={m.member_id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent">
                      {m.nickname[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">{m.nickname}</p>
                      <p className="text-[9px] text-muted-foreground capitalize">{m.relationship_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-foreground">{fmtInr(m.portfolio_value)}</p>
                    {m.gain_percentage != null && (
                      <p className={`text-[9px] font-medium ${m.gain_percentage >= 0 ? "text-wealth-green" : "text-destructive"}`}>
                        {m.gain_percentage >= 0 ? "+" : ""}{m.gain_percentage}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combined allocations */}
          {cumulativeData.combined_allocations.length > 0 && (
            <div className="px-5 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Combined Allocation
              </p>
              {cumulativeData.combined_allocations.map((a, i, arr) => (
                <div key={a.asset_class}>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">{a.asset_class}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">{fmtInr(a.total_amount)}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{a.allocation_percentage}%</span>
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-border/20" />}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Member Portfolio View ─── */}
      {activeView.type === "member" && memberPortfolio && !familyLoading && (
        <>
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2.5">
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {fmtInr(memberPortfolio.total_value)}
              </p>
              {memberPortfolio.total_gain_percentage != null && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    memberPortfolio.total_gain_percentage >= 0
                      ? "bg-wealth-green/15 text-wealth-green"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {memberPortfolio.total_gain_percentage >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {memberPortfolio.total_gain_percentage >= 0 ? "+" : ""}
                  {memberPortfolio.total_gain_percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Holdings */}
          {memberPortfolio.holdings.length > 0 && (
            <div className="px-5 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Holdings
              </p>
              {memberPortfolio.holdings.map((h, i, arr) => (
                <div key={h.id}>
                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-xs font-medium text-foreground">{h.instrument_name}</p>
                      <p className="text-[9px] text-muted-foreground">{h.instrument_type}{h.ticker_symbol ? ` · ${h.ticker_symbol}` : ""}</p>
                    </div>
                    <p className="text-xs font-semibold text-foreground">{fmtInr(h.current_value)}</p>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-border/20" />}
                </div>
              ))}
            </div>
          )}

          {/* Allocations */}
          {memberPortfolio.allocations.length > 0 && (
            <div className="px-5 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Allocation
              </p>
              {memberPortfolio.allocations.map((a, i, arr) => (
                <div key={a.id}>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">{a.asset_class}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">{fmtInr(a.amount)}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{a.allocation_percentage}%</span>
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-border/20" />}
                </div>
              ))}
            </div>
          )}

          {memberPortfolio.total_value === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-muted-foreground">No portfolio data available for this member yet.</p>
            </div>
          )}
        </>
      )}

      {/* ─── Default Self View (original) ─── */}
      {activeView.type === "self" && (
        <>
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2.5">
              <p className="text-2xl font-bold text-foreground tracking-tight">₹47,82,350</p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-wealth-green/15 px-2 py-0.5 text-[10px] font-semibold text-wealth-green">
                <TrendingUp className="h-2.5 w-2.5" /> +12.4%
              </span>
            </div>
          </div>

          <div className="px-5 pb-2">
            <div className="flex gap-1.5">
              {(["1M", "6M", "1Y", "All"] as const).map((period) => (
                <button
                  key={period}
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
            <NetWorthSparkline />
          </div>

          <div className="px-5 pb-2">
            <CurrentAllocationCard />
          </div>

          <div className="px-5 pb-2">
            {[
              { label: "Equity", value: "₹29.6L", change: "+18.2%", positive: true },
              { label: "Debt", value: "₹11.5L", change: "+6.8%", positive: true },
              { label: "Real Estate", value: "₹5.2L", change: "+3.1%", positive: true },
              { label: "Cash & Others", value: "₹1.5L", change: "-0.2%", positive: false },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-foreground">{item.value}</span>
                    <span className={`text-[10px] font-medium ${item.positive ? "text-wealth-green" : "text-destructive"}`}>{item.change}</span>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-border/20" />}
              </div>
            ))}
          </div>

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
