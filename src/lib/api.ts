const API = "/api/v1";
const TOKEN_KEY = "asktilly_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, { ...init, headers });

  if (!res.ok) {
    let msg: string;
    try {
      const body = await res.json();
      msg = body.detail ?? JSON.stringify(body);
    } catch {
      msg = await res.text();
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
