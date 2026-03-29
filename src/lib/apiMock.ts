/**
 * In-memory API stand-in when VITE_FRONTEND_ONLY=true.
 * No fetch() — all data is local and mutable where PUT/POST apply.
 */
import type {
  AddFamilyMemberPayload,
  ChatMessageInfo,
  ChatSendResponse,
  ChatSessionInfo,
  CumulativeAllocationItem,
  CumulativePortfolioResponse,
  DiscoveryFund,
  DiscoveryFundListResponse,
  DiscoverySector,
  FamilyMember,
  FullProfileResponse,
  GoalResponse,
  InvestmentConstraintResponse,
  InvestmentProfilePayload,
  InvestmentProfileResponse,
  LoginPayload,
  OnboardFamilyMemberPayload,
  PersonalInfoPayload,
  PersonalInfoResponse,
  PortfolioDetail,
  PortfolioHistoryPoint,
  ReviewPreferencePayload,
  ReviewPreferenceResponse,
  RiskProfilePayload,
  RiskProfileResponse,
  SignUpPayload,
  TaxProfilePayload,
  TaxProfileResponse,
  UpdateFamilyMemberPayload,
  UserInfo,
  UserUpdatePayload,
} from "./api";

const iso = (d = new Date()) => d.toISOString();
const rid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

let mockUser: UserInfo = {
  id: "user-demo-1",
  country_code: "+91",
  mobile: "9000000000",
  email: "demo@asktilly.local",
  first_name: "Demo",
  last_name: "Investor",
  is_onboarding_complete: true,
};

let personalInfo: PersonalInfoResponse = {
  occupation: "Technology",
  family_status: "Married",
  wealth_sources: ["Salary", "Investments"],
  personal_values: ["Long-term growth"],
  address: "Mumbai, India",
  currency: "INR",
};

let investmentProfile: InvestmentProfileResponse = {
  id: "inv-1",
  updated_at: iso(),
  objectives: ["Wealth Growth", "Retirement Planning"],
  detailed_goals: [],
  portfolio_value: 24_50_000,
  monthly_savings: 45_000,
  target_corpus: 2_00_00_000,
  target_timeline: "15–20 years",
  annual_income: 18_00_000,
  retirement_age: 58,
  investable_assets: 22_00_000,
  total_liabilities: 5_00_000,
  property_value: 85_00_000,
  mortgage_amount: 35_00_000,
  expected_inflows: null,
  regular_outgoings: 90_000,
  planned_major_expenses: null,
  emergency_fund: 6_00_000,
  emergency_fund_months: "6 months",
  liquidity_needs: "Moderate",
  income_needs: null,
  is_multi_phase_horizon: false,
  phase_description: null,
  total_horizon: "10–15 years",
};

let riskProfile: RiskProfileResponse = {
  id: "risk-1",
  updated_at: iso(),
  risk_level: 3,
  risk_capacity: "Moderate",
  investment_experience: "Intermediate",
  investment_horizon: "10–15 years",
  drop_reaction: "Hold and review",
  max_drawdown: 20,
  comfort_assets: ["Equity", "Debt"],
  risk_category: "Moderate",
};

let investmentConstraint: InvestmentConstraintResponse = {
  id: "con-1",
  updated_at: iso(),
  permitted_assets: ["Equity", "Debt", "Gold"],
  prohibited_instruments: ["Crypto"],
  is_leverage_allowed: false,
  is_derivatives_allowed: false,
  diversification_notes: "Prefer diversified mutual funds.",
  allocation_constraints: [
    { asset_class: "Equity", min_allocation: 40, max_allocation: 70 },
    { asset_class: "Debt", min_allocation: 20, max_allocation: 50 },
  ],
};

let taxProfile: TaxProfileResponse = {
  id: "tax-1",
  updated_at: iso(),
  income_tax_rate: 30,
  capital_gains_tax_rate: 10,
  notes: "Indian tax resident",
};

let reviewPreference: ReviewPreferenceResponse = {
  id: "rev-1",
  updated_at: iso(),
  frequency: "Quarterly",
  triggers: ["Major market moves", "Rebalancing"],
  update_process: "Email summary",
};

const basePortfolio: PortfolioDetail = {
  id: "port-primary",
  name: "Primary",
  total_value: 24_50_000,
  total_invested: 21_00_000,
  total_gain_percentage: 16.67,
  is_primary: true,
  created_at: iso(),
  updated_at: iso(),
  allocations: [
    { id: "a1", asset_class: "Equity", allocation_percentage: 58, amount: 14_21_000, performance_percentage: 18.2 },
    { id: "a2", asset_class: "Debt", allocation_percentage: 32, amount: 7_84_000, performance_percentage: 7.1 },
    { id: "a3", asset_class: "Gold", allocation_percentage: 10, amount: 2_45_000, performance_percentage: 12.4 },
  ],
  holdings: [
    {
      id: "h1",
      instrument_name: "Parag Parikh Flexi Cap Fund",
      instrument_type: "Mutual Fund",
      ticker_symbol: null,
      quantity: null,
      average_cost: null,
      current_price: null,
      current_value: 6_20_000,
      allocation_percentage: 25.3,
    },
    {
      id: "h2",
      instrument_name: "HDFC Corporate Bond Fund",
      instrument_type: "Mutual Fund",
      ticker_symbol: null,
      quantity: null,
      average_cost: null,
      current_price: null,
      current_value: 4_10_000,
      allocation_percentage: 16.7,
    },
  ],
};

let familyMembers: FamilyMember[] = [
  {
    id: "fam-1",
    owner_id: mockUser.id,
    member_user_id: "user-spouse-1",
    nickname: "Spouse",
    email: "spouse@example.com",
    phone: "9000000001",
    relationship_type: "Spouse",
    status: "active",
    member_first_name: "Alex",
    member_last_name: "Investor",
    member_initials: "AI",
    created_at: iso(),
    updated_at: iso(),
  },
];

const goalsState: GoalResponse[] = [
  {
    id: "g1",
    name: "Retirement",
    slug: "retirement",
    icon: "🎯",
    description: "Comfortable retirement corpus",
    target_amount: 2_00_00_000,
    target_date: "2045-06-01",
    invested_amount: 8_50_000,
    current_value: 9_20_000,
    monthly_contribution: 25_000,
    suggested_contribution: 28_000,
    priority: "high",
    status: "active",
    created_at: iso(),
    updated_at: iso(),
  },
  {
    id: "g2",
    name: "Education fund",
    slug: "education",
    icon: "📚",
    description: "Children higher education",
    target_amount: 40_00_000,
    target_date: "2032-04-01",
    invested_amount: 4_00_000,
    current_value: 4_35_000,
    monthly_contribution: 15_000,
    suggested_contribution: 15_000,
    priority: "medium",
    status: "active",
    created_at: iso(),
    updated_at: iso(),
  },
];

const discoveryFundsSeed: DiscoveryFund[] = [
  {
    id: "d1",
    name: "Parag Parikh Flexi Cap Fund",
    short_name: "PPFAS Flexi Cap",
    ticker_symbol: null,
    category: "Flexi Cap",
    sector: null,
    description: "Long-term equity fund with global diversification.",
    exchange: null,
    expense_ratio: 0.77,
    exit_load: "1% if < 365 days",
    min_investment: 1000,
    return_1y: 18.2,
    return_3y: 14.1,
    return_5y: 16.8,
    risk_level: "Moderate",
    is_trending: true,
    is_house_view: true,
  },
  {
    id: "d2",
    name: "ICICI Pru Technology Fund",
    short_name: "ICICI Tech",
    ticker_symbol: null,
    category: "Sectoral",
    sector: "Technology",
    description: "Technology sector exposure.",
    exchange: null,
    expense_ratio: 1.02,
    exit_load: "1% if < 365 days",
    min_investment: 5000,
    return_1y: 22.4,
    return_3y: 12.8,
    return_5y: 18.2,
    risk_level: "High",
    is_trending: true,
    is_house_view: false,
  },
  {
    id: "d3",
    name: "HDFC Corporate Bond Fund",
    short_name: "HDFC Corp Bond",
    ticker_symbol: null,
    category: "Corporate Bond",
    sector: null,
    description: "High-quality corporate debt.",
    exchange: null,
    expense_ratio: 0.32,
    exit_load: null,
    min_investment: 5000,
    return_1y: 7.1,
    return_3y: 6.8,
    return_5y: 7.5,
    risk_level: "Low",
    is_trending: false,
    is_house_view: true,
  },
];

let chatSessionId = "chat-sess-demo";
let chatMsgCounter = 0;

function nextChatMsg(role: string, content: string): ChatMessageInfo {
  chatMsgCounter += 1;
  return {
    id: `cm-${chatMsgCounter}`,
    role,
    content,
    intent: null,
    intent_confidence: null,
    intent_reasoning: null,
    created_at: iso(),
  };
}

function portfolioHistory(limit: number): PortfolioHistoryPoint[] {
  const n = Math.min(Math.max(limit, 1), 365);
  const out: PortfolioHistoryPoint[] = [];
  let v = basePortfolio.total_invested * 0.92;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    v *= 1 + (Math.sin(i / 7) * 0.002 + 0.0015);
    out.push({
      id: `ph-${i}`,
      recorded_date: d.toISOString().slice(0, 10),
      total_value: Math.round(v),
    });
  }
  out[out.length - 1]!.total_value = basePortfolio.total_value;
  return out;
}

function memberPortfolio(memberId: string): PortfolioDetail {
  const m = familyMembers.find((x) => x.id === memberId);
  const nickname = m?.nickname ?? "Member";
  return {
    id: `port-${memberId}`,
    name: `${nickname}'s portfolio`,
    total_value: 12_00_000,
    total_invested: 10_50_000,
    total_gain_percentage: 14.3,
    is_primary: false,
    created_at: iso(),
    updated_at: iso(),
    allocations: [
      { id: "ma1", asset_class: "Equity", allocation_percentage: 55, amount: 6_60_000, performance_percentage: 15 },
      { id: "ma2", asset_class: "Debt", allocation_percentage: 45, amount: 5_40_000, performance_percentage: 6 },
    ],
    holdings: [],
  };
}

function cumulativePortfolio(): CumulativePortfolioResponse {
  const selfSummary = {
    member_id: "self",
    nickname: "You",
    relationship_type: "Self",
    portfolio_value: basePortfolio.total_value,
    total_invested: basePortfolio.total_invested,
    gain_percentage: basePortfolio.total_gain_percentage,
  };
  const memberSummaries: typeof selfSummary[] = familyMembers.map((fm) => ({
    member_id: fm.id,
    nickname: fm.nickname,
    relationship_type: fm.relationship_type,
    portfolio_value: 12_00_000,
    total_invested: 10_50_000,
    gain_percentage: 14.3,
  }));
  const members = [selfSummary, ...memberSummaries];
  const total_value = members.reduce((s, m) => s + m.portfolio_value, 0);
  const total_invested = members.reduce((s, m) => s + m.total_invested, 0);
  const combined: CumulativeAllocationItem[] = [
    { asset_class: "Equity", total_amount: Math.round(total_value * 0.56), allocation_percentage: 56 },
    { asset_class: "Debt", total_amount: Math.round(total_value * 0.34), allocation_percentage: 34 },
    { asset_class: "Gold", total_amount: Math.round(total_value * 0.1), allocation_percentage: 10 },
  ];
  return {
    total_value,
    total_invested,
    total_gain_percentage: total_invested > 0 ? Math.round(((total_value - total_invested) / total_invested) * 1000) / 10 : null,
    member_count: members.length,
    members,
    combined_allocations: combined,
  };
}

function fullProfile(): FullProfileResponse {
  return {
    personal_info: { ...personalInfo },
    investment_profile: { ...investmentProfile },
    risk_profile: { ...riskProfile },
    investment_constraint: { ...investmentConstraint },
    tax_profile: { ...taxProfile },
    review_preference: { ...reviewPreference },
  };
}

function parseBody(init?: RequestInit): unknown {
  if (!init?.body) return undefined;
  const s = typeof init.body === "string" ? init.body : String(init.body);
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return undefined;
  }
}

export async function mockApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const body = parseBody(init) as Record<string, unknown> | undefined;

  // ── Auth ─────────────────────────────────────────────
  if (path === "/auth/signup" && method === "POST") {
    const p = body as unknown as SignUpPayload;
    mockUser = {
      ...mockUser,
      id: rid("user"),
      country_code: p.country_code,
      mobile: p.mobile,
      first_name: p.first_name ?? mockUser.first_name,
      last_name: p.last_name ?? mockUser.last_name,
      email: p.email ?? mockUser.email,
      is_onboarding_complete: true,
    };
    return { user_id: mockUser.id, access_token: "frontend-only-token" } as T;
  }
  if (path === "/auth/login" && method === "POST") {
    const p = body as unknown as LoginPayload;
    mockUser = {
      ...mockUser,
      country_code: p.country_code,
      mobile: p.mobile,
      is_onboarding_complete: true,
    };
    return { user_id: mockUser.id, access_token: "frontend-only-token" } as T;
  }
  if (path === "/auth/me" && method === "GET") {
    return { ...mockUser } as T;
  }
  if (path === "/auth/me" && method === "PUT") {
    const p = body as UserUpdatePayload;
    mockUser = {
      ...mockUser,
      first_name: p.first_name ?? mockUser.first_name,
      last_name: p.last_name ?? mockUser.last_name,
      email: p.email ?? mockUser.email,
    };
    return { ...mockUser } as T;
  }

  // ── Onboarding ───────────────────────────────────────
  if (path === "/onboarding/profile" && method === "POST") {
    return {} as T;
  }
  if (path === "/onboarding/complete" && method === "POST") {
    mockUser = { ...mockUser, is_onboarding_complete: true };
    return {} as T;
  }

  // ── Chat ─────────────────────────────────────────────
  if (path === "/chat/sessions" && method === "POST") {
    chatSessionId = rid("sess");
    const title = (body?.title as string | null | undefined) ?? null;
    const session: ChatSessionInfo = {
      id: chatSessionId,
      title,
      status: "active",
      created_at: iso(),
      updated_at: iso(),
    };
    return session as T;
  }
  const chatMsgMatch = path.match(/^\/chat\/sessions\/([^/]+)\/messages$/);
  if (chatMsgMatch && method === "POST") {
    const content = String((body as { content?: string })?.content ?? "");
    const userMsg = nextChatMsg("user", content);
    const reply =
      "This is **frontend-only** mode — there is no live AI. Your message was: \"" +
      content.slice(0, 200) +
      (content.length > 200 ? "…" : "") +
      "\". Connect the backend for real responses.";
    const assistantMsg = nextChatMsg("assistant", reply);
    const resp: ChatSendResponse = {
      user_message: userMsg,
      assistant_message: assistantMsg,
    };
    return resp as T;
  }

  // ── Profile ──────────────────────────────────────────
  if (path === "/profile/" && method === "GET") {
    return fullProfile() as T;
  }
  if (path === "/profile/personal-info" && method === "GET") {
    return { ...personalInfo } as T;
  }
  if (path === "/profile/personal-info" && method === "PUT") {
    const p = body as PersonalInfoPayload;
    personalInfo = {
      ...personalInfo,
      ...p,
      occupation: p.occupation ?? personalInfo.occupation,
      family_status: p.family_status ?? personalInfo.family_status,
      wealth_sources: p.wealth_sources ?? personalInfo.wealth_sources,
      personal_values: p.personal_values ?? personalInfo.personal_values,
      address: p.address ?? personalInfo.address,
      currency: p.currency ?? personalInfo.currency,
    };
    return { ...personalInfo } as T;
  }
  if (path === "/profile/investment" && method === "GET") {
    return { ...investmentProfile } as T;
  }
  if (path === "/profile/investment" && method === "PUT") {
    const p = body as InvestmentProfilePayload;
    investmentProfile = {
      ...investmentProfile,
      ...p,
      updated_at: iso(),
    };
    return { ...investmentProfile } as T;
  }
  if (path === "/profile/risk" && method === "GET") {
    return { ...riskProfile } as T;
  }
  if (path === "/profile/risk" && method === "PUT") {
    const p = body as RiskProfilePayload;
    riskProfile = {
      ...riskProfile,
      ...p,
      updated_at: iso(),
    };
    return { ...riskProfile } as T;
  }
  if (path === "/profile/constraints" && method === "GET") {
    return { ...investmentConstraint } as T;
  }
  if (path === "/profile/constraints" && method === "PUT") {
    investmentConstraint = {
      ...investmentConstraint,
      ...(body as Record<string, unknown>),
      updated_at: iso(),
    } as InvestmentConstraintResponse;
    return { ...investmentConstraint } as T;
  }
  if (path === "/profile/tax" && method === "GET") {
    return { ...taxProfile } as T;
  }
  if (path === "/profile/tax" && method === "PUT") {
    const p = body as TaxProfilePayload;
    taxProfile = { ...taxProfile, ...p, updated_at: iso() };
    return { ...taxProfile } as T;
  }
  if (path === "/profile/review" && method === "GET") {
    return { ...reviewPreference } as T;
  }
  if (path === "/profile/review" && method === "PUT") {
    const p = body as ReviewPreferencePayload;
    reviewPreference = { ...reviewPreference, ...p, updated_at: iso() };
    return { ...reviewPreference } as T;
  }

  // ── Portfolio ────────────────────────────────────────
  if (path === "/portfolio/" && method === "GET") {
    return { ...basePortfolio, allocations: [...basePortfolio.allocations], holdings: [...basePortfolio.holdings] } as T;
  }
  if (path.startsWith("/portfolio/history") && method === "GET") {
    const u = new URLSearchParams(path.split("?")[1] ?? "");
    const limit = Number(u.get("limit") ?? "90") || 90;
    return portfolioHistory(limit) as T;
  }

  // ── Goals ────────────────────────────────────────────
  if (path === "/goals/" && method === "GET") {
    return goalsState.map((g) => ({ ...g })) as T;
  }

  // ── Discovery ────────────────────────────────────────
  if (path.startsWith("/discovery/funds") && method === "GET") {
    const q = path.includes("?") ? new URLSearchParams(path.split("?")[1]) : new URLSearchParams();
    const search = (q.get("search") ?? "").toLowerCase();
    let funds = [...discoveryFundsSeed];
    if (search) {
      funds = funds.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          (f.short_name?.toLowerCase().includes(search) ?? false) ||
          (f.category?.toLowerCase().includes(search) ?? false),
      );
    }
    const category = q.get("category");
    if (category) funds = funds.filter((f) => f.category === category);
    const sector = q.get("sector");
    if (sector) funds = funds.filter((f) => f.sector === sector);
    const res: DiscoveryFundListResponse = { funds, total: funds.length };
    return res as T;
  }
  if (path === "/discovery/trending" && method === "GET") {
    return discoveryFundsSeed.filter((f) => f.is_trending).map((f) => ({ ...f })) as T;
  }
  if (path === "/discovery/house-view" && method === "GET") {
    return discoveryFundsSeed.filter((f) => f.is_house_view).map((f) => ({ ...f })) as T;
  }
  if (path === "/discovery/sectors" && method === "GET") {
    const map = new Map<string, number>();
    for (const f of discoveryFundsSeed) {
      const s = f.sector ?? "Other";
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    const sectors: DiscoverySector[] = [...map.entries()].map(([sector, fund_count]) => ({ sector, fund_count }));
    return sectors as T;
  }

  // ── Family ───────────────────────────────────────────
  if (path === "/family/members" && method === "GET") {
    return { members: familyMembers.map((m) => ({ ...m })), count: familyMembers.length } as T;
  }
  if (path === "/family/members" && method === "POST") {
    const p = body as unknown as AddFamilyMemberPayload;
    const fm: FamilyMember = {
      id: rid("fam"),
      owner_id: mockUser.id,
      member_user_id: null,
      nickname: p.nickname,
      email: p.email ?? null,
      phone: p.phone,
      relationship_type: p.relationship_type ?? "Family",
      status: "pending",
      member_first_name: null,
      member_last_name: null,
      member_initials: null,
      created_at: iso(),
      updated_at: iso(),
    };
    familyMembers = [...familyMembers, fm];
    return { ...fm } as T;
  }
  if (path === "/family/members/onboard" && method === "POST") {
    const p = body as unknown as OnboardFamilyMemberPayload;
    const fm: FamilyMember = {
      id: rid("fam"),
      owner_id: mockUser.id,
      member_user_id: rid("user"),
      nickname: p.nickname,
      email: p.email ?? null,
      phone: p.phone,
      relationship_type: p.relationship_type ?? "Family",
      status: "active",
      member_first_name: p.first_name,
      member_last_name: p.last_name ?? null,
      member_initials: (p.first_name[0] ?? "?") + (p.last_name?.[0] ?? ""),
      created_at: iso(),
      updated_at: iso(),
    };
    familyMembers = [...familyMembers, fm];
    return { ...fm } as T;
  }

  const famMemberMatch =
    path !== "/family/members/onboard" && path.match(/^\/family\/members\/([^/]+)$/);
  if (famMemberMatch && method === "PUT") {
    const id = famMemberMatch[1];
    const p = body as UpdateFamilyMemberPayload;
    familyMembers = familyMembers.map((m) =>
      m.id === id ? { ...m, ...p, updated_at: iso() } : m,
    );
    const updated = familyMembers.find((m) => m.id === id);
    if (!updated) throw new Error("Member not found");
    return { ...updated } as T;
  }
  if (famMemberMatch && method === "DELETE") {
    const id = famMemberMatch[1];
    familyMembers = familyMembers.filter((m) => m.id !== id);
    return undefined as T;
  }

  const verifyMatch = path.match(/^\/family\/members\/([^/]+)\/verify-otp$/);
  if (verifyMatch && method === "POST") {
    const id = verifyMatch[1];
    familyMembers = familyMembers.map((m) =>
      m.id === id ? { ...m, status: "active", updated_at: iso() } : m,
    );
    const m = familyMembers.find((x) => x.id === id);
    if (!m) throw new Error("Member not found");
    return { ...m } as T;
  }

  const resendMatch = path.match(/^\/family\/members\/([^/]+)\/resend-otp$/);
  if (resendMatch && method === "POST") {
    return { message: "OTP resent (mock)" } as T;
  }

  const famPortMatch = path.match(/^\/family\/members\/([^/]+)\/portfolio$/);
  if (famPortMatch && method === "GET") {
    return memberPortfolio(famPortMatch[1]) as T;
  }

  if (path === "/family/portfolio/cumulative" && method === "GET") {
    return cumulativePortfolio() as T;
  }

  throw new Error(`[frontend-only mock] Unhandled ${method} ${path}`);
}
