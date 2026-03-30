"use client";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type SyncStatus = "idle" | "pending" | "syncing" | "synced" | "error";

export function SyncIndicator({
  status,
  onRetry,
}: {
  status: SyncStatus;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  if (status === "idle" || status === "pending") return null;

  return (
    <button
      type="button"
      onClick={status === "error" ? onRetry : undefined}
      disabled={status !== "error"}
      title={status === "error" ? t("sync.retryTitle") : undefined}
      className={cn(
        "relative grid size-5 shrink-0 place-items-center",
        status === "error" && "cursor-pointer",
        status !== "error" && "pointer-events-none",
        status === "synced" && "animate-[fadeOut_1s_1.5s_forwards]"
      )}
    >
      {/* Dot */}
      <span
        className={cn(
          "absolute size-2 rounded-full transition-colors duration-300",
          status === "syncing" && "bg-muted-foreground/60",
          status === "synced" && "bg-emerald-400",
          status === "error" && "bg-red-400"
        )}
      />

      {/* Pulse ring — only on syncing */}
      {status === "syncing" && (
        <span className="absolute size-2 animate-ping rounded-full bg-muted-foreground/40" />
      )}

      {/* Error ring — subtle glow */}
      {status === "error" && (
        <span className="absolute size-3.5 animate-pulse rounded-full bg-red-400/15" />
      )}
    </button>
  );
}
