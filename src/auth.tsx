import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export interface AuthUser {
  id: number;
  citizenId: string;
  name: string;
  email: string;
  role: "citizen" | "verifier";
}

interface Auth {
  user: AuthUser | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<Auth | null>(null);

export function useAuth(): Auth {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On page load, ask the server whether we still have a valid session.
  useEffect(() => {
    api<{ user: AuthUser }>("/api/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function signup(name: string, email: string, password: string) {
    const r = await api<{ user: AuthUser }>("/api/auth/signup", { method: "POST", body: { name, email, password } });
    setUser(r.user);
  }

  async function login(email: string, password: string) {
    const r = await api<{ user: AuthUser }>("/api/auth/login", { method: "POST", body: { email, password } });
    setUser(r.user);
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }

  return <AuthCtx.Provider value={{ user, loading, signup, login, logout }}>{children}</AuthCtx.Provider>;
}
