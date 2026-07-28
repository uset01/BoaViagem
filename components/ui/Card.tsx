import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, padding = "p-6" },
  ref
) {
  return (
    <div ref={ref} className={cn("rounded-[20px] bg-surface shadow-card", padding, className)}>
      {children}
    </div>
  );
});
