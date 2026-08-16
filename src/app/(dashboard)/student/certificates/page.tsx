"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificatePreview } from "@/features/certificates/certificate-preview";
import {
    downloadCertificate,
    listMyCertificates,
    verificationLink,
    type Certificate,
} from "@/lib/api/certificates";
import { errorMessage, formatDate } from "@/lib/utils";

export default function StudentCertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<Certificate | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await listMyCertificates();
            setCertificates(res.data);
        } catch (err: unknown) {
            setError(errorMessage(err, "Could not load your certificates."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function handleDownload(cert: Certificate) {
        try {
            await downloadCertificate(cert);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not download the PDF."));
        }
    }

    async function copyLink(cert: Certificate) {
        try {
            await navigator.clipboard.writeText(verificationLink(cert.serial));
            toast.success("Verification link copied — share it on your CV or LinkedIn.");
        } catch {
            toast.error(`Clipboard blocked. Your certificate number is ${cert.serial}.`);
        }
    }

    return (
        <div className="space-y-6">
            <header className="space-y-1">
                <h1 className="font-display font-bold">Certificates</h1>
                <p className="text-sm text-muted-foreground">
                    Every certificate carries a number and a QR code an employer can check
                    without signing in.
                </p>
            </header>

            {error && (
                <div className="flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-on-danger-soft sm:flex-row sm:items-center sm:justify-between">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={load}>
                        Try again
                    </Button>
                </div>
            )}

            {loading && (
                <div className="auto-grid">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-44 rounded-2xl" />
                    ))}
                </div>
            )}

            {!loading && certificates.length === 0 && !error && (
                <EmptyState
                    icon={Award}
                    title="No certificates yet"
                    description="Finish a course and your instructor's admin will issue one. It'll show up here."
                />
            )}

            {!loading && certificates.length > 0 && (
                <div className="auto-grid">
                    {certificates.map((cert) => (
                        <article
                            key={cert.id}
                            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 card-shadow"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="truncate text-base font-semibold">
                                        {cert.courseTitle}
                                    </h2>
                                    {cert.programTitle && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {cert.programTitle}
                                        </p>
                                    )}
                                </div>
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-on-primary-soft">
                                    <Award className="h-5 w-5" />
                                </span>
                            </div>

                            <dl className="grid grid-cols-3 gap-2 rounded-xl bg-secondary/40 px-3 py-2 text-center">
                                <div>
                                    <dt className="text-[0.65rem] uppercase text-faint-foreground">
                                        Grade
                                    </dt>
                                    <dd className="text-sm font-bold text-primary">{cert.grade}</dd>
                                </div>
                                <div>
                                    <dt className="text-[0.65rem] uppercase text-faint-foreground">
                                        Score
                                    </dt>
                                    <dd className="text-sm font-bold text-primary">
                                        {cert.percentage.toFixed(0)}%
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[0.65rem] uppercase text-faint-foreground">
                                        Issued
                                    </dt>
                                    <dd className="text-sm font-bold text-primary">
                                        {cert.issuedAt ? formatDate(cert.issuedAt) : "—"}
                                    </dd>
                                </div>
                            </dl>

                            <p className="font-mono text-xs text-muted-foreground">
                                {cert.serial}
                            </p>

                            <div className="mt-auto flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => handleDownload(cert)}>
                                    <Download className="h-4 w-4" /> Download
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPreview(cert)}
                                >
                                    Preview
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => copyLink(cert)}>
                                    <Copy className="h-4 w-4" /> Share
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{preview?.courseTitle}</DialogTitle>
                        <DialogDescription>
                            Certificate no. {preview?.serial}
                        </DialogDescription>
                    </DialogHeader>

                    {preview && <CertificatePreview certificate={preview} />}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => preview && copyLink(preview)}>
                            <Copy className="h-4 w-4" /> Copy link
                        </Button>
                        <Button onClick={() => preview && handleDownload(preview)}>
                            <Download className="h-4 w-4" /> Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
