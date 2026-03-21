import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Pencil, Check, FileText, ChevronRight, MessageSquareText, Calculator, BarChart3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { updateMe } from "@/lib/api";

const Profile = () => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState({
    phone: "+44 7700 900123",
    email: "bonnievictoria@gmail.com",
    address: "12 Kensington Palace Gardens, London W8",
  });

  useEffect(() => {
    if (user) {
      setContact((prev) => ({
        phone: `${user.country_code} ${user.mobile}`,
        email: user.email ?? prev.email,
        address: prev.address,
      }));
    }
  }, [user]);

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Bonnie Victoria";
  const displayEmail = user?.email ?? contact.email;

  const handleToggleEdit = async () => {
    if (editing) {
      try {
        await updateMe({ email: contact.email || undefined });
        await refresh();
      } catch {
        // silent
      }
    }
    setEditing(!editing);
  };

  return (
    <div className="mobile-container bg-background pb-16 min-h-screen">
      <div className="px-5 pt-8 pb-2">
        <h1 className="text-base font-semibold text-foreground">Profile</h1>
      </div>

      {/* Profile header */}
      <div className="px-5 flex flex-col items-center pt-1 mb-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-1.5"
        >
          <User className="h-5 w-5 text-muted-foreground" />
        </motion.div>
        <p className="text-sm font-semibold text-foreground">{displayName}</p>
        <p className="text-[11px] text-muted-foreground">{displayEmail}</p>
      </div>

      {/* Contact Information */}
      <div className="px-5 mb-2">
        <div className="wealth-card !p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-foreground">Contact Information</h3>
            <button
              onClick={handleToggleEdit}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {editing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
              {editing ? "Save" : "Edit"}
            </button>
          </div>
          <div className="space-y-1.5">
            {([
              { label: "Phone", key: "phone" as const },
              { label: "Email", key: "email" as const },
              { label: "Address", key: "address" as const },
            ]).map((field) => (
              <div key={field.key}>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">{field.label}</p>
                {editing ? (
                  <input
                    value={contact[field.key]}
                    onChange={(e) => setContact((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none focus:border-primary transition-colors"
                  />
                ) : (
                  <p className="text-xs text-foreground">{contact[field.key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Option rows */}
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

      <BottomNav />
    </div>
  );
};

export default Profile;
