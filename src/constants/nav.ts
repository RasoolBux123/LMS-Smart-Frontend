import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  UserCircle,
  GraduationCap,
  ClipboardList,
  ClipboardCheck,
  FolderKanban,
  BookOpen,
  BarChart3,
  Bell,
  CalendarCheck2,
  CalendarDays,
  Award,
  Sparkles,
  Layers,
  ShieldCheck,
  Presentation,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional pill badge, e.g. "NEW" — rendered next to the label. */
  badge?: string;
}

export interface NavSection {
  /** Omit the title for the first group so it sits flush under the logo. */
  title?: string;
  items: NavItem[];
}

/**
 * Routes follow the (dashboard) route group: the dashboard home is
 * `/student` and `/instructor`, not `/xyz/dashboard`.
 */
export const studentNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/student", icon: LayoutDashboard },
      // { label: "Programs", href: "/student/programs", icon: Layers },
      { label: "My Courses", href: "/student/courses", icon: BookOpen },
    ],
  },
  {
    title: "Learning",
    items: [
      { label: "Assignments", href: "/student/assignments", icon: FileText },
      { label: "Quizzes", href: "/student/quizzes", icon: ClipboardList },
      { label: "Exams", href: "/student/exams", icon: ClipboardCheck },
      { label: "Projects", href: "/student/projects", icon: FolderKanban },
      { label: "Attendance", href: "/student/attendance", icon: CalendarCheck2 },
      { label: "Calendar", href: "/student/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Progress",
    items: [
      { label: "Grades", href: "/student/grades", icon: GraduationCap },
      { label: "Certificates", href: "/student/certificates", icon: Award },
      { label: "Insights", href: "/student/insights", icon: BarChart3 },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const instructorNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/instructor", icon: LayoutDashboard },
      // { label: "Programs", href: "/instructor/programs", icon: Layers },
      { label: "Courses", href: "/instructor/courses", icon: BookOpen },
    ],
  },
  {
    title: "Teaching",
    items: [
      { label: "Assignments", href: "/instructor/assignments", icon: FileText },
      { label: "Quizzes", href: "/instructor/quizzes", icon: ClipboardList },
      { label: "Exams", href: "/instructor/exams", icon: ClipboardCheck },
      { label: "Projects", href: "/instructor/projects", icon: FolderKanban },
      { label: "Attendance", href: "/instructor/attendance", icon: CalendarCheck2 },
      { label: "Calendar", href: "/instructor/clander", icon: CalendarDays },
    ],
  },
  {
    title: "Assessment",
    items: [
      { label: "Submissions", href: "/instructor/submissions", icon: Presentation },
      { label: "Grading", href: "/instructor/grading", icon: Award },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Students", href: "/instructor/students", icon: Users },
      {
        label: "AI Insights",
        href: "/instructor/ai-insights",
        icon: Sparkles,
        badge: "NEW",
      },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const adminNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Academics",
    items: [
      // { label: "Programs", href: "/admin/programs", icon: Layers },
      { label: "Courses", href: "/admin/courses", icon: BookOpen },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
    ],
  },
  {
    title: "People",
    items: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Admins", href: "/admin/admins", icon: ShieldCheck },
      { label: "Instructors", href: "/admin/instructors", icon: Presentation },
      { label: "Students", href: "/admin/students", icon: GraduationCap },
      { label: "Credentials", href: "/admin/credentials", icon: KeyRound },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function navFor(role: Role): NavSection[] {
  if (role === "admin") return adminNav;
  if (role === "instructor") return instructorNav;
  return studentNav;
}

/** Every href in a nav tree, flattened. */
export function flattenNav(sections: NavSection[]): NavItem[] {
  return sections.flatMap((section) => section.items);
}

/**
 * Resolves which single nav item should be highlighted.
 *
 * A plain `pathname.startsWith(href)` check keeps "Dashboard" (`/admin`)
 * lit on every child route, so two items glow at once. Instead we take the
 * LONGEST href the current path sits under — `/admin/users/42` matches both
 * `/admin` and `/admin/users`, and `/admin/users` wins.
 *
 * Returns the winning href, or null when nothing matches.
 */
export function resolveActiveHref(
  pathname: string,
  sections: NavSection[],
): string | null {
  let best: string | null = null;

  for (const item of flattenNav(sections)) {
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (matches && (best === null || item.href.length > best.length)) {
      best = item.href;
    }
  }

  return best;
}
