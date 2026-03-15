import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Sparkles, ChevronDown } from "lucide-react";

interface WelcomeScreenProps {
  onNext: () => void;
}

const countryCodes = [
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+1", label: "US", flag: "🇺🇸" },
  { code: "+91", label: "IN", flag: "🇮🇳" },
  { code: "+61", label: "AU", flag: "🇦🇺" },
  { code: "+971", label: "AE", flag: "🇦🇪" },
  { code: "+65", label: "SG", flag: "🇸🇬" },
];

const WelcomeScreen = ({ onNext }: WelcomeScreenProps) => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState(countryCodes[2]);
  const [showCodes, setShowCodes] = useState(false);

  const isValid = phone.replace(/\s/g, "").length >= 7;

  const handleSubmit = () => {
    if (isValid) onNext();
  };

  return (
    <div className="mobile-container flex flex-col bg-background px-6 pb-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col"
      >
        <h1 className="font-display text-[2.75rem] leading-[1.05] tracking-tight text-foreground mb-2">
          Wealth, <span className="italic text-wealth-navy-light">Unified.</span>
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed tracking-wide font-medium mb-8 max-w-[260px]">
          Own your future, step into smarter wealth.
        </p>

        <div className="space-y-2.5 mb-auto">
          {[
            { icon: TrendingUp, label: "Track all investments", sub: "Mutual funds, stocks and more" },
            { icon: Sparkles, label: "Your own AI wealth advisor", sub: "Personalized recommendations" },
            { icon: Shield, label: "Bank-grade security", sub: "256-bit encryption" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg wealth-gradient">
                <item.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground tracking-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Phone input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-1 mb-2"
      >
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
          <div className="relative">
            <button
              onClick={() => setShowCodes(!showCodes)}
              className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span>{countryCode.flag}</span>
              <span className="text-xs">{countryCode.code}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showCodes && (
              <div className="absolute top-full left-0 mt-1 z-20 w-40 rounded-xl bg-card border border-border shadow-wealth-lg overflow-hidden">
                {countryCodes.map((cc) => (
                  <button
                    key={cc.code}
                    onClick={() => {
                      setCountryCode(cc);
                      setShowCodes(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <span>{cc.flag}</span>
                    <span className="text-xs text-muted-foreground">{cc.label}</span>
                    <span className="ml-auto text-xs font-medium">{cc.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        onClick={handleSubmit}
        disabled={!isValid}
        className="flex w-full items-center justify-center gap-2 rounded-xl wealth-gradient py-3.5 text-[15px] font-semibold text-primary-foreground tracking-wide transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
};

export default WelcomeScreen;
