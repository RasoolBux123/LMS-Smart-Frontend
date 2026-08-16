"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import type { Role, User } from "@/types";

export function AppShell({
  role,
  user,
  children,
}: {
  role: Role;
  user: User;
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.localStorage.setItem("smartlms-role", role);
  }, [role]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Rail is hidden below `lg`; the mobile drawer lives inside Navbar. */}
      <Sidebar role={role} />

      {/*
        `min-w-0` is load-bearing: without it a wide table or a long
        unbroken string inside the main column forces the whole flex row
        wider than the viewport, which is what produced the horizontal
        scroll on phones.
      */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar role={role} user={user} />

        <motion.main
          key={role}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="page-padding min-w-0 flex-1"
        >
          {/* Caps line length on very wide monitors so text stays readable */}
          <div className="mx-auto w-full max-w-[100rem]">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}
