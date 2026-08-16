import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Each soft background pairs with its own `on-*-soft` foreground so the
        // text keeps AA contrast in BOTH themes. Using `text-primary` on
        // `bg-primary-soft` fell under 4.5:1 once dark mode lightened primary.
        default: "border-transparent bg-primary-soft text-on-primary-soft",
        accent: "border-transparent bg-accent-soft text-on-accent-soft",
        success: "border-transparent bg-success-soft text-on-success-soft",
        warning: "border-transparent bg-warning-soft text-on-warning-soft",
        danger: "border-transparent bg-danger-soft text-on-danger-soft",
        info: "border-transparent bg-info-soft text-on-info-soft",
        outline: "border-border text-foreground bg-transparent",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
