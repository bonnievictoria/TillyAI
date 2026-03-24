import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { PortfolioDetail } from "@/lib/api";

const PALETTE = [
  "hsl(var(--wealth-blue))",
  "hsl(160, 40%, 45%)",
  "hsl(var(--wealth-amber))",
  "hsl(220, 15%, 50%)",
  "hsl(280, 35%, 55%)",
  "hsl(25, 60%, 55%)",
];

interface CurrentAllocationCardProps {
  /** When set, pie + stats come from DB-backed primary portfolio + profile. */
  portfolio: PortfolioDetail | null;
  riskCategory: string | null;
  horizonLabel: string | null;
}

const CurrentAllocationCard = ({ portfolio, riskCategory, horizonLabel }: CurrentAllocationCardProps) => {
  const hasAllocations = portfolio && portfolio.allocations.length > 0;

  const allocations = hasAllocations
    ? portfolio!.allocations.map((a, i) => ({
        name: a.asset_class,
        value: Math.round(a.allocation_percentage * 10) / 10,
        color: PALETTE[i % PALETTE.length],
      }))
    : [
        { name: "Equity", value: 48, color: PALETTE[0] },
        { name: "Fixed Income", value: 28, color: PALETTE[1] },
        { name: "Inflation-Linked", value: 16, color: PALETTE[2] },
        { name: "Cash/Other", value: 8, color: PALETTE[3] },
      ];

  const centerLabel =
    portfolio && portfolio.total_value > 0
      ? portfolio.total_value >= 100000
        ? `₹${(portfolio.total_value / 100000).toFixed(1)}L`
        : `₹${Math.round(portfolio.total_value).toLocaleString("en-IN")}`
      : "₹—";

  const stats = [
    { label: "Holdings", value: portfolio ? String(portfolio.holdings.length) : "—" },
    { label: "Risk Profile", value: riskCategory ?? "—" },
    { label: "Horizon", value: horizonLabel ?? "—" },
  ];

  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
        Current Allocation
        {!hasAllocations && (
          <span className="ml-2 font-normal normal-case text-[10px] text-muted-foreground/70">
            (sample — add allocations in Portfolio)
          </span>
        )}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocations}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {allocations.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{centerLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
          {allocations.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground leading-tight truncate">{item.name}</span>
                <span className="text-xs font-semibold text-foreground leading-tight">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center mt-3 pt-2.5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex-1 text-center ${i < stats.length - 1 ? "border-r border-border/30" : ""}`}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className="text-sm font-bold text-foreground truncate px-0.5">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentAllocationCard;
