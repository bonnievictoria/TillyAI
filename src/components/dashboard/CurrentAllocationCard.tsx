import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const allocations = [
  { name: "Equity", value: 48, color: "hsl(var(--wealth-blue))" },
  { name: "Fixed Income", value: 28, color: "hsl(160, 40%, 45%)" },
  { name: "Inflation-Linked", value: 16, color: "hsl(var(--wealth-amber))" },
  { name: "Cash/Other", value: 8, color: "hsl(220, 15%, 50%)" },
];

const stats = [
  { label: "Holdings", value: "24" },
  { label: "Risk Profile", value: "Moderate" },
  { label: "Horizon", value: "15 yrs" },
];

const CurrentAllocationCard = () => {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
        Current Allocation
      </p>

      {/* Donut + Legend */}
      <div className="flex items-center gap-4">
        {/* Donut with centre label */}
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
            <span className="text-sm font-bold text-foreground">₹47.8L</span>
          </div>
        </div>

        {/* 2x2 legend grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
          {allocations.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground leading-tight">{item.name}</span>
                <span className="text-xs font-semibold text-foreground leading-tight">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center mt-3 pt-2.5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex-1 text-center ${
              i < stats.length - 1 ? "border-r border-border/30" : ""
            }`}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentAllocationCard;
