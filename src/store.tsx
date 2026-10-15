import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import { IssueCase, Transaction } from "./types";

interface NewReport {
  category: string;
  description: string;
  location: string;
  incidentAt: string;
  mediaCount: number;
}

interface Store {
  ledger: Transaction[];
  cases: IssueCase[];
  balance: number;
  refresh: () => Promise<void>;
  addReport: (r: NewReport) => Promise<string>;
  redeem: (rewardId: string) => Promise<void>;
  appeal: (txId: string) => Promise<void>;
}

const StoreCtx = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

// Holds the signed-in person's reports and ledger, loaded from the server.
export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [cases, setCases] = useState<IssueCase[]>([]);
  const [balance, setBalance] = useState(0);

  const refresh = useCallback(async () => {
    const [r, l] = await Promise.all([
      api<{ reports: IssueCase[] }>("/api/reports"),
      api<{ ledger: Transaction[]; balance: number }>("/api/ledger"),
    ]);
    setCases(r.reports);
    setLedger(l.ledger);
    setBalance(l.balance);
  }, []);

  useEffect(() => {
    if (user) {
      refresh().catch(() => undefined);
    } else {
      setLedger([]);
      setCases([]);
      setBalance(0);
    }
  }, [user, refresh]);

  async function addReport(r: NewReport): Promise<string> {
    const res = await api<{ report: IssueCase }>("/api/reports", { method: "POST", body: r });
    await refresh();
    return res.report.id;
  }

  async function redeem(rewardId: string): Promise<void> {
    await api(`/api/rewards/${rewardId}/redeem`, { method: "POST" });
    await refresh();
  }

  async function appeal(txId: string): Promise<void> {
    await api(`/api/ledger/${txId}/appeal`, { method: "POST" }).catch(() => undefined);
    await refresh();
  }

  return (
    <StoreCtx.Provider value={{ ledger, cases, balance, refresh, addReport, redeem, appeal }}>
      {children}
    </StoreCtx.Provider>
  );
}
