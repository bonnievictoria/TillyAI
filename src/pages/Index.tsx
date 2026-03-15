import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NewOnboardingFlow from "@/components/onboarding/NewOnboardingFlow";
import PortfolioDashboard from "@/components/dashboard/PortfolioDashboard";

type Screen = "onboarding" | "dashboard";

const Index = () => {
  const hasCompletedOnboarding = sessionStorage.getItem("onboardingComplete") === "true";
  const [screen, setScreen] = useState<Screen>(hasCompletedOnboarding ? "dashboard" : "onboarding");

  const handleOnboardingComplete = () => {
    sessionStorage.setItem("onboardingComplete", "true");
    setScreen("dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
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
    </div>
  );
};

export default Index;
