"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { initials, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import type { Role, User, Notification } from "@/types";

export function Navbar({ role, user }: { role: Role; user: User }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Live notifications from API
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications({ limit: 20 });
      setNotifications(res.data ?? []);
      setUnread(res.unreadCount ?? 0);
    } catch (err) {
      console.warn("[notifications] fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 60_000);
    return () => clearInterval(id);
  }, [loadNotifications]);

  const handleMarkRead = async (n: Notification) => {
    if (n.read) return;
    try {
      await markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => !/^[a-z]?-?\d+$/i.test(s) || s.length < 3);

  return (
    <>
      <MobileSidebar
        role={role}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground lg:flex"
        >
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              <span
                className={cn(
                  "capitalize",
                  i === crumbs.length - 1 && "font-medium text-foreground",
                )}
              >
                {c.replace(/-/g, " ")}
              </span>
            </span>
          ))}
        </nav>

        <div className="relative ml-auto hidden w-full max-w-xs md:block" />

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search"
          aria-expanded={searchOpen}
        >
          <Search className="h-[18px] w-[18px]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-[18px] w-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[18px] w-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>

        {/* Notifications bell */}
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) loadNotifications();
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between px-2.5 py-1.5 text-xs">
              Notifications
              <div className="flex items-center gap-2">
                {unread > 0 && <Badge variant="danger">{unread} new</Badge>}
                {unread > 0 && (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMarkAllRead();
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 && (
                <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              )}
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
                  onClick={() => {
                    handleMarkRead(n);
                    if (n.link && typeof window !== "undefined") {
                      window.location.href = n.link;
                    }
                  }}
                >
                  <div className="flex w-full items-center gap-2">
                    {!n.read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className="text-sm font-medium">{n.title}</span>
                  </div>
                  <span className="pl-3.5 text-xs text-muted-foreground">
                    {n.body}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-secondary">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  style={{
                    backgroundColor: `${user.avatarColor}1A`,
                    color: user.avatarColor,
                  }}
                >
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium xs:inline">
                {user.name.split(" ")[0]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="px-2.5 py-1.5">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserCircle className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={logout}>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {searchOpen && (
        <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search assignments, courses…"
              aria-label="Search"
              className="pl-9"
            />
          </div>
        </div>
      )}
    </>
  );
}

















// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useTheme } from "next-themes";
// import {
//   Menu,
//   Search,
//   Bell,
//   Moon,
//   Sun,
//   ChevronRight,
//   LogOut,
//   Settings,
//   UserCircle,
// } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
// import { Badge } from "@/components/ui/badge";
// import { MobileSidebar } from "@/components/layout/mobile-sidebar";
// import { notifications } from "@/data/notifications";
// import { initials, cn } from "@/lib/utils";
// import { useAuth } from "@/hooks/useAuth";
// import type { Role, User } from "@/types";

// export function Navbar({ role, user }: { role: Role; user: User }) {
//   const pathname = usePathname();
//   const { theme, setTheme } = useTheme();
//   const { logout } = useAuth();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [searchOpen, setSearchOpen] = useState(false);
//   const unread = notifications.filter((n) => !n.read).length;

//   const crumbs = pathname
//     .split("/")
//     .filter(Boolean)
//     .filter((s) => !/^[a-z]?-?\d+$/i.test(s) || s.length < 3);

//   return (
//     <>
//       <MobileSidebar
//         role={role}
//         open={mobileOpen}
//         onOpenChange={setMobileOpen}
//       />
//       <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
//         <Button
//           variant="ghost"
//           size="icon"
//           className="lg:hidden"
//           onClick={() => setMobileOpen(true)}
//         >
//           <Menu className="h-5 w-5" />
//         </Button>

//         <nav
//           aria-label="Breadcrumb"
//           className="hidden min-w-0 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground lg:flex"
//         >
//           {crumbs.map((c, i) => (
//             <span key={i} className="flex items-center gap-1.5">
//               {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
//               <span
//                 className={cn(
//                   "capitalize",
//                   i === crumbs.length - 1 && "font-medium text-foreground",
//                 )}
//               >
//                 {c.replace(/-/g, " ")}
//               </span>
//             </span>
//           ))}
//         </nav>

//         {/* Full search field from `md` up */}
//         <div className="relative ml-auto hidden w-full max-w-xs md:block">
//           {/* <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> */}
//           {/* <Input
//             placeholder="Search assignments, courses…"
//             aria-label="Search"
//             className="pl-9"
//           /> */}
//         </div>

//         {/* Below `md` the field would crowd out the avatar and bell, so it
//             collapses to a toggle that reveals a full-width row underneath. */}
//         <Button
//           variant="ghost"
//           size="icon"
//           className="ml-auto md:hidden"
//           onClick={() => setSearchOpen((v) => !v)}
//           aria-label="Search"
//           aria-expanded={searchOpen}
//         >
//           <Search className="h-[18px] w-[18px]" />
//         </Button>

//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//           aria-label="Toggle theme"
//         >
//           <Sun className="h-[18px] w-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
//           <Moon className="absolute h-[18px] w-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
//         </Button>

//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="relative"
//               aria-label="Notifications"
//             >
//               <Bell className="h-[18px] w-[18px]" />
//               {unread > 0 && (
//                 <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
//                   {unread}
//                 </span>
//               )}
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-80">
//             <DropdownMenuLabel className="flex items-center justify-between px-2.5 py-1.5 text-xs">
//               Notifications
//               {unread > 0 && <Badge variant="danger">{unread} new</Badge>}
//             </DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <div className="max-h-80 overflow-y-auto scrollbar-thin">
//               {notifications.length === 0 && (
//                 <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
//                   No notifications yet.
//                 </p>
//               )}
//               {notifications.map((n) => (
//                 <DropdownMenuItem
//                   key={n.id}
//                   className="flex flex-col items-start gap-0.5 py-2.5"
//                 >
//                   <div className="flex w-full items-center gap-2">
//                     {!n.read && (
//                       <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
//                     )}
//                     <span className="text-sm font-medium">{n.title}</span>
//                   </div>
//                   <span className="pl-3.5 text-xs text-muted-foreground">
//                     {n.body}
//                   </span>
//                 </DropdownMenuItem>
//               ))}
//             </div>
//           </DropdownMenuContent>
//         </DropdownMenu>

//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <button className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-secondary">
//               <Avatar className="h-8 w-8">
//                 <AvatarFallback
//                   style={{
//                     backgroundColor: `${user.avatarColor}1A`,
//                     color: user.avatarColor,
//                   }}
//                 >
//                   {initials(user.name)}
//                 </AvatarFallback>
//               </Avatar>
//               <span className="hidden text-sm font-medium xs:inline">
//                 {user.name.split(" ")[0]}
//               </span>
//             </button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-56">
//             <DropdownMenuLabel className="px-2.5 py-1.5">
//               <p className="text-sm font-medium">{user.name}</p>
//               <p className="text-xs font-normal text-muted-foreground">
//                 {user.email}
//               </p>
//             </DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild>
//               <Link href="/profile">
//                 <UserCircle className="h-4 w-4" /> Profile
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem asChild>
//               <Link href="/settings">
//                 <Settings className="h-4 w-4" /> Settings
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem destructive onClick={logout}>
//               <LogOut className="h-4 w-4" /> Log out
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </header>

//       {/* Mobile search row */}
//       {searchOpen && (
//         <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md md:hidden">
//           <div className="relative">
//             <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               autoFocus
//               placeholder="Search assignments, courses…"
//               aria-label="Search"
//               className="pl-9"
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// }





// // "use client";

// // import { useState } from "react";
// // import Link from "next/link";
// // import { usePathname } from "next/navigation";
// // import { useTheme } from "next-themes";
// // import {
// //   Menu,
// //   Search,
// //   Bell,
// //   Moon,
// //   Sun,
// //   ChevronRight,
// //   LogOut,
// //   Settings,
// //   UserCircle,
// // } from "lucide-react";
// // import { Input } from "@/components/ui/input";
// // import { Button } from "@/components/ui/button";
// // import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// // import {
// //   DropdownMenu,
// //   DropdownMenuTrigger,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// //   DropdownMenuLabel,
// //   DropdownMenuSeparator,
// // } from "@/components/ui/dropdown-menu";
// // import { Badge } from "@/components/ui/badge";
// // import { MobileSidebar } from "@/components/layout/mobile-sidebar";
// // import { notifications } from "@/data/notifications";
// // import { initials, cn } from "@/lib/utils";
// // import { useAuth } from "@/hooks/useAuth";
// // import type { Role, User } from "@/types";

// // export function Navbar({ role, user }: { role: Role; user: User }) {
// //   const pathname = usePathname();
// //   const { theme, setTheme } = useTheme();
// //   const { logout } = useAuth();
// //   const [mobileOpen, setMobileOpen] = useState(false);
// //   const [searchOpen, setSearchOpen] = useState(false);
// //   const unread = notifications.filter((n) => !n.read).length;

// //   const crumbs = pathname
// //     .split("/")
// //     .filter(Boolean)
// //     .filter((s) => !/^[a-z]?-?\d+$/i.test(s) || s.length < 3);

// //   return (
// //     <>
// //       <MobileSidebar
// //         role={role}
// //         open={mobileOpen}
// //         onOpenChange={setMobileOpen}
// //       />
// //       <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
// //         <Button
// //           variant="ghost"
// //           size="icon"
// //           className="lg:hidden"
// //           onClick={() => setMobileOpen(true)}
// //         >
// //           <Menu className="h-5 w-5" />
// //         </Button>

// //         <nav
// //           aria-label="Breadcrumb"
// //           className="hidden min-w-0 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground lg:flex"
// //         >
// //           {crumbs.map((c, i) => (
// //             <span key={i} className="flex items-center gap-1.5">
// //               {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
// //               <span
// //                 className={cn(
// //                   "capitalize",
// //                   i === crumbs.length - 1 && "font-medium text-foreground",
// //                 )}
// //               >
// //                 {c.replace(/-/g, " ")}
// //               </span>
// //             </span>
// //           ))}
// //         </nav>

// //         {/* Full search field from `md` up */}
// //         <div className="relative ml-auto hidden w-full max-w-xs md:block">
// //           {/* <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> */}
// //           {/* <Input
// //             placeholder="Search assignments, courses…"
// //             aria-label="Search"
// //             className="pl-9"
// //           /> */}
// //         </div>

// //         {/* Below `md` the field would crowd out the avatar and bell, so it
// //             collapses to a toggle that reveals a full-width row underneath. */}
// //         <Button
// //           variant="ghost"
// //           size="icon"
// //           className="ml-auto md:hidden"
// //           onClick={() => setSearchOpen((v) => !v)}
// //           aria-label="Search"
// //           aria-expanded={searchOpen}
// //         >
// //           <Search className="h-[18px] w-[18px]" />
// //         </Button>

// //         <Button
// //           variant="ghost"
// //           size="icon"
// //           onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
// //           aria-label="Toggle theme"
// //         >
// //           <Sun className="h-[18px] w-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
// //           <Moon className="absolute h-[18px] w-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
// //         </Button>

// //         <DropdownMenu>
// //           <DropdownMenuTrigger asChild>
// //             <Button
// //               variant="ghost"
// //               size="icon"
// //               className="relative"
// //               aria-label="Notifications"
// //             >
// //               <Bell className="h-[18px] w-[18px]" />
// //               {unread > 0 && (
// //                 <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
// //                   {unread}
// //                 </span>
// //               )}
// //             </Button>
// //           </DropdownMenuTrigger>
// //           <DropdownMenuContent align="end" className="w-80">
// //             <DropdownMenuLabel className="flex items-center justify-between px-2.5 py-1.5 text-xs">
// //               Notifications
// //               {unread > 0 && <Badge variant="danger">{unread} new</Badge>}
// //             </DropdownMenuLabel>
// //             <DropdownMenuSeparator />
// //             <div className="max-h-80 overflow-y-auto scrollbar-thin">
// //               {notifications.length === 0 && (
// //                 <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
// //                   No notifications yet.
// //                 </p>
// //               )}
// //               {notifications.map((n) => (
// //                 <DropdownMenuItem
// //                   key={n.id}
// //                   className="flex flex-col items-start gap-0.5 py-2.5"
// //                 >
// //                   <div className="flex w-full items-center gap-2">
// //                     {!n.read && (
// //                       <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
// //                     )}
// //                     <span className="text-sm font-medium">{n.title}</span>
// //                   </div>
// //                   <span className="pl-3.5 text-xs text-muted-foreground">
// //                     {n.body}
// //                   </span>
// //                 </DropdownMenuItem>
// //               ))}
// //             </div>
// //           </DropdownMenuContent>
// //         </DropdownMenu>

// //         <DropdownMenu>
// //           <DropdownMenuTrigger asChild>
// //             <button className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-secondary">
// //               <Avatar className="h-8 w-8">
// //                 <AvatarFallback
// //                   style={{
// //                     backgroundColor: `${user.avatarColor}1A`,
// //                     color: user.avatarColor,
// //                   }}
// //                 >
// //                   {initials(user.name)}
// //                 </AvatarFallback>
// //               </Avatar>
// //               <span className="hidden text-sm font-medium xs:inline">
// //                 {user.name.split(" ")[0]}
// //               </span>
// //             </button>
// //           </DropdownMenuTrigger>
// //           <DropdownMenuContent align="end" className="w-56">
// //             <DropdownMenuLabel className="px-2.5 py-1.5">
// //               <p className="text-sm font-medium">{user.name}</p>
// //               <p className="text-xs font-normal text-muted-foreground">
// //                 {user.email}
// //               </p>
// //             </DropdownMenuLabel>
// //             <DropdownMenuSeparator />
// //             <DropdownMenuItem asChild>
// //               <Link href="/profile">
// //                 <UserCircle className="h-4 w-4" /> Profile
// //               </Link>
// //             </DropdownMenuItem>
// //             <DropdownMenuItem asChild>
// //               <Link href="/settings">
// //                 <Settings className="h-4 w-4" /> Settings
// //               </Link>
// //             </DropdownMenuItem>
// //             <DropdownMenuSeparator />
// //             <DropdownMenuItem destructive onClick={logout}>
// //               <LogOut className="h-4 w-4" /> Log out
// //             </DropdownMenuItem>
// //           </DropdownMenuContent>
// //         </DropdownMenu>
// //       </header>

// //       {/* Mobile search row */}
// //       {searchOpen && (
// //         <div className="sticky top-16 z-20 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md md:hidden">
// //           <div className="relative">
// //             <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
// //             <Input
// //               autoFocus
// //               placeholder="Search assignments, courses…"
// //               aria-label="Search"
// //               className="pl-9"
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </>
// //   );
// // }
