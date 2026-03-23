import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Pencil, Check, FileText, ChevronRight, ChevronDown,
  MessageSquareText, Calculator, BarChart3, Users, Shield,
  Target, Briefcase, DollarSign, Clock, AlertCircle, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import {
  updateMe,
  getFullProfile,
  updatePersonalInfo,
  updateInvestmentProfile,
  updateRiskProfile,
  updateTaxProfile,
  updateReviewPreference,
  RISK_CATEGORIES,
  BackendOfflineError,
  type FullProfileResponse,
  type UserUpdatePayload,
} from "@/lib/api";

/* ── tiny helpers ── */
const fmt = (n: number | null | undefined) => {
  if (n == null || n === 0) return null;
  return `₹${n.toLocaleString("en-IN")}`;
};

const pct = (n: number | null | undefined) =>
  n != null ? `${n}%` : null;

const EmptyHint = ({ label }: { label: string }) => (
  <span className="text-[10px] italic text-muted-foreground/60">
    {label} — tap edit to add
  </span>
);

const FieldRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
    {value ? (
      <p className="text-xs text-foreground">{value}</p>
    ) : (
      <EmptyHint label={`No ${label.toLowerCase()}`} />
    )}
  </div>
);

const SectionCard = ({
  title,
  icon: Icon,
  completeness,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  completeness: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="wealth-card !p-0 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        {completeness < 100 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1 flex-1 max-w-[80px] rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{completeness}%</span>
          </div>
        )}
        {completeness === 100 && (
          <span className="text-[9px] font-medium text-[hsl(160,50%,38%)]">Complete</span>
        )}
      </div>
      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-3 pb-3 pt-0.5 border-t border-border/30">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ── reusable sub-components (outside Profile to preserve identity across renders) ── */
const ProfileInput = ({ value, onChange, placeholder, prefix }: { value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string }) => (
  <div className="relative">
    {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{prefix}</span>}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary transition-colors ${prefix ? "pl-6" : ""}`}
    />
  </div>
);

const ProfileChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all ${active ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border hover:border-accent/40"}`}
  >
    {label}
  </button>
);

const EditSaveBtn = ({ editing, onEdit, onSave }: { editing: boolean; onEdit: () => void; onSave: () => void }) => (
  <button
    onClick={editing ? onSave : onEdit}
    className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
  >
    {editing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
    {editing ? "Save" : "Edit"}
  </button>
);

/* ── main ── */
const Profile = () => {
  const navigate = useNavigate();
  const { user, refresh, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FullProfileResponse | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  /* editable contact fields */
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  /* editable personal info */
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalDraft, setPersonalDraft] = useState({
    occupation: "",
    family_status: "",
    wealth_sources: [] as string[],
    personal_values: "",
    address: "",
  });

  /* editable investment profile */
  const [editingInvestment, setEditingInvestment] = useState(false);
  const [investDraft, setInvestDraft] = useState({
    portfolio_value: "",
    monthly_savings: "",
    target_corpus: "",
    target_timeline: "",
    annual_income: "",
    retirement_age: "",
    objectives: [] as string[],
  });

  /* editable risk */
  const [editingRisk, setEditingRisk] = useState(false);
  const [riskDraft, setRiskDraft] = useState({
    risk_level: 2,
    risk_capacity: "",
    investment_experience: "",
    investment_horizon: "",
    drop_reaction: "",
    max_drawdown: "",
  });

  /* editable tax */
  const [editingTax, setEditingTax] = useState(false);
  const [taxDraft, setTaxDraft] = useState({
    income_tax_rate: "",
    capital_gains_tax_rate: "",
    notes: "",
  });

  /* editable review */
  const [editingReview, setEditingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({
    frequency: "Quarterly",
    update_process: "",
  });

  /* ── load data ── */
  useEffect(() => {
    if (user) {
      setContactDraft({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        email: user.email ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getFullProfile();
        if (cancelled) return;
        setProfile(p);

        if (p.personal_info) {
          const pi = p.personal_info;
          setPersonalDraft({
            occupation: pi.occupation ?? "",
            family_status: pi.family_status ?? "",
            wealth_sources: pi.wealth_sources ?? [],
            personal_values: pi.personal_values?.join(", ") ?? "",
            address: pi.address ?? "",
          });
        }

        if (p.investment_profile) {
          const ip = p.investment_profile;
          setInvestDraft({
            portfolio_value: ip.portfolio_value?.toString() ?? "",
            monthly_savings: ip.monthly_savings?.toString() ?? "",
            target_corpus: ip.target_corpus?.toString() ?? "",
            target_timeline: ip.target_timeline ?? "",
            annual_income: ip.annual_income?.toString() ?? "",
            retirement_age: ip.retirement_age?.toString() ?? "",
            objectives: ip.objectives ?? [],
          });
        }

        if (p.risk_profile) {
          const rp = p.risk_profile;
          setRiskDraft({
            risk_level: rp.risk_level ?? 2,
            risk_capacity: rp.risk_capacity ?? "",
            investment_experience: rp.investment_experience ?? "",
            investment_horizon: rp.investment_horizon ?? "",
            drop_reaction: rp.drop_reaction ?? "",
            max_drawdown: rp.max_drawdown?.toString() ?? "",
          });
        }

        if (p.tax_profile) {
          const tp = p.tax_profile;
          setTaxDraft({
            income_tax_rate: tp.income_tax_rate?.toString() ?? "",
            capital_gains_tax_rate: tp.capital_gains_tax_rate?.toString() ?? "",
            notes: tp.notes ?? "",
          });
        }

        if (p.review_preference) {
          const rp = p.review_preference;
          setReviewDraft({
            frequency: rp.frequency ?? "Quarterly",
            update_process: rp.update_process ?? "",
          });
        }
      } catch {
        // first-time user
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── save handlers ── */
  const saveContact = useCallback(async () => {
    try {
      const payload: UserUpdatePayload = {};
      if (contactDraft.first_name) payload.first_name = contactDraft.first_name;
      if (contactDraft.last_name) payload.last_name = contactDraft.last_name;
      if (contactDraft.email) payload.email = contactDraft.email;
      await updateMe(payload);
      await refresh();
      setEditingContact(false);
      toast.success("Contact info updated");
    } catch (err) {
      if (err instanceof BackendOfflineError) return;
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }, [contactDraft, refresh]);

  const savePersonal = useCallback(async () => {
    try {
      const res = await updatePersonalInfo({
        occupation: personalDraft.occupation || null,
        family_status: personalDraft.family_status || null,
        wealth_sources: personalDraft.wealth_sources.length ? personalDraft.wealth_sources : null,
        personal_values: personalDraft.personal_values
          ? personalDraft.personal_values.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        address: personalDraft.address || null,
      });
      setProfile((prev) => prev ? { ...prev, personal_info: res } : prev);
      setEditingPersonal(false);
      toast.success("Personal info updated");
    } catch (err) {
      if (err instanceof BackendOfflineError) return;
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }, [personalDraft]);

  const saveInvestment = useCallback(async () => {
    try {
      const toNum = (s: string) => {
        const n = Number(s.replace(/[₹,\s]/g, ""));
        return Number.isNaN(n) || n === 0 ? null : n;
      };
      const res = await updateInvestmentProfile({
        objectives: investDraft.objectives.length ? investDraft.objectives : null,
        portfolio_value: toNum(investDraft.portfolio_value),
        monthly_savings: toNum(investDraft.monthly_savings),
        target_corpus: toNum(investDraft.target_corpus),
        target_timeline: investDraft.target_timeline || null,
        annual_income: toNum(investDraft.annual_income),
        retirement_age: investDraft.retirement_age ? Number(investDraft.retirement_age) : null,
      });
      setProfile((prev) => prev ? { ...prev, investment_profile: res } : prev);
      setEditingInvestment(false);
      toast.success("Investment profile updated");
    } catch (err) {
      if (err instanceof BackendOfflineError) return;
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }, [investDraft]);

  const saveRisk = useCallback(async () => {
    try {
      const res = await updateRiskProfile({
        risk_level: riskDraft.risk_level,
        risk_capacity: riskDraft.risk_capacity || null,
        investment_experience: riskDraft.investment_experience || null,
        investment_horizon: riskDraft.investment_horizon || null,
        drop_reaction: riskDraft.drop_reaction || null,
        max_drawdown: riskDraft.max_drawdown ? Number(riskDraft.max_drawdown) : null,
      });
      setProfile((prev) => prev ? { ...prev, risk_profile: res } : prev);
      setEditingRisk(false);
      toast.success("Risk profile updated");
    } catch (err) {
      if (err instanceof BackendOfflineError) return;
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }, [riskDraft]);

  const saveTax = useCallback(async () => {
    try {
      const res = await updateTaxProfile({
        income_tax_rate: taxDraft.income_tax_rate ? Number(taxDraft.income_tax_rate) : null,
        capital_gains_tax_rate: taxDraft.capital_gains_tax_rate ? Number(taxDraft.capital_gains_tax_rate) : null,
        notes: taxDraft.notes || null,
      });
      setProfile((prev) => prev ? { ...prev, tax_profile: res } : prev);
      setEditingTax(false);
      toast.success("Tax profile updated");
    } catch (err) {
      if (err instanceof BackendOfflineError) return;
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }, [taxDraft]);

  const saveReview = useCallback(async () => {
    try {
      const res = await updateReviewPreference({
        frequency: reviewDraft.frequency || null,
        update_process: reviewDraft.update_process || null,
      });
      setProfile((prev) => prev ? { ...prev, review_preference: res } : prev);
      setEditingReview(false);
      toast.success("Review preferences updated");
    } catch (err) {
      if (err instanceof BackendOfflineError) return;
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }, [reviewDraft]);

  /* ── completeness ── */
  const personalCompleteness = (() => {
    const pi = profile?.personal_info;
    if (!pi) return 0;
    const fields = [pi.occupation, pi.family_status, pi.wealth_sources?.length ? "y" : null, pi.address];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  const investCompleteness = (() => {
    const ip = profile?.investment_profile;
    if (!ip) return 0;
    const fields = [ip.objectives?.length ? "y" : null, ip.portfolio_value, ip.monthly_savings, ip.annual_income, ip.target_corpus, ip.target_timeline];
    return Math.round((fields.filter((f) => f != null && f !== 0).length / fields.length) * 100);
  })();

  const riskCompleteness = (() => {
    const rp = profile?.risk_profile;
    if (!rp) return 0;
    const fields = [rp.risk_level != null ? "y" : null, rp.risk_capacity, rp.investment_experience, rp.investment_horizon, rp.drop_reaction];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  const taxCompleteness = (() => {
    const tp = profile?.tax_profile;
    if (!tp) return 0;
    const fields = [tp.income_tax_rate, tp.capital_gains_tax_rate];
    return Math.round((fields.filter((f) => f != null).length / fields.length) * 100);
  })();

  const reviewCompleteness = (() => {
    const rp = profile?.review_preference;
    if (!rp) return 0;
    return rp.frequency ? 100 : 0;
  })();

  const overallCompleteness = Math.round(
    (personalCompleteness + investCompleteness + riskCompleteness + taxCompleteness + reviewCompleteness) / 5
  );

  const toggleSection = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  /* ── display ── */
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";
  const displayEmail = user?.email ?? "";
  const displayPhone = user ? `${user.country_code} ${user.mobile}` : "";
  const pi = profile?.personal_info;
  const ip = profile?.investment_profile;
  const rp = profile?.risk_profile;
  const tp = profile?.tax_profile;
  const rv = profile?.review_preference;

  if (loading) {
    return (
      <div className="mobile-container bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-background pb-20 min-h-screen">
      <div className="px-5 pt-8 pb-2">
        <h1 className="text-base font-semibold text-foreground">Profile</h1>
      </div>

      {/* Profile header */}
      <div className="px-5 flex flex-col items-center pt-1 mb-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mb-1.5"
        >
          <span className="text-sm font-bold text-accent">
            {(user?.first_name?.[0] ?? "U").toUpperCase()}
            {(user?.last_name?.[0] ?? "").toUpperCase()}
          </span>
        </motion.div>
        <p className="text-sm font-semibold text-foreground">{displayName}</p>
        <p className="text-[11px] text-muted-foreground">{displayEmail || displayPhone}</p>
      </div>

      {/* Overall completeness */}
      {overallCompleteness < 100 && (
        <div className="px-5 mb-3">
          <div className="rounded-xl bg-[hsl(38_80%_95%)] px-3 py-2.5 flex items-center gap-2.5">
            <AlertCircle className="h-3.5 w-3.5 text-[hsl(38,80%,48%)] shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] font-medium text-[hsl(38,80%,30%)]">Profile {overallCompleteness}% complete</p>
              <div className="h-1 w-full rounded-full bg-[hsl(38,80%,85%)] mt-1 overflow-hidden">
                <div className="h-full rounded-full bg-[hsl(38,80%,48%)] transition-all duration-500" style={{ width: `${overallCompleteness}%` }} />
              </div>
            </div>
            <button
              onClick={() => navigate("/profile/complete")}
              className="text-[10px] font-semibold text-[hsl(38,80%,38%)] hover:underline shrink-0"
            >
              Complete →
            </button>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="px-5 mb-2">
        <div className="wealth-card !p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-foreground">Account Details</h3>
            <EditSaveBtn editing={editingContact} onEdit={() => setEditingContact(true)} onSave={saveContact} />
          </div>
          <div className="space-y-1.5">
            {editingContact ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">First Name</p>
                    <ProfileInput value={contactDraft.first_name} onChange={(v) => setContactDraft((d) => ({ ...d, first_name: v }))} placeholder="First name" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Last Name</p>
                    <ProfileInput value={contactDraft.last_name} onChange={(v) => setContactDraft((d) => ({ ...d, last_name: v }))} placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                  <ProfileInput value={contactDraft.email} onChange={(v) => setContactDraft((d) => ({ ...d, email: v }))} placeholder="email@example.com" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                  <p className="text-xs text-muted-foreground">{displayPhone || "Not set"}</p>
                </div>
              </>
            ) : (
              <>
                <FieldRow label="Name" value={displayName !== "User" ? displayName : null} />
                <FieldRow label="Email" value={displayEmail} />
                <FieldRow label="Phone" value={displayPhone} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="px-5 mb-2">
        <SectionCard
          title="Personal Information"
          icon={Briefcase}
          completeness={personalCompleteness}
          isOpen={openSection === "personal"}
          onToggle={() => toggleSection("personal")}
        >
          <div className="flex justify-end mb-1.5">
            <EditSaveBtn editing={editingPersonal} onEdit={() => setEditingPersonal(true)} onSave={savePersonal} />
          </div>
          {editingPersonal ? (
            <div className="space-y-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Occupation</p>
                <ProfileInput value={personalDraft.occupation} onChange={(v) => setPersonalDraft((d) => ({ ...d, occupation: v }))} placeholder="e.g. Software engineer" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Family Status</p>
                <ProfileInput value={personalDraft.family_status} onChange={(v) => setPersonalDraft((d) => ({ ...d, family_status: v }))} placeholder="e.g. Married, 2 kids" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Wealth Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Salary", "Business", "Inheritance/gift", "Investment returns", "One-off windfall"].map((s) => (
                    <ProfileChip
                      key={s}
                      label={s}
                      active={personalDraft.wealth_sources.includes(s)}
                      onClick={() =>
                        setPersonalDraft((d) => ({
                          ...d,
                          wealth_sources: d.wealth_sources.includes(s) ? d.wealth_sources.filter((x) => x !== s) : [...d.wealth_sources, s],
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Values / Exclusions</p>
                <ProfileInput value={personalDraft.personal_values} onChange={(v) => setPersonalDraft((d) => ({ ...d, personal_values: v }))} placeholder="e.g. ESG preferred" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Address</p>
                <ProfileInput value={personalDraft.address} onChange={(v) => setPersonalDraft((d) => ({ ...d, address: v }))} placeholder="Your address" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <FieldRow label="Occupation" value={pi?.occupation} />
              <FieldRow label="Family Status" value={pi?.family_status} />
              <FieldRow label="Wealth Sources" value={pi?.wealth_sources?.join(", ")} />
              <FieldRow label="Values" value={pi?.personal_values?.join(", ")} />
              <FieldRow label="Address" value={pi?.address} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Investment Profile */}
      <div className="px-5 mb-2">
        <SectionCard
          title="Investment Profile"
          icon={Target}
          completeness={investCompleteness}
          isOpen={openSection === "invest"}
          onToggle={() => toggleSection("invest")}
        >
          <div className="flex justify-end mb-1.5">
            <EditSaveBtn editing={editingInvestment} onEdit={() => setEditingInvestment(true)} onSave={saveInvestment} />
          </div>
          {editingInvestment ? (
            <div className="space-y-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Objectives</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Wealth Growth", "Retirement Planning", "Child's Education", "Home Purchase", "Emergency Fund", "Tax Efficiency", "Income Generation"].map((o) => (
                    <ProfileChip
                      key={o}
                      label={o}
                      active={investDraft.objectives.includes(o)}
                      onClick={() =>
                        setInvestDraft((d) => ({
                          ...d,
                          objectives: d.objectives.includes(o) ? d.objectives.filter((x) => x !== o) : [...d.objectives, o],
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Portfolio Value</p><ProfileInput value={investDraft.portfolio_value} onChange={(v) => setInvestDraft((d) => ({ ...d, portfolio_value: v }))} prefix="₹" /></div>
                <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Monthly Savings</p><ProfileInput value={investDraft.monthly_savings} onChange={(v) => setInvestDraft((d) => ({ ...d, monthly_savings: v }))} prefix="₹" /></div>
                <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Target Corpus</p><ProfileInput value={investDraft.target_corpus} onChange={(v) => setInvestDraft((d) => ({ ...d, target_corpus: v }))} prefix="₹" /></div>
                <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Timeline</p><ProfileInput value={investDraft.target_timeline} onChange={(v) => setInvestDraft((d) => ({ ...d, target_timeline: v }))} placeholder="e.g. 10 yrs" /></div>
                <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Annual Income</p><ProfileInput value={investDraft.annual_income} onChange={(v) => setInvestDraft((d) => ({ ...d, annual_income: v }))} prefix="₹" /></div>
                <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Retirement Age</p><ProfileInput value={investDraft.retirement_age} onChange={(v) => setInvestDraft((d) => ({ ...d, retirement_age: v }))} placeholder="e.g. 60" /></div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <FieldRow label="Objectives" value={ip?.objectives?.join(", ")} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <FieldRow label="Portfolio Value" value={fmt(ip?.portfolio_value)} />
                <FieldRow label="Monthly Savings" value={fmt(ip?.monthly_savings)} />
                <FieldRow label="Target Corpus" value={fmt(ip?.target_corpus)} />
                <FieldRow label="Timeline" value={ip?.target_timeline} />
                <FieldRow label="Annual Income" value={fmt(ip?.annual_income)} />
                <FieldRow label="Retirement Age" value={ip?.retirement_age?.toString()} />
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Risk Profile */}
      <div className="px-5 mb-2">
        <SectionCard
          title="Risk Profile"
          icon={Shield}
          completeness={riskCompleteness}
          isOpen={openSection === "risk"}
          onToggle={() => toggleSection("risk")}
        >
          <div className="flex justify-end mb-1.5">
            <EditSaveBtn editing={editingRisk} onEdit={() => setEditingRisk(true)} onSave={saveRisk} />
          </div>
          {editingRisk ? (
            <div className="space-y-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Risk Tolerance</p>
                <div className="flex flex-wrap gap-1.5">
                  {RISK_CATEGORIES.map((c, i) => (
                    <ProfileChip key={c} label={c} active={riskDraft.risk_level === i} onClick={() => setRiskDraft((d) => ({ ...d, risk_level: i }))} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Risk Capacity</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Low", "Medium", "High"].map((c) => (
                    <ProfileChip key={c} label={c} active={riskDraft.risk_capacity === c} onClick={() => setRiskDraft((d) => ({ ...d, risk_capacity: c }))} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Experience</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Beginner", "Intermediate", "Advanced", "Expert"].map((e) => (
                    <ProfileChip key={e} label={e} active={riskDraft.investment_experience === e} onClick={() => setRiskDraft((d) => ({ ...d, investment_experience: e }))} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Investment Horizon</p>
                <div className="flex flex-wrap gap-1.5">
                  {["0–5 years", "5–10 years", "10–15 years", "15–20 years", "20+ years"].map((h) => (
                    <ProfileChip key={h} label={h} active={riskDraft.investment_horizon === h} onClick={() => setRiskDraft((d) => ({ ...d, investment_horizon: h }))} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Reaction to 20% Drop</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Sell everything", "Reduce exposure", "Stay invested", "Buy more"].map((r) => (
                    <ProfileChip key={r} label={r} active={riskDraft.drop_reaction === r} onClick={() => setRiskDraft((d) => ({ ...d, drop_reaction: r }))} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Max Drawdown (%)</p>
                <ProfileInput value={riskDraft.max_drawdown} onChange={(v) => setRiskDraft((d) => ({ ...d, max_drawdown: v }))} placeholder="e.g. 25" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <FieldRow label="Risk Tolerance" value={rp?.risk_level != null ? RISK_CATEGORIES[rp.risk_level] : null} />
              <FieldRow label="Risk Category" value={rp?.risk_category} />
              <FieldRow label="Risk Capacity" value={rp?.risk_capacity} />
              <FieldRow label="Experience" value={rp?.investment_experience} />
              <FieldRow label="Horizon" value={rp?.investment_horizon} />
              <FieldRow label="Drop Reaction" value={rp?.drop_reaction} />
              <FieldRow label="Max Drawdown" value={pct(rp?.max_drawdown)} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Tax Profile */}
      <div className="px-5 mb-2">
        <SectionCard
          title="Tax Profile"
          icon={DollarSign}
          completeness={taxCompleteness}
          isOpen={openSection === "tax"}
          onToggle={() => toggleSection("tax")}
        >
          <div className="flex justify-end mb-1.5">
            <EditSaveBtn editing={editingTax} onEdit={() => setEditingTax(true)} onSave={saveTax} />
          </div>
          {editingTax ? (
            <div className="space-y-2">
              <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Income Tax Rate (%)</p><ProfileInput value={taxDraft.income_tax_rate} onChange={(v) => setTaxDraft((d) => ({ ...d, income_tax_rate: v }))} placeholder="e.g. 30" /></div>
              <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Capital Gains Tax Rate (%)</p><ProfileInput value={taxDraft.capital_gains_tax_rate} onChange={(v) => setTaxDraft((d) => ({ ...d, capital_gains_tax_rate: v }))} placeholder="e.g. 15" /></div>
              <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Notes</p><ProfileInput value={taxDraft.notes} onChange={(v) => setTaxDraft((d) => ({ ...d, notes: v }))} placeholder="e.g. NRI status" /></div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <FieldRow label="Income Tax Rate" value={pct(tp?.income_tax_rate)} />
              <FieldRow label="Capital Gains Tax" value={pct(tp?.capital_gains_tax_rate)} />
              <FieldRow label="Notes" value={tp?.notes} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Review Preferences */}
      <div className="px-5 mb-2">
        <SectionCard
          title="Review Preferences"
          icon={Clock}
          completeness={reviewCompleteness}
          isOpen={openSection === "review"}
          onToggle={() => toggleSection("review")}
        >
          <div className="flex justify-end mb-1.5">
            <EditSaveBtn editing={editingReview} onEdit={() => setEditingReview(true)} onSave={saveReview} />
          </div>
          {editingReview ? (
            <div className="space-y-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Review Frequency</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Monthly", "Quarterly", "Semi-annual"].map((f) => (
                    <ProfileChip key={f} label={f} active={reviewDraft.frequency === f} onClick={() => setReviewDraft((d) => ({ ...d, frequency: f }))} />
                  ))}
                </div>
              </div>
              <div><p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Update Process</p><ProfileInput value={reviewDraft.update_process} onChange={(v) => setReviewDraft((d) => ({ ...d, update_process: v }))} placeholder="How would you like updates?" /></div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <FieldRow label="Frequency" value={rv?.frequency} />
              <FieldRow label="Update Process" value={rv?.update_process} />
              {rv?.triggers?.length ? <FieldRow label="Triggers" value={rv.triggers.join(", ")} /> : null}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Navigation rows */}
      {([
        { icon: FileText, title: "Investment Policy Statement", sub: "Investment guidelines", route: "/profile/ips", showDot: false },
        { icon: User, title: "Tell Us More About You", sub: "Goals, risk tolerance & mandates", route: "/profile/complete", showDot: true },
        { icon: MessageSquareText, title: "Meeting Notes", sub: "Review past meeting transcripts", route: "/meeting-notes", showDot: false },
      ] as const).map((item) => (
        <div key={item.title} className="px-5 mb-1.5">
          <button
            onClick={() => navigate(item.route)}
            className="wealth-card !p-2.5 w-full text-left flex items-center gap-2.5 active:scale-[0.98] transition-transform"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <item.icon className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.showDot && (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(38, 80%, 48%)" }} />
              )}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </button>
        </div>
      ))}

      {/* Coming Soon items */}
      {([
        { icon: Users, title: "Family Members", sub: undefined },
        { icon: BarChart3, title: "Reports", sub: "Track performance & analytics" },
        { icon: Calculator, title: "Tax Optimisation", sub: "Smart tax-efficient strategies" },
      ]).map((item) => (
        <div key={item.title} className="px-5 mb-1.5">
          <div className="wealth-card !p-2.5 w-full flex items-center gap-2.5 opacity-60 cursor-default">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <item.icon className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
              {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
            </div>
            <Badge variant="secondary" className="text-[9px] font-medium shrink-0">Coming Soon</Badge>
          </div>
        </div>
      ))}

      {/* Sign Out */}
      <div className="px-5 mt-3 mb-4">
        <button
          onClick={() => {
            signOut();
            navigate("/");
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
