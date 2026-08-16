import {
  FileText,
  FileImage,
  FileArchive,
  File as FileGeneric,
} from "lucide-react";
import type { FileKind } from "@/types";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  FileKind,
  { icon: React.ElementType; bg: string; fg: string; label: string }
  > = {
  pdf: { icon: FileText, bg: "bg-danger-soft", fg: "text-danger", label: "PDF" },
  docx: { icon: FileText, bg: "bg-info-soft", fg: "text-info", label: "DOCX" },
  image: {
    icon: FileImage,
      bg: "bg-success-soft",
        fg: "text-success",
          label: "Image",
  },
  zip: {
    icon: FileArchive,
      bg: "bg-warning-soft",
        fg: "text-warning",
          label: "ZIP",
  },
  other: {
    icon: FileGeneric,
      bg: "bg-secondary",
        fg: "text-muted-foreground",
          label: "File",
  },
};

export function FileTypeIcon({
  kind,
  className,
}: {
  kind: FileKind;
  className?: string;
}) {
  const meta = kindMeta[kind];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        meta.bg,
        className,
      )}
    >
      <Icon className={cn("h-4.5 w-4.5", meta.fg)} />
    </div>
  );
}

export function fileKindLabel(kind: FileKind) {
  return kindMeta[kind].label;
}

export function guessFileKind(fileName: string): FileKind {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext && ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ext && ["zip", "rar", "7z"].includes(ext)) return "zip";
  return "other";
}


// import {
//   FileText,
//   FileImage,
//   FileArchive,
//   File as FileGeneric,
// } from "lucide-react";
// import type { FileKind } from "@/types";
// import { cn } from "@/lib/utils";

// const kindMeta: Record<
//   FileKind,
//   { icon: React.ElementType; bg: string; fg: string; label: string }
// > = {
//   pdf: {
//     icon: FileText,
//     bg: "bg-danger-soft",
//     fg: "text-danger",
//     label: "PDF",
//   },
//   docx: { icon: FileText, bg: "bg-info-soft", fg: "text-info", label: "DOCX" },
//   image: {
//     icon: FileImage,
//     bg: "bg-success-soft",
//     fg: "text-success",
//     label: "Image",
//   },
//   zip: {
//     icon: FileArchive,
//     bg: "bg-warning-soft",
//     fg: "text-warning",
//     label: "ZIP",
//   },
//   other: {
//     icon: FileGeneric,
//     bg: "bg-secondary",
//     fg: "text-muted-foreground",
//     label: "File",
//   },
// };

// export function FileTypeIcon({
//   kind,
//   className,
// }: {
//   kind: FileKind;
//   className?: string;
// }) {
//   const meta = kindMeta[kind];
//   const Icon = meta.icon;
//   return (
//     <div
//       className={cn(
//         "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
//         meta.bg,
//         className,
//       )}
//     >
//       <Icon className={cn("h-4.5 w-4.5", meta.fg)} />
//     </div>
//   );
// }

// export function fileKindLabel(kind: FileKind) {
//   return kindMeta[kind].label;
// }

// export function guessFileKind(fileName: string): FileKind {
//   const ext = fileName.split(".").pop()?.toLowerCase();
//   if (ext === "pdf") return "pdf";
//   if (ext === "doc" || ext === "docx") return "docx";
//   if (ext && ["png", "jpg", "jpeg", "gif", "webp"].includes(ext))
//     return "image";
//   if (ext && ["zip", "rar", "7z"].includes(ext)) return "zip";
//   return "other";
// }
