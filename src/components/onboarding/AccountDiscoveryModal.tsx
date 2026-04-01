import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { discoverSimBankAccounts, syncSimBankAccounts, type SimBankDiscoveredAccount } from "@/lib/api";

interface AccountDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
}

function accountKey(a: SimBankDiscoveredAccount): string {
  return a.account_ref_no;
}

const AccountDiscoveryModal = ({ open, onClose }: AccountDiscoveryModalProps) => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SimBankDiscoveredAccount[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [discovering, setDiscovering] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDiscovering(true);
    discoverSimBankAccounts()
      .then((res) => {
        setAccounts(res.accounts);
        setSelected(Object.fromEntries(res.accounts.map((a) => [accountKey(a), true])));
      })
      .catch(() => {
        toast.error("Could not load accounts. Try again.");
        setAccounts([]);
      })
      .finally(() => setDiscovering(false));
  }, [open]);

  const toggleAccount = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConsent = async () => {
    const accepted = accounts.filter((a) => selected[accountKey(a)]).map((a) => a.account_ref_no);
    if (accepted.length === 0) {
      toast.error("Select at least one account to connect.");
      return;
    }
    setSyncing(true);
    try {
      await syncSimBankAccounts(accepted);
      toast.success("Accounts linked.");
      onClose();
      navigate("/link-accounts");
    } catch {
      toast.error("Could not sync accounts. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  const labelForKind = (a: SimBankDiscoveredAccount) => {
    if (a.kind === "mutual_fund") return "Mutual fund";
    if (a.kind === "equity") return "Equity (Demat)";
    return "Bank account";
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-card shadow-xl"
            style={{
              width: "88%",
              maxWidth: 340,
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-opacity hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-medium text-foreground" style={{ fontSize: 17 }}>
              We found your accounts
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 4 }}>
              Linked via Account Aggregator
            </p>

            <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
              {discovering && (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading accounts…</span>
                </div>
              )}
              {!discovering &&
                accounts.map((account) => {
                  const key = accountKey(account);
                  const masked = account.masked_identifier ?? "—";
                  return (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center justify-between rounded-lg border bg-background transition-colors hover:bg-accent/40"
                      style={{ padding: "12px 14px" }}
                      htmlFor={`discovery-${key}`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium text-foreground" style={{ fontSize: 13 }}>
                          {account.provider_name}
                        </span>
                        <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                          {labelForKind(account)} · {masked}
                        </span>
                      </div>
                      <Checkbox
                        id={`discovery-${key}`}
                        checked={!!selected[key]}
                        onCheckedChange={() => toggleAccount(key)}
                      />
                    </label>
                  );
                })}
              {!discovering && accounts.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No accounts found for this number.</p>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={syncing || discovering || accounts.length === 0}
              onClick={handleConsent}
              style={{ marginTop: 16 }}
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting…
                </>
              ) : (
                "Give Consent & Connect"
              )}
            </Button>

            <p
              className="text-center text-muted-foreground"
              style={{ fontSize: 11, marginTop: 12 }}
            >
              🔒 Powered by RBI Account Aggregator framework
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccountDiscoveryModal;
