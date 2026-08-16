"use client";

import { useMemo, useState } from "react";
import type { FileKind } from "@/types/assignment";

interface FileUploadProps {
  onFileSelect?: (file: File | null) => void;
  title?: string;
  /** Form ki maxFileSizeMb value. Default 25. */
  maxSizeMb?: number;
  /** File types the form accepts. When provided, the dropdown is limited to these. */
  allowedKinds?: FileKind[];
}

const fileTypes = [
  { value: "pdf", label: "PDF", accept: ".pdf", kind: "pdf" as FileKind },
  {
    value: "word",
    label: "DOC / DOCX",
    accept: ".doc,.docx",
    kind: "docx" as FileKind,
  },
  {
    value: "image",
    label: "Image",
    accept: ".png,.jpg,.jpeg,.webp,.gif",
    kind: "image" as FileKind,
  },
  {
    value: "excel",
    label: "Excel",
    accept: ".xls,.xlsx",
    kind: "other" as FileKind,
  },
  {
    value: "powerpoint",
    label: "PowerPoint",
    accept: ".ppt,.pptx",
    kind: "other" as FileKind,
  },
  { value: "text", label: "TXT", accept: ".txt", kind: "other" as FileKind },
  { value: "zip", label: "ZIP", accept: ".zip", kind: "zip" as FileKind },
  { value: "other", label: "Other", accept: "*", kind: "other" as FileKind },
];

export default function FileUpload({
  onFileSelect,
  title = "Attachment",
  maxSizeMb = 25,
  allowedKinds,
}: FileUploadProps) {
  const types = useMemo(() => {
    if (!allowedKinds || allowedKinds.length === 0) return fileTypes;
    const filtered = fileTypes.filter((t) => allowedKinds.includes(t.kind));
    return filtered.length > 0 ? filtered : fileTypes;
  }, [allowedKinds]);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState(types[0].value);

  const currentType =
    types.find((type) => type.value === selectedType) ?? types[0];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.slice(selected.name.lastIndexOf(".")).toLowerCase();

    const allowedExtensions =
      currentType?.accept?.split(",").map((x) => x.trim()) || [];

    if (currentType.value !== "other" && !allowedExtensions.includes(ext)) {
      setFile(null);
      setError(`Invalid file type. Please upload ${currentType.label} file only.`);
      onFileSelect?.(null);
      return;
    }

    if (selected.size > maxSizeMb * 1024 * 1024) {
      setFile(null);
      setError(`File size must be less than ${maxSizeMb} MB.`);
      onFileSelect?.(null);
      return;
    }

    setError("");
    setFile(selected);
    onFileSelect?.(selected);
  };

  return (
    <div className="rounded-xl border border-dashed border-border-strong p-4 space-y-4">
      <p className="text-sm font-medium">📎 {title}</p>

      <div className="space-y-2">
        <label className="text-sm">Select File Type</label>

        <select
          value={currentType.value}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setFile(null);
            setError("");
            onFileSelect?.(null);
          }}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-border p-5 hover:bg-muted/30">
        <span className="text-sm">Upload File</span>
        <span className="mt-1 text-xs text-muted-foreground">
          {currentType.label} only (Max {maxSizeMb}MB)
        </span>

        <input
          className="hidden"
          type="file"
          accept={currentType.accept}
          onChange={handleFile}
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          ❌ {error}
        </div>
      )}

      {file && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm">
          <p className="text-green-400">✓ File Ready</p>
          <p>📄 {file.name}</p>
          <p className="text-xs text-muted-foreground">
            Type: {currentType.label}
            <br />
            Size: {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
}
