"use client";

import { cn } from "@/lib/utils";

interface AttendanceRingProps {
    percentage: number; // 0-100
    size?: number;
    strokeWidth?: number;
    label?: string;
    className?: string;
}

/**
 * Circular ring for attendance percentage — same visual motif as DeadlineRing,
 * lekin static percentage ke sath (present/total).
 */
export function AttendanceRing({
    percentage,
    size = 96,
    strokeWidth = 8,
    label,
    className,
}: AttendanceRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const color =
        percentage >= 75
            ? "var(--success)"
            : percentage >= 50
                ? "var(--warning)"
                : "var(--danger)";

    return (
        <div className={cn("inline-flex flex-col items-center gap-2", className)}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 700ms ease-out, stroke 300ms" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-xl font-semibold" style={{ color }}>
                        {percentage}%
                    </span>
                </div>
            </div>
            {label && (
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
            )}
        </div>
    );
}