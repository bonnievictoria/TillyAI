import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import CompleteProfile from "./pages/CompleteProfile";
import RiskTolerance from "./pages/RiskTolerance";
import InvestmentGoals from "./pages/InvestmentGoals";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import InvestmentPolicyStatement from "./pages/InvestmentPolicyStatement";
import MeetingNotes from "./pages/MeetingNotes";
import MeetingNotesIndex from "./pages/MeetingNotesIndex";
import GoalTracker from "./pages/GoalTracker";
import Rebalancing from "./pages/Rebalancing";
import GoalPlanner from "./pages/GoalPlanner";
import Invest from "./pages/Invest";
import Discovery from "./pages/Discovery";
import OTP from "./pages/OTP";
import LinkAccounts from "./pages/LinkAccounts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Index />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/link-accounts" element={<LinkAccounts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/profile/complete" element={<CompleteProfile />} />
          <Route path="/profile/risk-tolerance" element={<RiskTolerance />} />
          <Route path="/profile/investment-goals" element={<InvestmentGoals />} />
          <Route path="/profile/ips" element={<InvestmentPolicyStatement />} />
          <Route path="/meeting-notes" element={<MeetingNotesIndex />} />
          <Route path="/meeting-notes/detail" element={<MeetingNotes />} />
          <Route path="/profile/goal-tracker" element={<GoalTracker />} />
          <Route path="/rebalancing" element={<Rebalancing />} />
          <Route path="/goal-planner" element={<GoalPlanner />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
