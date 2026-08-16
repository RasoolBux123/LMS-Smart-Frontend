"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Award,
    Copy,
    Download,
    Eye,
    ImagePlus,
    MoreHorizontal,
    RotateCcw,
    ShieldOff,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
    AdminHeader,
    ErrorNote,
    Pagination,
    SearchField,
    TableRowsSkeleton,
    UserAvatar,
    exportToCsv,
} from "@/features/admin/parts";
import { CertificatePreview } from "@/features/certificates/certificate-preview";
import {
    bulkIssueCertificates,
    deleteCertificate,
    downloadCertificate,
    getEligibleStudents,
    listCertificates,
    restoreCertificate,
    revokeCertificate,
    uploadCertificateLogo,
    verificationLink,
    type Certificate,
    type CertificateTemplate,
    type EligibleStudent,
} from "@/lib/api/certificates";
import { listCourses, type Course } from "@/lib/api/courses";
import { cn, errorMessage, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

const TEMPLATES: { value: CertificateTemplate; label: string; hint: string }[] = [
    { value: "classic", label: "Classic", hint: "Gold frame, formal diploma look" },
    { value: "modern", label: "Modern", hint: "Indigo frame, minimal" },
    { value: "elegant", label: "Elegant", hint: "Teal frame with gold accents" },
];

function ScorePill({ value }: { value: number }) {
    return (
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-on-primary-soft">
            {value.toFixed(1)}%
        </span>
    );
}

function CertificateStatusBadge({ status }: { status: Certificate["status"] }) {
    return (
        <span
            className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                status === "issued"
                    ? "bg-success-soft text-on-success-soft"
                    : "bg-danger-soft text-on-danger-soft",
            )}
        >
            {status === "issued" ? "Issued" : "Revoked"}
        </span>
    );
}

export function CertificatesManager() {
    const [tab, setTab] = useState<"issue" | "issued">("issue");
    const [courses, setCourses] = useState<Course[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* issue tab */
    const [courseId, setCourseId] = useState("");
    const [template, setTemplate] = useState<CertificateTemplate>("classic");
    const [students, setStudents] = useState<EligibleStudent[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [issuing, setIssuing] = useState(false);

    /* issued tab */
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);

    /* dialogs */
    const [preview, setPreview] = useState<Certificate | null>(null);
    const [revoking, setRevoking] = useState<Certificate | null>(null);
    const [revokeReason, setRevokeReason] = useState("");
    const [pendingDelete, setPendingDelete] = useState<Certificate | null>(null);
    const logoInput = useRef<HTMLInputElement | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [certRes, courseRes] = await Promise.all([
                listCertificates(),
                listCourses(),
            ]);
            setCertificates(certRes.data);
            setCourses(courseRes.data);
            if (!courseId && courseRes.data.length > 0) {
                setCourseId(courseRes.data[0].id);
            }
        } catch (err: unknown) {
            setError(errorMessage(err, "Could not load certificates."));
        } finally {
            setLoading(false);
        }
        // courseId is only used to seed the first selection
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const loadStudents = useCallback(async () => {
        if (!courseId) return;
        setLoadingStudents(true);
        try {
            const res = await getEligibleStudents(courseId);
            setStudents(res.data.students);
            // Pre-tick everyone who doesn't already hold one — the admin can untick.
            setSelected(
                res.data.students
                    .filter((s) => !s.certificateId)
                    .map((s) => s.studentId),
            );
        } catch (err: unknown) {
            setStudents([]);
            toast.error(errorMessage(err, "Could not load this course's students."));
        } finally {
            setLoadingStudents(false);
        }
    }, [courseId]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    const counts = useMemo(
        () => ({
            total: certificates.length,
            issued: certificates.filter((c) => c.status === "issued").length,
            revoked: certificates.filter((c) => c.status === "revoked").length,
        }),
        [certificates],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return certificates
            .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
            .filter(
                (c) =>
                    !q ||
                    c.studentName.toLowerCase().includes(q) ||
                    c.studentEmail.toLowerCase().includes(q) ||
                    c.serial.toLowerCase().includes(q) ||
                    c.courseTitle.toLowerCase().includes(q),
            );
    }, [certificates, search, statusFilter]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const issuable = students.filter((s) => !s.certificateId);
    const allSelected =
        issuable.length > 0 && issuable.every((s) => selected.includes(s.studentId));

    /* ------------------------------- actions ------------------------------- */

    function toggleStudent(studentId: string) {
        setSelected((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId],
        );
    }

    async function handleIssue() {
        if (selected.length === 0) return;
        setIssuing(true);
        try {
            const res = await bulkIssueCertificates({
                courseId,
                studentIds: selected,
                template,
            });
            const { issued, skipped } = res.data;
            setCertificates((prev) => [...issued, ...prev]);
            setSelected([]);
            await loadStudents();

            if (issued.length > 0) {
                toast.success(
                    `${issued.length} certificate${issued.length === 1 ? "" : "s"} issued`,
                );
            }
            if (skipped.length > 0) {
                toast.warning(
                    `${skipped.length} skipped — ${skipped[0].name}: ${skipped[0].reason}`,
                );
            }
            if (issued.length === 0 && skipped.length === 0) {
                toast.info("Nothing to issue for this selection.");
            }
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not issue the certificates."));
        } finally {
            setIssuing(false);
        }
    }

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
            toast.success("Verification link copied");
        } catch {
            toast.error("Clipboard blocked — copy the certificate number instead.");
        }
    }

    async function confirmRevoke() {
        if (!revoking) return;
        try {
            const res = await revokeCertificate(revoking.id, revokeReason);
            setCertificates((prev) =>
                prev.map((c) => (c.id === res.data.id ? res.data : c)),
            );
            toast.success(`${revoking.serial} revoked`);
            await loadStudents();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not revoke the certificate."));
        } finally {
            setRevoking(null);
            setRevokeReason("");
        }
    }

    async function handleRestore(cert: Certificate) {
        try {
            const res = await restoreCertificate(cert.id);
            setCertificates((prev) =>
                prev.map((c) => (c.id === res.data.id ? res.data : c)),
            );
            toast.success(`${cert.serial} is active again`);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not restore the certificate."));
        }
    }

    async function confirmDelete() {
        if (!pendingDelete) return;
        const target = pendingDelete;
        try {
            await deleteCertificate(target.id);
            setCertificates((prev) => prev.filter((c) => c.id !== target.id));
            toast.success(`${target.serial} deleted`);
            await loadStudents();
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not delete the certificate."));
        } finally {
            setPendingDelete(null);
        }
    }

    async function handleLogo(file: File | undefined) {
        if (!file) return;
        try {
            await uploadCertificateLogo(file);
            toast.success("Logo updated — new certificates will carry it.");
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not upload the logo."));
        }
    }

    function handleExport() {
        exportToCsv(
            `smartlms-certificates-${new Date().toISOString().slice(0, 10)}.csv`,
            filtered.map((c) => ({
                Certificate: c.serial,
                Student: c.studentName,
                Email: c.studentEmail,
                Course: c.courseTitle,
                Grade: c.grade,
                Score: `${c.percentage}%`,
                Status: c.status,
                Issued: c.issuedAt ? formatDate(c.issuedAt) : "",
            })),
        );
    }

    /* -------------------------------- render ------------------------------- */

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Certificates"
                description={`${counts.issued} active · ${counts.revoked} revoked · every certificate carries a QR code anyone can verify.`}
            >
                <input
                    ref={logoInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => handleLogo(e.target.files?.[0])}
                />
                <Button variant="outline" onClick={() => logoInput.current?.click()}>
                    <ImagePlus className="h-4 w-4" /> Change logo
                </Button>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={certificates.length === 0}
                >
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </AdminHeader>

            {error && <ErrorNote message={error} onRetry={load} />}

            <Tabs value={tab} onValueChange={(v) => setTab(v as "issue" | "issued")}>
                <TabsList>
                    <TabsTrigger value="issue">Issue certificates</TabsTrigger>
                    <TabsTrigger value="issued">Issued ({counts.total})</TabsTrigger>
                </TabsList>
            </Tabs>

            {tab === "issue" ? (
                <div className="space-y-4">
                    <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 card-shadow sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select value={courseId} onValueChange={setCourseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pick a course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Design</Label>
                            <Select
                                value={template}
                                onValueChange={(v) => setTemplate(v as CertificateTemplate)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {TEMPLATES.find((t) => t.value === template)?.hint}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            {loadingStudents
                                ? "Working out each student's grade…"
                                : `${students.length} student${students.length === 1 ? "" : "s"} enrolled · ${issuable.length} without a certificate yet.`}
                        </p>
                        <Button
                            onClick={handleIssue}
                            disabled={selected.length === 0 || issuing || loadingStudents}
                        >
                            <Award className="h-4 w-4" />
                            {issuing
                                ? "Issuing…"
                                : `Issue ${selected.length || ""} certificate${selected.length === 1 ? "" : "s"}`}
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={allSelected}
                                            aria-label="Select every student"
                                            onCheckedChange={(checked) =>
                                                setSelected(
                                                    checked ? issuable.map((s) => s.studentId) : [],
                                                )
                                            }
                                        />
                                    </TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead className="hidden md:table-cell">Grade</TableHead>
                                    <TableHead className="hidden lg:table-cell">Graded</TableHead>
                                    <TableHead>Certificate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingStudents && <TableRowsSkeleton rows={5} cols={6} />}

                                {!loadingStudents && students.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="p-0">
                                            <EmptyState
                                                icon={Award}
                                                title="No students on this course yet"
                                                description="Enrol students from the Students page, then come back to issue their certificates."
                                                className="border-0"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loadingStudents &&
                                    students.map((s) => {
                                        const held = Boolean(s.certificateId);
                                        return (
                                            <TableRow key={s.studentId}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selected.includes(s.studentId)}
                                                        disabled={held}
                                                        aria-label={`Select ${s.name}`}
                                                        onCheckedChange={() => toggleStudent(s.studentId)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar name={s.name} role="student" />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium">{s.name}</p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {s.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <ScorePill value={s.percentage} />
                                                </TableCell>
                                                <TableCell className="hidden font-medium md:table-cell">
                                                    {s.grade}
                                                </TableCell>
                                                <TableCell className="hidden text-muted-foreground lg:table-cell">
                                                    {s.gradedItems}/{s.totalItems}
                                                </TableCell>
                                                <TableCell>
                                                    {held ? (
                                                        <span className="font-mono text-xs text-muted-foreground">
                                                            {s.certificateSerial}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-on-success-soft">Ready</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <SearchField
                            value={search}
                            onChange={setSearch}
                            placeholder="Search name, email or certificate number…"
                            className="sm:w-80"
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="sm:w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="issued">Issued</SelectItem>
                                <SelectItem value="revoked">Revoked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead className="hidden md:table-cell">Course</TableHead>
                                    <TableHead>Certificate no.</TableHead>
                                    <TableHead className="hidden lg:table-cell">Grade</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden lg:table-cell">Issued</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRowsSkeleton rows={6} cols={7} />}

                                {!loading && pageRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0">
                                            <EmptyState
                                                icon={Award}
                                                title={
                                                    search || statusFilter !== "all"
                                                        ? "No matches found"
                                                        : "No certificates issued yet"
                                                }
                                                description={
                                                    search || statusFilter !== "all"
                                                        ? "Try a different search or filter."
                                                        : "Switch to the Issue tab, pick a course and award the first one."
                                                }
                                                className="border-0"
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading &&
                                    pageRows.map((c) => (
                                        <TableRow
                                            key={c.id}
                                            className="cursor-pointer"
                                            onClick={() => setPreview(c)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar name={c.studentName} role="student" />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium">{c.studentName}</p>
                                                        <p className="truncate text-xs text-muted-foreground md:hidden">
                                                            {c.courseTitle}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden text-muted-foreground md:table-cell">
                                                {c.courseTitle}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{c.serial}</TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {c.grade} · {c.percentage.toFixed(0)}%
                                            </TableCell>
                                            <TableCell>
                                                <CertificateStatusBadge status={c.status} />
                                            </TableCell>
                                            <TableCell className="hidden text-muted-foreground lg:table-cell">
                                                {c.issuedAt ? formatDate(c.issuedAt) : "—"}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Actions for ${c.serial}`}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setPreview(c)}>
                                                            <Eye className="h-4 w-4" /> Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDownload(c)}
                                                            disabled={c.status === "revoked"}
                                                        >
                                                            <Download className="h-4 w-4" /> Download PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => copyLink(c)}>
                                                            <Copy className="h-4 w-4" /> Copy verification link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {c.status === "issued" ? (
                                                            <DropdownMenuItem onClick={() => setRevoking(c)}>
                                                                <ShieldOff className="h-4 w-4" /> Revoke
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleRestore(c)}>
                                                                <RotateCcw className="h-4 w-4" /> Restore
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="text-danger focus:text-danger"
                                                            onClick={() => setPendingDelete(c)}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>

                        {!loading && (
                            <Pagination
                                page={page}
                                pageCount={pageCount}
                                total={filtered.length}
                                onChange={setPage}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* preview */}
            <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Certificate {preview?.serial}</DialogTitle>
                        <DialogDescription>
                            {preview?.status === "revoked"
                                ? `Revoked — ${preview?.revokedReason || "no reason recorded"}`
                                : "This is what the student downloads and what the QR code verifies."}
                        </DialogDescription>
                    </DialogHeader>

                    {preview && <CertificatePreview certificate={preview} />}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => preview && copyLink(preview)}>
                            <Copy className="h-4 w-4" /> Copy link
                        </Button>
                        <Button
                            onClick={() => preview && handleDownload(preview)}
                            disabled={preview?.status === "revoked"}
                        >
                            <Download className="h-4 w-4" /> Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* revoke */}
            <Dialog
                open={Boolean(revoking)}
                onOpenChange={(open) => {
                    if (!open) {
                        setRevoking(null);
                        setRevokeReason("");
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Revoke {revoking?.serial}?</DialogTitle>
                        <DialogDescription>
                            The student loses access to the PDF and the verification page will
                            report this certificate as revoked. You can restore it later.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="revoke-reason">Reason (shown to admins only)</Label>
                        <Textarea
                            id="revoke-reason"
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            placeholder="e.g. Issued against the wrong course"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevoking(null)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRevoke}>Revoke certificate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(open) => !open && setPendingDelete(null)}
                title="Delete this certificate?"
                description={`${pendingDelete?.serial ?? "This certificate"} and its PDF will be removed permanently. Revoke instead if you want the record to stay auditable.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
            />
        </div>
    );
}