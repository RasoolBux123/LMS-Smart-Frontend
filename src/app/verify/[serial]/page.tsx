"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, SearchX, ShieldOff } from "lucide-react";
import {
    verifyCertificate,
    type CertificateVerification,
} from "@/lib/api/certificates";
import { formatDate } from "@/lib/utils";

/**
 * Public route — no token, no layout chrome. This is what an employer lands on
 * after scanning the QR code, so it answers one question first: is it real?
 */

type State =
    | { kind: "loading" }
    | { kind: "found"; certificate: CertificateVerification }
    | { kind: "missing" };

export default function VerifyCertificatePage({
    params,
}: {
    params: Promise<{ serial: string }>;
}) {
    const { serial } = use(params);
    const [state, setState] = useState<State>({ kind: "loading" });

    useEffect(() => {
        let cancelled = false;
        verifyCertificate(serial)
            .then((res) => {
                if (!cancelled) setState({ kind: "found", certificate: res.data });
            })
            .catch(() => {
                if (!cancelled) setState({ kind: "missing" });
            });
        return () => {
            cancelled = true;
        };
    }, [serial]);

    return (
        <main className="hero-grid min-h-screen bg-background px-4 py-16">
            <div className="mx-auto max-w-xl space-y-6">
                <div className="text-center">
                    <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">
                        SMARTLMS
                    </p>
                    <h1 className="mt-2 font-display font-bold">Certificate verification</h1>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">{serial}</p>
                </div>

                {state.kind === "loading" && (
                    <div className="glass-card grid place-items-center gap-3 rounded-2xl p-12 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">Checking the register…</p>
                    </div>
                )}

                {state.kind === "missing" && (
                    <div className="glass-card space-y-3 rounded-2xl p-10 text-center">
                        <SearchX className="mx-auto h-10 w-10 text-danger" />
                        <h2 className="text-lg font-semibold">No record for this number</h2>
                        <p className="text-sm text-muted-foreground">
                            Check the certificate number for typos — it looks like
                            SLMS-2026-XXXXXX. If it still doesn&apos;t resolve, this document
                            was not issued by SmartLMS.
                        </p>
                    </div>
                )}

                {state.kind === "found" && (
                    <VerificationCard certificate={state.certificate} />
                )}

                <p className="text-center text-xs text-muted-foreground">
                    <Link href="/" className="underline underline-offset-4">
                        SmartLMS
                    </Link>{" "}
                    · Mari Energies Bootcamp · Xloop Digital
                </p>
            </div>
        </main>
    );
}

function VerificationCard({
    certificate,
}: {
    certificate: CertificateVerification;
}) {
    const valid = certificate.valid;

    const rows: [string, string][] = [
        ["Awarded to", certificate.studentName],
        ["Course", certificate.courseTitle],
        ...((certificate.programTitle
            ? [["Program", certificate.programTitle]]
            : []) as [string, string][]),
        ["Instructor", certificate.instructorName || "—"],
        ["Grade", `${certificate.grade} · ${certificate.percentage.toFixed(1)}%`],
        [
            "Completed",
            certificate.completedAt ? formatDate(certificate.completedAt) : "—",
        ],
        ["Issued", certificate.issuedAt ? formatDate(certificate.issuedAt) : "—"],
    ];

    return (
        <div className="glass-card overflow-hidden rounded-2xl">
            <div
                className={
                    valid
                        ? "flex items-center gap-3 bg-success-soft px-6 py-5 text-on-success-soft"
                        : "flex items-center gap-3 bg-danger-soft px-6 py-5 text-on-danger-soft"
                }
            >
                {valid ? (
                    <BadgeCheck className="h-8 w-8 shrink-0" />
                ) : (
                    <ShieldOff className="h-8 w-8 shrink-0" />
                )}
                <div>
                    <p className="text-base font-bold">
                        {valid ? "Valid certificate" : "This certificate was revoked"}
                    </p>
                    <p className="text-sm">
                        {valid
                            ? "Issued by SmartLMS and active on the register."
                            : certificate.revokedAt
                                ? `Withdrawn on ${formatDate(certificate.revokedAt)}. It is no longer a valid credential.`
                                : "It is no longer a valid credential."}
                    </p>
                </div>
            </div>

            <dl className="divide-y divide-border">
                {rows.map(([label, value]) => (
                    <div
                        key={label}
                        className="flex flex-col gap-1 px-6 py-3 sm:flex-row sm:items-baseline sm:justify-between"
                    >
                        <dt className="text-xs uppercase tracking-wide text-faint-foreground">
                            {label}
                        </dt>
                        <dd className="text-sm font-medium sm:text-right">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
