"use client";

import { useState, type MouseEvent } from "react";

import { X } from "lucide-react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import { cn } from "@/lib/utils";

export function ShotgunVariableChip({
  deleteNode,
  node,
}: NodeViewProps) {
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const key = typeof node.attrs.key === "string" ? node.attrs.key : "";
  const label =
    typeof node.attrs.label === "string" && node.attrs.label
      ? node.attrs.label
      : key;

  function isRemoveButtonTarget(event: MouseEvent<HTMLElement>) {
    return (event.target as HTMLElement).closest("button");
  }

  return (
    <NodeViewWrapper
      as="span"
      data-shotgun-variable="true"
      data-key={key}
      contentEditable={false}
      onMouseEnter={() => setIsActionsVisible(true)}
      onMouseLeave={() => setIsActionsVisible(false)}
      onMouseDown={(event: MouseEvent<HTMLSpanElement>) => {
        if (isRemoveButtonTarget(event)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event: MouseEvent<HTMLSpanElement>) => {
        if (isRemoveButtonTarget(event)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setIsActionsVisible((current) => !current);
      }}
      className={cn(
        "sg-variable-chip group/chip mx-1 inline-flex cursor-default items-center gap-1 rounded-full border border-border/80 bg-muted px-2 py-1 text-xs font-medium text-foreground shadow-sm outline-none transition-colors focus:outline-none focus-visible:outline-none",
        isActionsVisible && "border-foreground/20 bg-muted/90"
      )}
    >
      <span className="pl-1">{label}</span>
      <button
        type="button"
        contentEditable={false}
        aria-label={`Supprimer ${label}`}
        title={`Supprimer ${label}`}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          deleteNode();
        }}
        className={cn(
          "grid size-4 place-items-center rounded-full text-muted-foreground transition-all outline-none ring-0 hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-0",
          isActionsVisible
            ? "opacity-100"
            : "opacity-0 group-hover/chip:opacity-100 group-focus-within/chip:opacity-100"
        )}
      >
        <X className="size-3" strokeWidth={2.4} />
      </button>
    </NodeViewWrapper>
  );
}
