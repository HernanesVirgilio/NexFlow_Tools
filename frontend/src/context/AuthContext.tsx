import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import i18n from '../i18n';
import { tokenStore } from '../services/api';
import { authService } from '../services/auth.service';
import type { CurrentUser } from '../services/types';
import { useTheme } from './ThemeContext';

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: CurrentUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setPreference } = useTheme();
  const restored = useRef(false);

  const syncPreferences = useCallback(
    (u: CurrentUser) => {
      if (u.language && i18n.language !== u.language) void i18n.changeLanguage(u.language);
      if (u.theme) setPreference(u.theme);
    },
    [setPreference],
  );

  const setUser = useCallback(
    (u: CurrentUser) => {
      setUserState(u);
      syncPreferences(u);
    },
    [syncPreferences],
  );

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    authService
      .restore()
      .then((u) => {
        if (u) setUser(u);
      })
      .finally(() => setLoading(false));
  }, [setUser]);

  // If a refresh fails mid-session, drop the user back to the login screen.
  useEffect(() => {
    tokenStore.onAuthLost(() => setUserState(null));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => setUser(await authService.login({ email, password })),
    [setUser],
  );
  const register = useCallback(
    async (name: string, email: string, password: string) =>
      setUser(await authService.register({ name, email, password })),
    [setUser],
  );
  const logout = useCallback(async () => {
    await authService.logout();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
