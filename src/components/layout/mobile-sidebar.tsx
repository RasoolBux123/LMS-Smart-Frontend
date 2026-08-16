"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { navFor, resolveActiveHref } from "@/constants/nav";
import { useAuth } from "@/hooks/useAuth";

export function MobileSidebar({
  role,
  open,
  onOpenChange,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const sections = navFor(role);
  const activeHref = resolveActiveHref(pathname, sections);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 lg:hidden" />
        {/*
          Width caps at 86vw so the drawer never covers the whole screen on
          a 320px phone — the sliver of dimmed page behind it is what tells
          people they can tap outside to dismiss.
        */}
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex h-full w-[min(18rem,86vw)] flex-col bg-sidebar text-sidebar-foreground animate-in slide-in-from-left duration-200 lg:hidden">
          <DialogPrimitive.Title className="sr-only">
            Navigation
          </DialogPrimitive.Title>

          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent/20">
                <GraduationCap className="h-5 w-5 text-sidebar-accent" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-white">
                  SmartLMS
                </p>
                <p className="truncate text-[11px] capitalize text-sidebar-foreground-dim">
                  {role} workspace
                </p>
              </div>
            </div>
            <DialogPrimitive.Close className="tap-target flex items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-white/[0.06]">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <nav
            className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-2"
            aria-label="Main navigation"
          >
            {sections.map((section, sectionIndex) => (
              <div
                key={section.title ?? `section-${sectionIndex}`}
                className="mb-1"
              >
                {section.title && (
                  <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground-dim">
                    {section.title}
                  </p>
                )}

                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = activeHref === item.href;
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => onOpenChange(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-sidebar-active text-sidebar-active-foreground"
                              : "text-sidebar-foreground hover:bg-white/[0.06] hover:text-white",
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 h-6 w-1 rounded-r-full bg-sidebar-accent" />
                          )}
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0",
                              active && "text-sidebar-accent",
                            )}
                          />
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className="shrink-0 rounded-full bg-sidebar-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-accent">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-sidebar-border p-3">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
