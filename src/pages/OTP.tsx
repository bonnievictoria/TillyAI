import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NewOnboardingFlow from "@/components/onboarding/NewOnboardingFlow";
import PortfolioDashboard from "@/components/dashboard/PortfolioDashboard";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Screen = "onboarding" | "dashboard";

const MOCK_ACCOUNTS = [
  { id: "hdfc", bank: "HDFC Bank", type: "Savings Account", ending: "4821" },
  { id: "sbi", bank: "SBI", type: "Savings Account", ending: "7703" },
  { id: "icici", bank: "ICICI Bank", type: "Current Account", ending: "2290" },
];

const OTP = () => {
  const navigate = useNavigate();
  const hasCompletedOnboarding = sessionStorage.getItem("onboardingComplete") === "true";
  const [screen, setScreen] = useState<Screen>(hasCompletedOnboarding ? "dashboard" : "onboarding");
  const [showPopup, setShowPopup] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_ACCOUNTS.map((a) => [a.id, true]))
  );

  const handleOnboardingComplete = () => {
    sessionStorage.setItem("onboardingComplete", "true");
    setScreen("dashboard");
  };

  const toggleAccount = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConsent = () => {
    setShowPopup(false);
    // Navigate to main onboarding
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatePresence mode="wait">
        {screen === "onboarding" && (
          <motion.div key="onboarding" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <NewOnboardingFlow onComplete={handleOnboardingComplete} />
          </motion.div>
        )}
        {screen === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <PortfolioDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Aggregator Popup */}
      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-xl"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <h2 className="text-lg font-semibold text-foreground">We found your accounts</h2>
              <p className="mt-1 text-sm text-muted-foreground">Linked via Account Aggregator</p>

              <div className="mt-5 flex flex-col gap-3">
                {MOCK_ACCOUNTS.map((account) => (
                  <label
                    key={account.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-accent/40"
                    htmlFor={account.id}
                  >
                    <Checkbox
                      id={account.id}
                      checked={selected[account.id]}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{account.bank}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.type} ending in {account.ending}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <Button className="mt-5 w-full" size="lg" onClick={handleConsent}>
                Give Consent &amp; Connect
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OTP;
