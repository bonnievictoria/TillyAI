const API = "/api/v1";
const TOKEN_KEY = "asktilly_token";
const FAMILY_MEMBER_KEY = "asktilly_family_member_id";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getActiveFamilyMemberId(): string | null {
  return localStorage.getItem(FAMILY_MEMBER_KEY);
}

export function setActiveFamilyMemberId(id: string | null) {
  if (id) {
    localStorage.setItem(FAMILY_MEMBER_KEY, id);
  } else {
    localStorage.removeItem(FAMILY_MEMBER_KEY);
  }
}

//need to remove
export class BackendOfflineError extends Error {
  constructor(message = "Backend is not active") {
    super(message);
    this.name = "BackendOfflineError";
  }
}

let backendOfflineUntil = 0;
const OFFLINE_RETRY_MS = 15_000;
const REQUEST_TIMEOUT_MS = 4_000;
// till this

async function request<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const familyMemberId = getActiveFamilyMemberId();
    if (familyMemberId) headers["X-Family-Member-Id"] = familyMemberId;
  }

  if (Date.now() < backendOfflineUntil) {
    throw new BackendOfflineError();
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers, signal: controller.signal });
  } catch (err) {
    backendOfflineUntil = Date.now() + OFFLINE_RETRY_MS;
    throw new BackendOfflineError();
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let msg: string;
    try {
      const body = await res.json();
      msg = body.detail ?? JSON.stringify(body);
    } catch {
      msg = await res.text();
    }
    // Treat common gateway/unavailable statuses as "offline" to avoid noisy errors.
    if ([502, 503, 504].includes(res.status)) {
      backendOfflineUntil = Date.now() + OFFLINE_RETRY_MS;
      throw new BackendOfflineError(msg || "Backend unavailable");
    }
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ── Auth types ──────────────────────────────────────────
export interface SignUpPayload {
  country_code: string;
  mobile: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface LoginPayload {
  country_code: string;
  mobile: string;
  password: string;
}

export interface UserInfo {
  id: string;
  country_code: string;
  mobile: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_onboarding_complete: boolean;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
}

// ── Auth API ────────────────────────────────────────────
export async function signup(p: SignUpPayload): Promise<{ user_id: string; access_token: string }> {
  const data = await request<{ user_id: string; access_token: string }>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify(p) },
    false,
  );
  setToken(data.access_token);
  return data;
}

export async function login(p: LoginPayload): Promise<{ user_id: string; access_token: string }> {
  const data = await request<{ user_id: string; access_token: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify(p) },
    false,
  );
  setToken(data.access_token);
  return data;
}

export async function getMe(): Promise<UserInfo> {
  return request<UserInfo>("/auth/me");
}

export async function updateMe(p: UserUpdatePayload): Promise<UserInfo> {
  return request<UserInfo>("/auth/me", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

// ── Onboarding API ──────────────────────────────────────
export interface OnboardingProfilePayload {
  date_of_birth?: string;
  selected_goals?: string[];
  custom_goals?: string[];
  investment_horizon?: string;
  annual_income_min?: number;
  annual_income_max?: number;
  annual_expense_min?: number;
  annual_expense_max?: number;
}

export async function saveOnboardingProfile(p: OnboardingProfilePayload) {
  return request("/onboarding/profile", {
    method: "POST",
    body: JSON.stringify(p),
  });
}

export async function completeOnboarding() {
  return request("/onboarding/complete", {
    method: "POST",
    body: JSON.stringify({ is_complete: true }),
  });
}

export function logout() {
  clearToken();
}

// ── Chat API ────────────────────────────────────────────
export interface ChatSessionInfo {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageInfo {
  id: string;
  role: string;
  content: string;
  intent: string | null;
  intent_confidence: number | null;
  intent_reasoning: string | null;
  created_at: string;
}

export interface ChatSendResponse {
  user_message: ChatMessageInfo;
  assistant_message: ChatMessageInfo;
}

export async function createChatSession(title?: string): Promise<ChatSessionInfo> {
  return request<ChatSessionInfo>("/chat/sessions", {
    method: "POST",
    body: JSON.stringify({ title: title ?? null }),
  });
}

export async function sendChatMessage(
  sessionId: string,
  content: string
): Promise<ChatSendResponse> {
  return request<ChatSendResponse>(`/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// ── Shared constants ────────────────────────────────────

export const RISK_CATEGORIES = [
  "Conservative",
  "Moderately Conservative",
  "Moderate",
  "Moderately Aggressive",
  "Aggressive",
] as const;

export type RiskCategory = (typeof RISK_CATEGORIES)[number];

// ── Profile types ───────────────────────────────────────

export interface PersonalInfoPayload {
  occupation?: string | null;
  family_status?: string | null;
  wealth_sources?: string[] | null;
  personal_values?: string[] | null;
  address?: string | null;
  currency?: string | null;
}

export interface PersonalInfoResponse {
  occupation: string | null;
  family_status: string | null;
  wealth_sources: string[] | null;
  personal_values: string[] | null;
  address: string | null;
  currency: string;
}

export interface InvestmentProfilePayload {
  objectives?: string[] | null;
  detailed_goals?: Record<string, unknown>[] | null;
  portfolio_value?: number | null;
  monthly_savings?: number | null;
  target_corpus?: number | null;
  target_timeline?: string | null;
  annual_income?: number | null;
  retirement_age?: number | null;
  investable_assets?: number | null;
  total_liabilities?: number | null;
  property_value?: number | null;
  mortgage_amount?: number | null;
  expected_inflows?: number | null;
  regular_outgoings?: number | null;
  planned_major_expenses?: number | null;
  emergency_fund?: number | null;
  emergency_fund_months?: string | null;
  liquidity_needs?: string | null;
  income_needs?: number | null;
  is_multi_phase_horizon?: boolean | null;
  phase_description?: string | null;
  total_horizon?: string | null;
}

export interface InvestmentProfileResponse extends InvestmentProfilePayload {
  id: string;
  updated_at: string | null;
}

export interface RiskProfilePayload {
  risk_level?: number | null;
  risk_capacity?: string | null;
  investment_experience?: string | null;
  investment_horizon?: string | null;
  drop_reaction?: string | null;
  max_drawdown?: number | null;
  comfort_assets?: string[] | null;
}

export interface RiskProfileResponse extends RiskProfilePayload {
  id: string;
  risk_category: string | null;
  updated_at: string | null;
}

export interface AllocationConstraintItem {
  asset_class: string;
  min_allocation?: number | null;
  max_allocation?: number | null;
}

export interface InvestmentConstraintPayload {
  permitted_assets?: string[] | null;
  prohibited_instruments?: string[] | null;
  is_leverage_allowed?: boolean | null;
  is_derivatives_allowed?: boolean | null;
  diversification_notes?: string | null;
  allocation_constraints?: AllocationConstraintItem[] | null;
}

export interface InvestmentConstraintResponse extends InvestmentConstraintPayload {
  id: string;
  updated_at: string | null;
}

export interface TaxProfilePayload {
  income_tax_rate?: number | null;
  capital_gains_tax_rate?: number | null;
  notes?: string | null;
}

export interface TaxProfileResponse extends TaxProfilePayload {
  id: string;
  updated_at: string | null;
}

export interface ReviewPreferencePayload {
  frequency?: string | null;
  triggers?: string[] | null;
  update_process?: string | null;
}

export interface ReviewPreferenceResponse extends ReviewPreferencePayload {
  id: string;
  updated_at: string | null;
}

export interface FullProfileResponse {
  personal_info: PersonalInfoResponse | null;
  investment_profile: InvestmentProfileResponse | null;
  risk_profile: RiskProfileResponse | null;
  investment_constraint: InvestmentConstraintResponse | null;
  tax_profile: TaxProfileResponse | null;
  review_preference: ReviewPreferenceResponse | null;
}

// ── Profile API ─────────────────────────────────────────

export async function getFullProfile(): Promise<FullProfileResponse> {
  return request<FullProfileResponse>("/profile/");
}

export async function getPersonalInfo(): Promise<PersonalInfoResponse> {
  return request<PersonalInfoResponse>("/profile/personal-info");
}

export async function updatePersonalInfo(p: PersonalInfoPayload): Promise<PersonalInfoResponse> {
  return request<PersonalInfoResponse>("/profile/personal-info", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

export async function getInvestmentProfile(): Promise<InvestmentProfileResponse> {
  return request<InvestmentProfileResponse>("/profile/investment");
}

export async function updateInvestmentProfile(p: InvestmentProfilePayload): Promise<InvestmentProfileResponse> {
  return request<InvestmentProfileResponse>("/profile/investment", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

export async function getRiskProfile(): Promise<RiskProfileResponse> {
  return request<RiskProfileResponse>("/profile/risk");
}

export async function updateRiskProfile(p: RiskProfilePayload): Promise<RiskProfileResponse> {
  return request<RiskProfileResponse>("/profile/risk", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

export async function getConstraints(): Promise<InvestmentConstraintResponse> {
  return request<InvestmentConstraintResponse>("/profile/constraints");
}

export async function updateConstraints(p: InvestmentConstraintPayload): Promise<InvestmentConstraintResponse> {
  return request<InvestmentConstraintResponse>("/profile/constraints", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

export async function getTaxProfile(): Promise<TaxProfileResponse> {
  return request<TaxProfileResponse>("/profile/tax");
}

export async function updateTaxProfile(p: TaxProfilePayload): Promise<TaxProfileResponse> {
  return request<TaxProfileResponse>("/profile/tax", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

export async function getReviewPreference(): Promise<ReviewPreferenceResponse> {
  return request<ReviewPreferenceResponse>("/profile/review");
}

export async function updateReviewPreference(p: ReviewPreferencePayload): Promise<ReviewPreferenceResponse> {
  return request<ReviewPreferenceResponse>("/profile/review", {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

// ── Family types ────────────────────────────────────────

export interface FamilyMember {
  id: string;
  owner_id: string;
  member_user_id: string | null;
  nickname: string;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  status: string;
  member_first_name: string | null;
  member_last_name: string | null;
  member_initials: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberListResponse {
  members: FamilyMember[];
  count: number;
}

export interface AddFamilyMemberPayload {
  nickname: string;
  phone: string;
  email?: string;
  relationship_type?: string;
}

export interface UpdateFamilyMemberPayload {
  nickname?: string;
  relationship_type?: string;
}

export interface OnboardFamilyMemberPayload {
  nickname: string;
  phone: string;
  country_code?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  password: string;
  relationship_type?: string;
}

export interface FamilyMemberPortfolioSummary {
  member_id: string;
  nickname: string;
  relationship_type: string;
  portfolio_value: number;
  total_invested: number;
  gain_percentage: number | null;
}

export interface CumulativeAllocationItem {
  asset_class: string;
  total_amount: number;
  allocation_percentage: number;
}

export interface CumulativePortfolioResponse {
  total_value: number;
  total_invested: number;
  total_gain_percentage: number | null;
  member_count: number;
  members: FamilyMemberPortfolioSummary[];
  combined_allocations: CumulativeAllocationItem[];
}

export interface PortfolioDetail {
  id: string;
  name: string;
  total_value: number;
  total_invested: number;
  total_gain_percentage: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  allocations: { id: string; asset_class: string; allocation_percentage: number; amount: number; performance_percentage: number | null }[];
  holdings: { id: string; instrument_name: string; instrument_type: string; ticker_symbol: string | null; quantity: number | null; average_cost: number | null; current_price: number | null; current_value: number; allocation_percentage: number | null }[];
}

// ── Family API ──────────────────────────────────────────

export async function listFamilyMembers(): Promise<FamilyMemberListResponse> {
  return request<FamilyMemberListResponse>("/family/members");
}

export async function addFamilyMember(p: AddFamilyMemberPayload): Promise<FamilyMember> {
  return request<FamilyMember>("/family/members", {
    method: "POST",
    body: JSON.stringify(p),
  });
}

export async function updateFamilyMember(memberId: string, p: UpdateFamilyMemberPayload): Promise<FamilyMember> {
  return request<FamilyMember>(`/family/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(p),
  });
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  await request<void>(`/family/members/${memberId}`, { method: "DELETE" });
}

export async function getFamilyMemberPortfolio(memberId: string): Promise<PortfolioDetail> {
  return request<PortfolioDetail>(`/family/members/${memberId}/portfolio`);
}

export async function getCumulativePortfolio(): Promise<CumulativePortfolioResponse> {
  return request<CumulativePortfolioResponse>("/family/portfolio/cumulative");
}

export async function verifyFamilyOtp(memberId: string, otp: string): Promise<FamilyMember> {
  return request<FamilyMember>(`/family/members/${memberId}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export async function resendFamilyOtp(memberId: string, retryType = "text"): Promise<{ message: string }> {
  return request<{ message: string }>(`/family/members/${memberId}/resend-otp`, {
    method: "POST",
    body: JSON.stringify({ retry_type: retryType }),
  });
}

export async function onboardFamilyMember(p: OnboardFamilyMemberPayload): Promise<FamilyMember> {
  return request<FamilyMember>("/family/members/onboard", {
    method: "POST",
    body: JSON.stringify(p),
  });
}
