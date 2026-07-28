"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, children, className }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div
        className={cn(
          "relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-[28px] bg-surface pb-[env(safe-area-inset-bottom)] shadow-sheet transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
          className
        )}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-divider" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
