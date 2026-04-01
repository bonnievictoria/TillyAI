import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { discoverSimBankAccounts, syncSimBankAccounts, type SimBankDiscoveredAccount } from "@/lib/api";

interface AccountDiscoveryModalProps {
  open: boolean;
  onClose: () => void;
}

const AccountDiscoveryModal = ({ open, onClose }: AccountDiscoveryModalProps) => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<SimBankDiscoveredAccount[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [discovering, setDiscovering] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  const toggleAccount = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConsent = () => {
    (async () => {
      try {
        setSyncing(true);
        const accepted = Object.entries(selected)
          .filter(([, v]) => v)
          .map(([k]) => k);
        if (accepted.length === 0) {
          toast.error("Select at least one account to connect");
          return;
        }
        await syncSimBankAccounts(accepted);
        onClose();
        navigate("/link-accounts");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to sync accounts");
      } finally {
        setSyncing(false);
      }
    })();
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setDiscovering(true);
        const res = await discoverSimBankAccounts();
        if (cancelled) return;
        setAccounts(res.accounts);
        setSelected(Object.fromEntries(res.accounts.map((a) => [a.account_ref_no, true])));
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Failed to discover accounts");
      } finally {
        if (!cancelled) setDiscovering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

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
                <div className="text-xs text-muted-foreground" style={{ padding: "12px 14px" }}>
                  Fetching account details…
                </div>
              )}

              {!discovering &&
                accounts.map((account) => (
                  <label
                    key={account.account_ref_no}
                    className="flex cursor-pointer items-center justify-between rounded-lg border bg-background transition-colors hover:bg-accent/40"
                    style={{ padding: "12px 14px" }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground" style={{ fontSize: 13 }}>
                        {account.kind === "deposit"
                          ? "Bank account"
                          : account.kind === "equity"
                            ? "Equity account"
                            : "Mutual fund account"}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                        {account.kind === "deposit" ? "Ending" : account.kind === "equity" ? "Demat" : "Folio"} in {account.masked_identifier ?? "—"}
                      </span>
                      <span className="text-[11px] text-foreground/90 font-semibold" style={{ marginTop: 2 }}>
                        {account.kind === "deposit" ? "Balance" : "Current value"}: ₹
                        {account.current_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <Checkbox
                      id={`discovery-${account.account_ref_no}`}
                      checked={!!selected[account.account_ref_no]}
                      onCheckedChange={() => toggleAccount(account.account_ref_no)}
                    />
                  </label>
                ))}

              {!discovering && accounts.length === 0 && (
                <div className="text-xs text-muted-foreground" style={{ padding: "12px 14px" }}>
                  No simulator accounts found for this mobile number.
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleConsent}
              style={{ marginTop: 16 }}
              disabled={syncing || discovering || accounts.length === 0 || !anySelected}
            >
              {syncing ? "Connecting…" : "Give Consent & Connect"}
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
