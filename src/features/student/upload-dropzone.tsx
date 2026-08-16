"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileTypeIcon, guessFileKind } from "@/components/shared/file-icon";
import { formatBytes, cn } from "@/lib/utils";
import { toast } from "sonner";

export interface StagedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
}

const FILE_FILTERS: Record<
  string,
  { label: string; accept: string; kinds: string[] }
> = {
  all: { label: "All Files", accept: "*", kinds: [] },
  pdf: { label: "PDF Documents", accept: ".pdf", kinds: ["pdf"] },
  doc: { label: "Word Documents", accept: ".doc,.docx", kinds: ["doc"] },
  excel: {
    label: "Excel Files",
    accept: ".xls,.xlsx",
    kinds: ["xls", "xlsx", "excel"],
  },
  ppt: { label: "PowerPoint", accept: ".ppt,.pptx", kinds: ["ppt", "pptx"] },
  txt: { label: "Text Files", accept: ".txt", kinds: ["txt"] },
  csv: { label: "CSV Files", accept: ".csv", kinds: ["csv"] },
  zip: { label: "ZIP Files", accept: ".zip", kinds: ["zip"] },
  image: { label: "Images", accept: ".png,.jpg,.jpeg,.webp", kinds: ["image"] },
};

interface UploadDropzoneProps {
  allowedExt: string[];
  maxSizeMb: number;
  staged: StagedFile[];
  onChange: (files: StagedFile[]) => void;
}

export function UploadDropzone({
  allowedExt,
  maxSizeMb,
  staged,
  onChange,
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Refs keep addFiles/updateProgress stable without re-subscribing effects.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const stagedRef = useRef(staged);
  stagedRef.current = staged;

  function updateProgress(
    id: string,
    progress: number,
    status: StagedFile["status"],
  ) {
    onChangeRef.current(
      stagedRef.current.map((f) =>
        f.id === id ? { ...f, progress, status } : f,
      ),
    );
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const accepted: StagedFile[] = [];

    for (const file of files) {
      const kind = guessFileKind(file.name);
      const selectedFilter = FILE_FILTERS[selectedType];
      const typeOk =
        selectedType === "all" ||
        selectedFilter.kinds.some((k) => kind.includes(k));
      const extOk = allowedExt.includes(kind) && typeOk;
      const sizeOk = file.size <= maxSizeMb * 1024 * 1024;
      if (!extOk) {
        toast.error(
          `Invalid file type: ${file.name}. Please upload ${FILE_FILTERS[selectedType].label}.`,
        );
        continue;
      }
      if (!sizeOk) {
        toast.error(`${file.name} exceeds the ${maxSizeMb}MB limit.`);
        continue;
      }
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      accepted.push({ id, file, progress: 0, status: "uploading" });
    }

    if (accepted.length === 0) return;
    onChangeRef.current([...stagedRef.current, ...accepted]);

    accepted.forEach((sf) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 12;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          updateProgress(sf.id, 100, "done");
        } else {
          updateProgress(sf.id, progress, "uploading");
        }
      }, 200);
    });
  }

  function removeFile(id: string) {
    onChange(staged.filter((f) => f.id !== id));
  }

  function replaceFile(id: string) {
    removeFile(id);
    inputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-3">
        <label className="mb-2 block text-sm font-medium">
          Select file type to upload
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full rounded-lg border p-2 text-sm bg-background"
        >
          {Object.entries(FILE_FILTERS).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-primary bg-primary-soft"
            : "border-border-strong bg-secondary/40 hover:bg-secondary/70",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
          <UploadCloud className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium">Drag &amp; drop your files here</p>
        <p className="text-xs text-muted-foreground">
          or click to browse ·{" "}
          {allowedExt.map((e) => e.toUpperCase()).join(", ")} · up to{" "}
          {maxSizeMb}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={FILE_FILTERS[selectedType].accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {staged.map((sf) => {
          const kind = guessFileKind(sf.file.name);
          return (
            <motion.div
              key={sf.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <FileTypeIcon kind={kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {sf.file.name}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatBytes(sf.file.size)}
                    </span>
                  </div>
                  {sf.status === "uploading" ? (
                    <Progress value={sf.progress} className="mt-1.5 h-1.5" />
                  ) : (
                    <p className="mt-0.5 text-xs text-success">
                      Ready to submit
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => replaceFile(sf.id)}
                    title="Replace"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(sf.id)}
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}


// "use client";

// import { useRef, useState } from "react";
// import { UploadCloud, X, RotateCcw } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Progress } from "@/components/ui/progress";
// import { Button } from "@/components/ui/button";
// import { FileTypeIcon, guessFileKind } from "@/components/shared/file-icon";
// import { formatBytes, cn } from "@/lib/utils";
// import { toast } from "sonner";

// export interface StagedFile {
//   id: string;
//   file: File;
//   progress: number;
//   status: "uploading" | "done" | "error";
// }

// const FILE_FILTERS: Record<
//   string,
//   { label: string; accept: string; kinds: string[] }
// > = {
//   all: { label: "All Files", accept: "*", kinds: [] },
//   pdf: { label: "PDF Documents", accept: ".pdf", kinds: ["pdf"] },
//   doc: { label: "Word Documents", accept: ".doc,.docx", kinds: ["doc"] },
//   excel: {
//     label: "Excel Files",
//     accept: ".xls,.xlsx",
//     kinds: ["xls", "xlsx", "excel"],
//   },
//   ppt: { label: "PowerPoint", accept: ".ppt,.pptx", kinds: ["ppt", "pptx"] },
//   txt: { label: "Text Files", accept: ".txt", kinds: ["txt"] },
//   csv: { label: "CSV Files", accept: ".csv", kinds: ["csv"] },
//   zip: { label: "ZIP Files", accept: ".zip", kinds: ["zip"] },
//   image: { label: "Images", accept: ".png,.jpg,.jpeg,.webp", kinds: ["image"] },
// };

// interface UploadDropzoneProps {
//   allowedExt: string[];
//   maxSizeMb: number;
//   staged: StagedFile[];
//   onChange: (files: StagedFile[]) => void;
// }

// export function UploadDropzone({
//   allowedExt,
//   maxSizeMb,
//   staged,
//   onChange,
// }: UploadDropzoneProps) {
//   const [dragging, setDragging] = useState(false);
//   const [selectedType, setSelectedType] = useState("all");
//   const inputRef = useRef<HTMLInputElement>(null);

//   // Refs keep addFiles/updateProgress stable without re-subscribing effects.
//   const onChangeRef = useRef(onChange);
//   onChangeRef.current = onChange;
//   const stagedRef = useRef(staged);
//   stagedRef.current = staged;

//   function updateProgress(
//     id: string,
//     progress: number,
//     status: StagedFile["status"],
//   ) {
//     onChangeRef.current(
//       stagedRef.current.map((f) =>
//         f.id === id ? { ...f, progress, status } : f,
//       ),
//     );
//   }

//   function addFiles(fileList: FileList | File[]) {
//     const files = Array.from(fileList);
//     const accepted: StagedFile[] = [];

//     for (const file of files) {
//       const kind = guessFileKind(file.name);
//       const selectedFilter = FILE_FILTERS[selectedType];
//       const typeOk =
//         selectedType === "all" ||
//         selectedFilter.kinds.some((k) => kind.includes(k));
//       const extOk = allowedExt.includes(kind) && typeOk;
//       const sizeOk = file.size <= maxSizeMb * 1024 * 1024;
//       if (!extOk) {
//         toast.error(
//           `Invalid file type: ${file.name}. Please upload ${FILE_FILTERS[selectedType].label}.`,
//         );
//         continue;
//       }
//       if (!sizeOk) {
//         toast.error(`${file.name} exceeds the ${maxSizeMb}MB limit.`);
//         continue;
//       }
//       const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
//       accepted.push({ id, file, progress: 0, status: "uploading" });
//     }

//     if (accepted.length === 0) return;
//     onChangeRef.current([...stagedRef.current, ...accepted]);

//     accepted.forEach((sf) => {
//       let progress = 0;
//       const interval = setInterval(() => {
//         progress += Math.random() * 20 + 12;
//         if (progress >= 100) {
//           progress = 100;
//           clearInterval(interval);
//           updateProgress(sf.id, 100, "done");
//         } else {
//           updateProgress(sf.id, progress, "uploading");
//         }
//       }, 200);
//     });
//   }

//   function removeFile(id: string) {
//     onChange(staged.filter((f) => f.id !== id));
//   }

//   function replaceFile(id: string) {
//     removeFile(id);
//     inputRef.current?.click();
//   }

//   return (
//     <div className="space-y-3">
//       <div className="rounded-xl border bg-card p-3">
//         <label className="mb-2 block text-sm font-medium">
//           Select file type to upload
//         </label>
//         <select
//           value={selectedType}
//           onChange={(e) => setSelectedType(e.target.value)}
//           className="w-full rounded-lg border p-2 text-sm bg-background"
//         >
//           {Object.entries(FILE_FILTERS).map(([key, item]) => (
//             <option key={key} value={key}>
//               {item.label}
//             </option>
//           ))}
//         </select>
//       </div>
//       <div
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDragging(true);
//         }}
//         onDragLeave={() => setDragging(false)}
//         onDrop={(e) => {
//           e.preventDefault();
//           setDragging(false);
//           if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
//         }}
//         onClick={() => inputRef.current?.click()}
//         className={cn(
//           "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
//           dragging
//             ? "border-primary bg-primary-soft"
//             : "border-border-strong bg-secondary/40 hover:bg-secondary/70",
//         )}
//       >
//         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
//           <UploadCloud className="h-6 w-6 text-primary" />
//         </div>
//         <p className="text-sm font-medium">Drag & drop your files here</p>
//         <p className="text-xs text-muted-foreground">
//           or click to browse ·{" "}
//           {allowedExt.map((e) => e.toUpperCase()).join(", ")} · up to{" "}
//           {maxSizeMb}MB each
//         </p>
//         <input
//           ref={inputRef}
//           type="file"
//           multiple
//           accept={FILE_FILTERS[selectedType].accept}
//           className="hidden"
//           onChange={(e) => {
//             if (e.target.files?.length) addFiles(e.target.files);
//             e.target.value = "";
//           }}
//         />
//       </div>

//       <AnimatePresence initial={false}>
//         {staged.map((sf) => {
//           const kind = guessFileKind(sf.file.name);
//           return (
//             <motion.div
//               key={sf.id}
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               className="overflow-hidden"
//             >
//               <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
//                 <FileTypeIcon kind={kind} />
//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-center justify-between gap-2">
//                     <p className="truncate text-sm font-medium">
//                       {sf.file.name}
//                     </p>
//                     <span className="shrink-0 text-xs text-muted-foreground">
//                       {formatBytes(sf.file.size)}
//                     </span>
//                   </div>
//                   {sf.status === "uploading" ? (
//                     <Progress value={sf.progress} className="mt-1.5 h-1.5" />
//                   ) : (
//                     <p className="mt-0.5 text-xs text-success">
//                       Ready to submit
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex shrink-0 items-center gap-1">
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="h-7 w-7"
//                     onClick={() => replaceFile(sf.id)}
//                     title="Replace"
//                   >
//                     <RotateCcw className="h-3.5 w-3.5" />
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="h-7 w-7"
//                     onClick={() => removeFile(sf.id)}
//                     title="Remove"
//                   >
//                     <X className="h-3.5 w-3.5" />
//                   </Button>
//                 </div>
//               </div>
//             </motion.div>
//           );
//         })}
//       </AnimatePresence>
//     </div>
//   );
// }
