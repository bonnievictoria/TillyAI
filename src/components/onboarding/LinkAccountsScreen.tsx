import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, X, Building2, BarChart3, Landmark, CreditCard, Wallet, Globe } from "lucide-react";
import { useState } from "react";

interface LinkAccountsScreenProps {
  onNext: () => void;
}

interface LinkedAccount {
  id: string;
  institution: string;
  type: string;
  maskedNumber: string;
  icon: React.ElementType;
}

const ACCOUNT_OPTIONS = [
  { icon: Landmark, title: "Bank Account", description: "Savings, current, or fixed deposit accounts" },
  { icon: BarChart3, title: "Mutual Funds", description: "Import via CAMS or KFintech" },
  { icon: Building2, title: "Stocks / Demat", description: "Connect your Demat for live tracking" },
  { icon: CreditCard, title: "Credit Card", description: "Track spending and liabilities" },
  { icon: Wallet, title: "Crypto Wallet", description: "Bitcoin, Ethereum, and altcoins" },
  { icon: Globe, title: "International Broker", description: "Overseas brokerage accounts" },
];

const DUMMY_INSTITUTIONS: Record<string, { names: string[]; types: string[] }> = {
  "Bank Account": { names: ["HDFC Bank", "ICICI Bank", "SBI", "Kotak Mahindra"], types: ["Savings", "Current", "Fixed Deposit"] },
  "Mutual Funds": { names: ["CAMS", "KFintech", "Groww", "Zerodha Coin"], types: ["Equity MF", "Debt MF", "Hybrid MF"] },
  "Stocks / Demat": { names: ["Zerodha", "Angel One", "Upstox", "ICICI Direct"], types: ["Demat", "Brokerage"] },
  "Credit Card": { names: ["HDFC CC", "ICICI CC", "Amex", "SBI Card"], types: ["Credit Card"] },
  "Crypto Wallet": { names: ["CoinDCX", "WazirX", "Binance", "Coinbase"], types: ["Crypto Wallet"] },
  "International Broker": { names: ["Interactive Brokers", "Vested", "INDmoney", "Winvesta"], types: ["US Stocks", "Global ETFs"] },
};

const generateMasked = () => `••••${Math.floor(1000 + Math.random() * 9000)}`;

const LinkAccountsScreen = ({ onNext }: LinkAccountsScreenProps) => {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [showOptions, setShowOptions] = useState(true);

  const handleLink = (option: typeof ACCOUNT_OPTIONS[number]) => {
    const pool = DUMMY_INSTITUTIONS[option.title];
    const name = pool.names[Math.floor(Math.random() * pool.names.length)];
    const type = pool.types[Math.floor(Math.random() * pool.types.length)];
    const newAccount: LinkedAccount = {
      id: `${Date.now()}-${Math.random()}`,
      institution: name,
      type,
      maskedNumber: generateMasked(),
      icon: option.icon,
    };
    setLinkedAccounts((prev) => [...prev, newAccount]);
    setShowOptions(false);
  };

  const removeAccount = (id: string) => {
    setLinkedAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const hasAccounts = linkedAccounts.length > 0;

  return (
    <div className="mobile-container flex flex-col bg-background px-6 pb-6 pt-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Step 1 of 2</p>
        <h2 className="font-display text-2xl text-foreground mb-1">Link your accounts</h2>
        <p className="text-sm text-muted-foreground mb-5">Connect your financial accounts to see everything in one place.</p>

        {/* Connected accounts */}
        <AnimatePresence>
          {linkedAccounts.map((acc) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-2.5"
            >
              <div className="wealth-card !p-3.5 flex items-center gap-3 border border-[hsl(160_30%_85%)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(160_30%_93%)] text-[hsl(160_50%_38%)]">
                  <acc.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{acc.institution}</p>
                  <p className="text-xs text-muted-foreground">{acc.type} · {acc.maskedNumber}</p>
                </div>
                <button
                  onClick={() => removeAccount(acc.id)}
                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add account options or button */}
        <AnimatePresence mode="wait">
          {showOptions ? (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {ACCOUNT_OPTIONS.map((acc, i) => (
                <motion.div
                  key={acc.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                  className="wealth-card !p-3.5 flex items-center gap-3 cursor-pointer hover:border-accent/30 transition-all"
                  onClick={() => handleLink(acc)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <acc.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{acc.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{acc.description}</p>
                  </div>
                  <span className="shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    Link
                  </span>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.button
              key="add-more"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptions(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Another Account
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => { sessionStorage.setItem("completedLinkAccounts", "true"); onNext(); }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl wealth-gradient py-3.5 text-sm font-semibold text-primary-foreground shadow-wealth-lg transition-transform active:scale-[0.98]"
      >
        {hasAccounts ? "Continue" : "Skip for now"}
        <ArrowRight className="h-4 w-4" />
      </motion.button>

      {hasAccounts && (
        <button onClick={() => { sessionStorage.setItem("completedLinkAccounts", "true"); onNext(); }} className="mt-2 text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          Skip for now
        </button>
      )}
    </div>
  );
};

export default LinkAccountsScreen;
