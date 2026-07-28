import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconCircleProps {
  icon: ReactNode;
  active?: boolean;
  className?: string;
}

export function IconCircle({ icon, active = false, className }: IconCircleProps) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        active ? "bg-accent/10 text-accent" : "bg-surface-muted text-ink-secondary",
        className
      )}
    >
      {icon}
    </span>
  );
}
