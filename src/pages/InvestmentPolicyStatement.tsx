import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const sections = [
  {
    title: "Who are you?",
    fields: [
      { label: "Occupation", key: "occupation" },
      { label: "Family situation", key: "family" },
      { label: "Wealth source", key: "wealthSource" },
      { label: "Values / exclusions", key: "values" },
    ],
  },
  {
    title: "What are you trying to achieve?",
    fields: [
      { label: "Primary objective", key: "objective" },
      { label: "Financial goals", key: "goals" },
      { label: "Target annual return", key: "targetReturn" },
      { label: "Income needed from portfolio", key: "incomeNeeded" },
    ],
  },
  {
    title: "How much risk can you handle?",
    fields: [
      { label: "Risk tolerance", key: "riskLevel" },
      { label: "Emotional comfort with volatility", key: "volatility" },
      { label: "Financial capacity to absorb losses", key: "lossCapacity" },
      { label: "What's driving your risk view", key: "riskReason" },
    ],
  },
  {
    title: "Your financial picture",
    fields: [
      { label: "Investable assets", key: "investableAssets" },
      { label: "Total liabilities / debts", key: "liabilities" },
      { label: "Property owned", key: "propertyValue" },
      { label: "Outstanding mortgage", key: "mortgage" },
      { label: "Expected inflows", key: "expectedInflows" },
      { label: "Regular outgoings", key: "outgoings" },
      { label: "Planned large expenses", key: "plannedExpenses" },
      { label: "Emergency fund", key: "emergencyFund" },
    ],
  },
  {
    title: "Rules & limits",
    fields: [
      { label: "Permitted asset types", key: "permittedAssets" },
      { label: "Prohibited investments", key: "prohibited" },
      { label: "Leverage", key: "leverage" },
      { label: "Derivatives", key: "derivatives" },
      { label: "Diversification notes", key: "diversificationNotes" },
    ],
  },
  {
    title: "Time horizon",
    fields: [
      { label: "Investment phases", key: "phases" },
      { label: "Total horizon", key: "totalHorizon" },
    ],
  },
  {
    title: "Tax situation",
    fields: [
      { label: "Income tax rate", key: "incomeTaxRate" },
      { label: "Capital gains tax rate", key: "cgtRate" },
      { label: "Additional notes", key: "taxNotes" },
    ],
  },
  {
    title: "Staying involved",
    fields: [
      { label: "Review frequency", key: "reviewFreq" },
      { label: "Review triggers", key: "reviewTriggers" },
      { label: "Update process preference", key: "updateProcess" },
    ],
  },
];

const defaultData: Record<string, string> = {
  occupation: "—",
  family: "—",
  wealthSource: "—",
  values: "ESG preferred, no defence stocks",
  objective: "Grow wealth",
  goals: "—",
  targetReturn: "7%",
  incomeNeeded: "—",
  riskLevel: "Above average",
  volatility: "Neutral",
  lossCapacity: "Up to 20%",
  riskReason: "Long horizon, no short-term needs",
  investableAssets: "—",
  liabilities: "—",
  propertyValue: "—",
  mortgage: "—",
  expectedInflows: "—",
  outgoings: "—",
  plannedExpenses: "—",
  emergencyFund: "—",
  permittedAssets: "Equities, Bonds, Cash",
  prohibited: "No tobacco, controversial weapons, or high-leverage derivatives.",
  leverage: "No",
  derivatives: "No",
  diversificationNotes: "—",
  phases: "One continuous period",
  totalHorizon: "10–15 years",
  incomeTaxRate: "—",
  cgtRate: "—",
  taxNotes: "—",
  reviewFreq: "Quarterly",
  reviewTriggers: "Market drop >20%",
  updateProcess: "—",
};

const InvestmentPolicyStatement = () => {
  const navigate = useNavigate();
  const [data] = useState(defaultData);

  return (
    <div className="mobile-container bg-background pb-20 min-h-screen">
      <div className="px-5 pt-10 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-foreground">
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Investment Policy Statement</h1>
        </div>
      </div>

      <div className="px-5 space-y-3">
        {sections.map((section, sIdx) => (
          <motion.div
            key={sIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.04 }}
            className="wealth-card !p-4 space-y-3"
          >
            <h2 className="text-xs font-semibold text-foreground">{section.title}</h2>
            {section.fields.map((field) => (
              <div key={field.key}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{field.label}</p>
                <p className="text-sm text-foreground leading-relaxed">{data[field.key] || "—"}</p>
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default InvestmentPolicyStatement;
