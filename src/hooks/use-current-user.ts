"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Role, User } from "@/types";

const AVATAR_COLOR: Record<Role, string> = {
  admin: "#B45309",
  instructor: "#4338CA",
  student: "#0D9488",
};

/**
 * Logged-in user ko AppShell / Navbar / profile pages wale `User` shape me
 * This used to be `useDemoRole`, which pulled a fake role from localStorage;
 * it now reads the real user from AuthContext.
 */
export function useCurrentUser(): { role: Role; user: User | null } {
  const { user } = useAuth();

  const shellUser = useMemo<User | null>(() => {
    if (!user) return null;
    return {
      id: user.id ?? user.email,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: AVATAR_COLOR[user.role],
    };
  }, [user]);

  return { role: user?.role ?? "student", user: shellUser };
}
