"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BOTTOM_NAV_HEIGHT = 64;

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
}

interface BottomNavProps {
  items: BottomNavItem[];
  active: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function BottomNav({ items, active, onChange, className }: BottomNavProps) {
  return (
    <nav
      style={{ height: BOTTOM_NAV_HEIGHT }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-divider bg-surface pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        const content = (
          <>
            <span className={cn("text-xl leading-none", isActive ? "text-accent" : "text-ink-secondary")}>
              {item.icon}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                isActive ? "text-accent" : "text-ink-secondary"
              )}
            >
              {item.label}
            </span>
            <span className={cn("h-1 w-1 rounded-full", isActive ? "bg-accent" : "bg-transparent")} />
          </>
        );

        const itemClassName = "flex flex-1 flex-col items-center justify-center gap-1.5";

        if (item.href) {
          return (
            <Link key={item.key} href={item.href} className={itemClassName}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange?.(item.key)}
            className={itemClassName}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
