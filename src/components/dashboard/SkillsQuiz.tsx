import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronRight, X, Trophy, Rocket, RotateCcw } from "lucide-react";

/* ── Data ── */
interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const LEVEL_1: Question[] = [
  {
    question: "What is an ETF?",
    options: [
      "A savings account with fixed interest",
      "A basket of assets you can buy/sell on a stock exchange like a single share",
      "A government-issued bond",
      "A type of real estate investment",
    ],
    correctIndex: 1,
    explanation:
      "An ETF (Exchange-Traded Fund) bundles many assets — like stocks or bonds — into one product. You buy and sell it on a stock exchange just like a single share, making it simple and accessible.",
  },
  {
    question: "If you invest in an S&P 500 ETF, you are...",
    options: [
      "Betting on one company to outperform the market",
      "Lending money to 500 companies",
      "Owning a tiny slice of 500 of America's largest companies",
      "Buying a fixed-return product",
    ],
    correctIndex: 2,
    explanation:
      "The S&P 500 tracks the 500 biggest US companies. An ETF following it means you automatically own a small piece of all of them — instant diversification in one click.",
  },
  {
    question: "What is a key advantage of ETFs over picking individual stocks?",
    options: [
      "They always go up in value",
      "They are guaranteed by the government",
      "They spread your risk across many assets",
      "They have no fees whatsoever",
    ],
    correctIndex: 2,
    explanation:
      "If one company in an ETF performs badly, the others can cushion the blow. Picking individual stocks means one bad call can hurt your whole portfolio.",
  },
  {
    question: 'ETF fees are typically described as an...',
    options: [
      "Annual Premium Ratio",
      "Expense Ratio",
      "Management Surcharge",
      "Trading Commission",
    ],
    correctIndex: 1,
    explanation:
      "The Expense Ratio is the annual fee deducted from the ETF's value — typically very low (0.03%–0.75%). It's one reason ETFs are popular: they're cheap to hold compared to actively managed funds.",
  },
];

const LEVEL_2: Question[] = [
  {
    question: "What is the key structural difference between an ETF and a traditional mutual fund?",
    options: [
      "ETFs are only available to institutional investors",
      "ETFs are traded on an exchange throughout the day, mutual funds price once daily",
      "Mutual funds hold more assets than ETFs",
      "ETFs are always actively managed",
    ],
    correctIndex: 1,
    explanation:
      "Mutual funds calculate their price once at end of day. ETFs trade live on an exchange like stocks — giving you more flexibility and transparency over the price you pay.",
  },
  {
    question: 'A "thematic ETF" (e.g. clean energy, AI) carries more risk than a broad market ETF because...',
    options: [
      "They charge higher taxes",
      "They are concentrated in one sector, so less diversified",
      "They are not regulated",
      "They can only be held for 12 months",
    ],
    correctIndex: 1,
    explanation:
      "Broad ETFs spread risk across hundreds of industries. Thematic ETFs concentrate on one trend — if that sector falls out of favour, there's nowhere to hide.",
  },
  {
    question: 'What does it mean when an ETF is "synthetic"?',
    options: [
      "It only holds fake assets",
      "It uses derivatives to replicate index performance rather than holding the actual assets",
      "It was created by AI",
      "It cannot be sold once purchased",
    ],
    correctIndex: 1,
    explanation:
      "Instead of buying the actual stocks in an index, a synthetic ETF uses financial contracts (derivatives) to mimic the returns. It introduces a small extra layer of counterparty risk.",
  },
  {
    question: "If an ETF has an expense ratio of 0.75% vs 0.10%, over 20 years this difference...",
    options: [
      "Is negligible — fees don't compound",
      "Can significantly erode returns due to compounding costs",
      "Only matters if you invest over £1 million",
      "Is offset by higher dividends",
    ],
    correctIndex: 1,
    explanation:
      "Fees compound just like returns do — but in reverse. A seemingly small 0.65% difference can cost tens of thousands of pounds over a 20-year investment horizon.",
  },
  {
    question: '"Tracking error" in an ETF refers to...',
    options: [
      "A mistake made by the fund manager",
      "The gap between the ETF's performance and the index it follows",
      "The delay in processing your trade",
      "An error in the ETF's price display",
    ],
    correctIndex: 1,
    explanation:
      "A well-run ETF should closely mirror its index. Tracking error measures how much it drifts — caused by fees, timing, or the way the fund is constructed.",
  },
];

const categories = [
  { label: "ETFs", active: true },
  { label: "Stocks", active: false },
  { label: "Bonds", active: false },
  { label: "Commodities", active: false },
];

/* ── Quiz overlay component ── */
function QuizOverlay({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState<1 | 2>(1);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  const questions = level === 1 ? LEVEL_1 : LEVEL_2;
  const current = questions[qIdx];
  const isCorrect = selected === current?.correctIndex;
  const total = questions.length;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === current.correctIndex) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (qIdx < total - 1) {
      setQIdx((i) => i + 1);
      setSelected(null);
    } else {
      // End of level
      if (level === 1) {
        setShowSummary(true);
      } else {
        setShowCongrats(true);
      }
    }
  };

  const retakeLevel1 = () => {
    setLevel(1);
    setQIdx(0);
    setSelected(null);
    setCorrectCount(0);
    setShowSummary(false);
    setShowCongrats(false);
  };

  const goToLevel2 = () => {
    setLevel(2);
    setQIdx(0);
    setSelected(null);
    setCorrectCount(0);
    setShowSummary(false);
  };

  /* ── Congrats screen (after level 2) ── */
  if (showCongrats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col bg-background"
      >
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <span className="text-xs font-semibold text-muted-foreground">ETF Quiz</span>
          <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <Trophy className="h-14 w-14 text-yellow-500" />
          <h2 className="text-xl font-bold text-foreground">You're an ETF expert! 🏆</h2>
          <p className="text-sm text-muted-foreground">More categories coming soon.</p>
          <button onClick={retakeLevel1} className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-4 w-4" /> Retake Level 1
          </button>
          <button onClick={onClose} className="mt-2 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background active:scale-[0.97]">Done</button>
        </div>
      </motion.div>
    );
  }

  /* ── Summary screen (after level 1) ── */
  if (showSummary) {
    const perfect = correctCount === total;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col bg-background"
      >
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <span className="text-xs font-semibold text-muted-foreground">ETF Quiz — Level 1</span>
          <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          {perfect ? <Rocket className="h-14 w-14 text-primary" /> : <span className="text-5xl">💪</span>}
          <h2 className="text-xl font-bold text-foreground">
            {perfect ? "Nailed it! You're ready for the next level 🚀" : "Great effort! Knowledge takes time."}
          </h2>
          <p className="text-sm text-muted-foreground">You got {correctCount} out of {total} correct.</p>

          {perfect && (
            <button onClick={goToLevel2} className="mt-4 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background active:scale-[0.97]">
              Go to Level 2
            </button>
          )}
          <button onClick={retakeLevel1} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-4 w-4" /> Retake Level 1
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Question screen ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Level {level} — Question {qIdx + 1} of {total}
        </span>
        <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-5 h-1 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${((qIdx + (selected !== null ? 1 : 0)) / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        <h3 className="text-base font-semibold text-foreground leading-snug mb-5">{current.question}</h3>

        <div className="space-y-2.5">
          {current.options.map((opt, i) => {
            let cardStyle = "border-border/60 bg-card";
            if (selected !== null) {
              if (i === current.correctIndex) cardStyle = "border-green-500/60 bg-green-500/10";
              else if (i === selected && !isCorrect) cardStyle = "border-destructive/60 bg-destructive/10";
            }
            return (
              <motion.button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={`w-full text-left rounded-xl border p-3.5 text-[13px] leading-snug transition-all ${cardStyle} ${selected === null ? "active:scale-[0.98]" : ""}`}
                layout
              >
                <span className="font-medium text-foreground">{String.fromCharCode(65 + i)})</span>{" "}
                <span className="text-foreground/90">{opt}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {selected !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-border/40 bg-muted/40 p-4"
            >
              <p className="text-xs font-semibold mb-1 text-foreground">{isCorrect ? "✅ Correct!" : "❌ Not quite"}</p>
              <p className="text-[12px] leading-relaxed text-muted-foreground">{current.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next button */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-5 right-5 z-[61]"
          >
            <button
              onClick={handleNext}
              className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background active:scale-[0.97]"
            >
              {qIdx < total - 1 ? "Next question" : level === 1 ? "See results" : "Finish quiz"}
            </button>
            {level === 2 && (
              <button onClick={retakeLevel1} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="inline h-3 w-3 mr-1" />Retake Level 1
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main exported section ── */
export default function SkillsQuiz() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <>
      <div className="pt-1 pb-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Test your skills in 2 minutes!</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.label}
              disabled={!cat.active}
              onClick={() => cat.active && setQuizOpen(true)}
              className={`relative flex-shrink-0 w-[130px] rounded-2xl border p-4 transition-all ${
                cat.active
                  ? "border-primary/30 bg-card active:scale-[0.97] cursor-pointer"
                  : "border-border/30 bg-muted/30 cursor-default"
              }`}
            >
              <p className={`text-sm font-semibold ${cat.active ? "text-foreground" : "text-muted-foreground/50"}`}>
                {cat.label}
              </p>
              {cat.active ? (
                <ChevronRight className="mt-3 h-4 w-4 text-primary" />
              ) : (
                <div className="mt-3 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/40">Coming soon</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {quizOpen && <QuizOverlay onClose={() => setQuizOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
