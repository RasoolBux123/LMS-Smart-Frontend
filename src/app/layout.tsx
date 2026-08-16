import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "SmartLMS",
    template: "%s · SmartLMS",
  },
  description: "Intelligent Learning Management Platform",
};

/**
 * `width=device-width` is what makes a phone render at its own width instead
 * of pretending to be a ~980px desktop and shrinking the page. `viewportFit`
 * lets the layout reach under the notch, which pairs with the safe-area
 * padding in globals.css.
 *
 * maximumScale is deliberately left unset — pinch-zoom stays available.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b16" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Fonts load via <link> rather than `next/font/google`: that helper
          needs fonts.googleapis.com at build time, so builds fail on an
          offline or blocked network. The font names are already present in
          the --font-display / --font-body stacks in globals.css.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
