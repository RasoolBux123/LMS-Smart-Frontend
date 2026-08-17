"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Button> & {
    loading?: boolean;
    loadingText?: string;
    idleText?: string;
};

export function SubmitButton({
    loading = false,
    loadingText = "Saving…",
    idleText,
    children,
    className,
    disabled,
    ...props
}: Props) {
    return (
        <Button
            type="button"
            disabled={disabled || loading}
            className={cn("min-w-[140px]", className)}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                idleText ?? children
            )}
        </Button>
    );
}