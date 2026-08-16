"use client";

import { BadgeCheck } from "lucide-react";
import type { Certificate, CertificateTemplate } from "@/lib/api/certificates";
import { cn, formatDate } from "@/lib/utils";

/**
 * A screen replica of the printed PDF. Same content, same order, so what the
 * admin approves here is what the student downloads.
 */

const FRAMES: Record<CertificateTemplate, string> = {
    classic: "from-[#c9a227] to-[#e7cf7a]",
    modern: "from-primary to-[#8b93f8]",
    elegant: "from-accent to-[#5eead4]",
};

export function CertificatePreview({
    certificate,
    className,
}: {
    certificate: Pick<
        Certificate,
        | "serial"
        | "studentName"
        | "courseTitle"
        | "programTitle"
        | "instructorName"
        | "issuedByName"
        | "grade"
        | "percentage"
        | "completedAt"
        | "issuedAt"
        | "template"
        | "status"
    >;
    className?: string;
}) {
    const revoked = certificate.status === "revoked";

    return (
        <div
            className={cn(
                "rounded-2xl bg-gradient-to-br p-[3px] card-shadow",
                FRAMES[certificate.template] ?? FRAMES.classic,
                className,
            )}
        >
            <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-surface px-6 py-8 text-center sm:px-10">
                {revoked && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <span className="-rotate-12 text-5xl font-black tracking-widest text-danger/15">
                            REVOKED
                        </span>
                    </div>
                )}

                <p className="text-xs font-semibold tracking-[0.3em] text-foreground-soft">
                    SMARTLMS
                </p>
                <p className="mt-1 text-xs text-faint-foreground">
                    Mari Energies Bootcamp · Xloop Digital
                </p>

                <h3 className="mt-6 font-display text-xl font-bold uppercase tracking-wide text-primary sm:text-2xl">
                    Certificate of Completion
                </h3>
                <div className="mx-auto mt-2 h-px w-24 bg-border-strong" />

                <p className="mt-6 text-xs italic text-muted-foreground">
                    This is to certify that
                </p>
                <p className="mt-2 border-b border-border pb-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
                    {certificate.studentName}
                </p>

                <p className="mt-4 text-xs text-muted-foreground">
                    has successfully completed the course
                </p>
                <p className="mt-1 text-base font-bold text-primary sm:text-lg">
                    {certificate.courseTitle}
                </p>
                {certificate.programTitle && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                        under the {certificate.programTitle} program
                    </p>
                )}

                <dl className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                    {[
                        ["Grade", certificate.grade || "—"],
                        ["Score", `${certificate.percentage.toFixed(1)}%`],
                        [
                            "Completed",
                            certificate.completedAt ? formatDate(certificate.completedAt) : "—",
                        ],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-[0.65rem] uppercase tracking-wide text-faint-foreground">
                                {label}
                            </dt>
                            <dd className="text-sm font-bold text-primary">{value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="mt-8 flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1 border-t border-border pt-2">
                        <p className="truncate text-xs font-semibold">
                            {certificate.instructorName || "—"}
                        </p>
                        <p className="text-[0.65rem] uppercase tracking-wide text-faint-foreground">
                            Course instructor
                        </p>
                    </div>

                    <div className="grid shrink-0 place-items-center rounded-full border-2 border-[#c9a227] bg-primary-soft p-3">
                        <BadgeCheck className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1 border-t border-border pt-2">
                        <p className="truncate text-xs font-semibold">
                            {certificate.issuedByName || "—"}
                        </p>
                        <p className="text-[0.65rem] uppercase tracking-wide text-faint-foreground">
                            Program director
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-[0.7rem] text-muted-foreground">
                    Certificate No.{" "}
                    <span className="font-mono font-semibold text-foreground">
                        {certificate.serial}
                    </span>
                    {certificate.issuedAt && ` · Issued ${formatDate(certificate.issuedAt)}`}
                </p>
            </div>
        </div>
    );
}