"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

const ROLE_HOME = {
  admin: "/admin",
  instructor: "/instructor",
  student: "/student",
} as const;

const AVATAR_COLOR = {
  admin: "#B45309",
  instructor: "#4338CA",
  student: "#0D9488",
} as const;

/** Routes that are open to every role. */
const SHARED_ROUTES = ["/notifications", "/profile", "/settings"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const home = ROLE_HOME[user.role];
    const allowed =
      SHARED_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`)) ||
      pathname === home ||
      pathname.startsWith(`${home}/`);

    if (!allowed) router.replace(home);
  }, [loading, user, pathname, router]);

  /** Maps the AuthContext user onto the User shape AppShell/Navbar expects. */
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!user || !shellUser) return null;

  return (
    <AppShell role={user.role} user={shellUser}>
      {children}
    </AppShell>
  );
}
