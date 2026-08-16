"use client";

import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// TODO: this is static data — once the backend AI risk-scoring endpoint
// is ready, fetch the real student list here.
const riskGroups = [
    {
        key: "high",
        label: "High Risk",
        count: 3,
        tone: "danger" as const,
        icon: AlertTriangle,
        description: "Low attendance, or several missed submissions.",
        students: [
            { name: "Ahmed Raza", note: "3 assignments late, 62% attendance" },
            { name: "Sara Khan", note: "2 quizzes missed" },
            { name: "Bilal Hussain", note: "Grades declining last 3 weeks" },
        ],
    },
    {
        key: "attention",
        label: "Needs Attention",
        count: 8,
        tone: "warning" as const,
        icon: AlertCircle,
        description: "Some submissions are late, or scores are below average.",
        students: [
            { name: "Ayesha Tariq", note: "1 assignment late" },
            { name: "Usman Ali", note: "Quiz average 58%" },
        ],
    },
    {
        key: "safe",
        label: "Safe Students",
        count: 40,
        tone: "success" as const,
        icon: CheckCircle2,
        description: "On track — consistent submissions and strong grades.",
        students: [],
    },
];

const toneVariant = {
    danger: "danger",
    warning: "warning",
    success: "success",
} as const;

export default function AiInsightsPage() {
    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-semibold">AI Insights</h1>
                    <Badge variant="accent">
                        <Sparkles className="h-3 w-3" /> AI
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Risk scored from student submission patterns and performance
                    analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {riskGroups.map((group) => {
                    const Icon = group.icon;
                    return (
                        <Card key={group.key}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            className={`h-4 w-4 text-${group.tone}`}
                                        />
                                        <p className="text-sm font-medium">{group.label}</p>
                                    </div>
                                    <Badge variant={toneVariant[group.tone]}>
                                        {group.count}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {group.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {riskGroups
                .filter((g) => g.students.length > 0)
                .map((group) => (
                    <Card key={group.key}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span
                                    className={`h-2 w-2 rounded-full bg-${group.tone}`}
                                />
                                {group.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {group.students.map((s) => (
                                <div
                                    key={s.name}
                                    className="flex flex-col gap-1 rounded-xl border border-transparent p-3 hover:border-border hover:bg-secondary/60 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <p className="text-sm font-medium">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{s.note}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
        </div>
    );
}