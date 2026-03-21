import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  getToken,
  clearToken,
  type UserInfo,
} from "@/lib/api";

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  authenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  authenticated: false,
  refresh: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, loading, authenticated: !!user, refresh, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
