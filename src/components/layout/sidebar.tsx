"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { navFor, resolveActiveHref } from "@/constants/nav";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";



/**
 * Expanded width is 272px (was 248px). The nav now carries longer labels
 * — "Notifications", "Certificates", "Instructors" — plus an optional
 * badge pill, and 248px truncated several of them. 272px fits the longest
 * label with the badge and still leaves the content area room on a 1280px
 * laptop. Kept in sync with --sidebar-width in globals.css.
 */
// const WIDTH_EXPANDED = 272;

const WIDTH_EXPANDED = 280;
const WIDTH_COLLAPSED = 76;

// const WIDTH_COLLAPSED = 76;

const COLLAPSE_KEY = "smartlms-sidebar-collapsed";
const COLLAPSE_EVENT = "smartlms:sidebar-collapse";

/**
 * localStorage does not emit events in the tab that wrote to it, so `toggle`
 * dispatches a custom event and this subscribes to both that and the native
 * `storage` event (which covers changes made in another tab).
 */
function subscribeToCollapse(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const sections = navFor(role);
  const activeHref = resolveActiveHref(pathname, sections);

  /*
   * The collapse preference lives in localStorage, which is an external
   * store. Reading it in an effect would render once at the wrong width and
   * then snap; useSyncExternalStore reads it during render on the client
   * while still returning the server value (false) during SSR.
   */
  const collapsed = useSyncExternalStore(
    subscribeToCollapse,
    () => window.localStorage.getItem(COLLAPSE_KEY) === "true",
    () => false,
  );

  /* Skips the width animation on the very first client paint. */
  const [hydrated, setHydrated] = useState(false);

  const toggle = useCallback(() => {
    const next = !(window.localStorage.getItem(COLLAPSE_KEY) === "true");
    window.localStorage.setItem(COLLAPSE_KEY, String(next));
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
    setHydrated(true);
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED }}
      transition={
        hydrated ? { duration: 0.22, ease: "easeInOut" } : { duration: 0 }
      }
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
    >
      {/* Brand */}
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 px-5",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/xloopdigital_logo.jpg"
            alt="Xloop Digital Logo"
            width={40}
            height={40}
            className="h-full w-full object-contain"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[18px] font-semibold text-white">
              SmartLMS
            </p>

            <p className="text-[15px] capitalize text-sidebar-foreground-dim">
              {role} Workspace
            </p>
          </div>
        )}
      </div>
    

      {/* Navigation */}
      <nav
        className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-2"
        aria-label="Main navigation"
      >
        {sections.map((section, sectionIndex) => (
          <div key={section.title ?? `section-${sectionIndex}`} className="mb-1">
            {section.title &&
              (collapsed ? (
                <div
                  className="mx-auto my-2.5 h-px w-8   bg-sidebar-border"
                  aria-hidden
                />
              ) : (
                <p className="px-3 pb-1.5 pt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground-dim">
                  {section.title}
                </p>
              ))}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = activeHref === item.href;
                const Icon = item.icon;

                const link = (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-lg font-bold transition-colors",
                      active
                        ? "bg-sidebar-active text-sidebar-active-foreground"
                        : "text-sidebar-foreground hover:bg-white/[0.06] hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {/* Accent rail on the active item */}
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-rail"
                        className="absolute left-0 h-6 w-1 rounded-r-full bg-sidebar-accent"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        active && "text-sidebar-accent",
                      )}
                    />

                    {!collapsed && (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="shrink-0 rounded-full bg-sidebar-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-accent">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Badge shrinks to a dot when the rail is collapsed */}
                    {collapsed && item.badge && (
                      <span className="absolute right-3 top-2 h-1.5 w-1.5 rounded-full bg-sidebar-accent" />
                    )}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.label}
                          {item.badge ? ` · ${item.badge}` : ""}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-white/[0.06] hover:text-white",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground-dim transition-colors hover:bg-white/[0.06] hover:text-white",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <ChevronsLeft className="h-[18px] w-[18px] shrink-0" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside >
  );
}
