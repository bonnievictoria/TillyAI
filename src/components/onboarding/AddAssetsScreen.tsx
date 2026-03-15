import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Home, Banknote, Briefcase, PlusCircle, Check, Download } from "lucide-react";
import { useState } from "react";

interface AddAssetsScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const assets = [
  { icon: Home, title: "Real Estate", description: "Add properties with current market value" },
  { icon: Banknote, title: "Fixed Deposits", description: "Track your FDs and maturity dates" },
  { icon: Briefcase, title: "Private Investments", description: "Unlisted shares, PE, angel investments" },
  { icon: PlusCircle, title: "Other Assets", description: "Gold, crypto, insurance, or any manual entry" },
];

const AddAssetsScreen = ({ onComplete, onBack }: AddAssetsScreenProps) => {
  const [added, setAdded] = useState<Set<number>>(new Set());

  const toggleAdd = (idx: number) => {
    setAdded((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  return (
    <div className="mobile-container flex flex-col bg-background px-6 pb-6 pt-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Step 2 of 2</p>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <Download className="h-3 w-3" /> Download Template
          </button>
        </div>

        <h2 className="font-display text-2xl text-foreground mb-1">Add more assets</h2>
        <p className="text-sm text-muted-foreground mb-5">Get a complete picture of your net worth.</p>

        <div className="space-y-2.5">
          {assets.map((asset, i) => {
            const isAdded = added.has(i);
            return (
              <motion.div
                key={asset.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                className="wealth-card !p-3.5 flex items-center gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <asset.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{asset.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{asset.description}</p>
                </div>
                <button
                  onClick={() => toggleAdd(i)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isAdded ? "bg-wealth-green-light text-wealth-green" : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {isAdded ? <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Uploaded</span> : "Upload"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => { sessionStorage.setItem("completedLinkAccounts", "true"); onComplete(); }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl wealth-gradient py-3.5 text-sm font-semibold text-primary-foreground shadow-wealth-lg transition-transform active:scale-[0.98]"
      >
        View My Portfolio
        <ArrowRight className="h-4 w-4" />
      </motion.button>

      <button onClick={() => { sessionStorage.setItem("completedLinkAccounts", "true"); onComplete(); }} className="mt-2 text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
        Skip for now
      </button>
    </div>
  );
};

export default AddAssetsScreen;
