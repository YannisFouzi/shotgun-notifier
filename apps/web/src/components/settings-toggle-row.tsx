"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SettingsToggleRowProps = {
  label: ReactNode;
  description?: ReactNode;
  pressed: boolean;
  onToggle: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  /** Sans cadre (bordure / fond) — ex. dans la carte Telegram du dashboard */
  variant?: "card" | "plain";
};

/**
 * Même interrupteur que dans l’éditeur de message (règle « au moins 2 events »).
 */
export function SettingsToggleRow({
  label,
  description,
  pressed,
  onToggle,
  disabled,
  "aria-label": ariaLabel,
  className,
  variant = "card",
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        variant === "card" &&
          "rounded-2xl border border-border/70 bg-background/50 px-3 py-3",
        variant === "plain" && "py-1",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium leading-5 text-foreground">
            {label}
          </p>
          {description ? (
            <p className="text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-pressed={pressed}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            pressed
              ? "border-foreground/10 bg-foreground"
              : "border-border/80 bg-muted/50",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
              pressed ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}
