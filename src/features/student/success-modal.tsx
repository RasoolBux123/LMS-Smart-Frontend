"use client";

import { motion } from "framer-motion";
import { CheckCircle2, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SubmissionSuccessModal({
  open,
  onOpenChange,
  title,
  backHref,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  backHref: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogTitle className="sr-only">Submission successful</DialogTitle>
        <DialogDescription className="sr-only">
          Your work was submitted successfully.
        </DialogDescription>
        <div className="flex flex-col items-center py-2">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success-soft"
          >
            <CheckCircle2 className="h-10 w-10 text-success" />
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring" }}
              className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-warning-soft"
            >
              <PartyPopper className="h-3.5 w-3.5 text-warning" />
            </motion.div>
          </motion.div>
          <h3 className="mt-5 font-display text-lg font-semibold">
            Submission received!
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            &ldquo;{title}&rdquo; was submitted successfully. You&rsquo;ll be
            notified once it&rsquo;s graded.
          </p>
          <div className="mt-6 flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Stay here
            </Button>
            <Button className="flex-1" asChild>
              <Link href={backHref}>View all</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
