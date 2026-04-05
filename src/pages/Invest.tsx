import { useNavigate } from "react-router-dom";
import { DiscoverScreen } from "@/components/discover/DiscoverScreen";

const Invest = () => {
  const navigate = useNavigate();
  const goExecute = () => navigate("/execute");
  return (
    <DiscoverScreen
      title="Invest"
      subtitle="Top-rated funds, curated for you"
      onBack={() => navigate(-1)}
      showRecommendedPlanCard
      onRecommendedPlanClick={goExecute}
      onStartInvesting={goExecute}
      onInvestNow={goExecute}
      primaryCtaLabel="Start Investing"
    />
  );
};

export default Invest;
