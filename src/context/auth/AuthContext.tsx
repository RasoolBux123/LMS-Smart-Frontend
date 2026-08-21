"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { loginRequest, type AuthUser } from "@/lib/api/auth";
import type { Role } from "@/types";

export type { Role };
export type User = AuthUser;

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  /**
   * Signs in with email + password. The account's own role decides which
   * workspace the user lands in — there is no portal to pick.
   */
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const STORAGE_TOKEN = "token";
const STORAGE_USER = "user";

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  instructor: "/instructor",
  student: "/student",
};

function cookieOptions() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `path=/; max-age=604800; SameSite=Lax${secure}`;
}

function setAuthCookies(role: Role, token: string) {
  const opts = cookieOptions();
  // encodeURIComponent — JWT contains "=" which breaks raw cookies
  document.cookie = `role=${encodeURIComponent(role)}; ${opts}`;
  document.cookie = `token=${encodeURIComponent(token)}; ${opts}`;
}

function clearAuthCookies() {
  document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore the session from localStorage on reload. */
  useEffect(() => {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN);
      const savedUser = localStorage.getItem(STORAGE_USER);

      if (token && savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        setUser(parsed);
        setAuthCookies(parsed.role, token);
      } else {
        clearAuthCookies();
      }
    } catch {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
      clearAuthCookies();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginRequest(email, password);
      const token = res.token ?? (res as { access_token?: string }).access_token;
      const loggedUser = res.user;

      if (!token || !loggedUser) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem(STORAGE_TOKEN, token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(loggedUser));
      setAuthCookies(loggedUser.role, token);

      setUser(loggedUser);
      router.replace(ROLE_HOME[loggedUser.role] ?? "/student");
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    clearAuthCookies();

    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}