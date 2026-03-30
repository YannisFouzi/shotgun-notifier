"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type SiteFooterProps = {
  /** `home` = fond marketing sombre ; `app` = thème dashboard (shadcn) */
  variant?: "home" | "app";
  className?: string;
};

export function SiteFooter({ variant = "app", className }: SiteFooterProps) {
  const { t } = useTranslation();

  const isHome = variant === "home";

  return (
    <footer
      className={cn(
        isHome
          ? "border-t border-white/10 bg-[#050608] py-6 text-white/55"
          : "border-t border-border py-6 text-muted-foreground",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            "text-xs",
            isHome ? "text-white/40" : "text-muted-foreground/90"
          )}
        >
          ShotNotif
        </p>
        <nav
          className="flex flex-wrap gap-x-5 gap-y-1 text-sm"
          aria-label={t("legal.navAria")}
        >
          <Link
            href="/legal/cgu"
            className={cn(
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isHome
                ? "hover:text-white focus-visible:ring-offset-[#050608]"
                : "hover:text-foreground"
            )}
          >
            {t("legal.linkCgu")}
          </Link>
          <Link
            href="/legal/cgv"
            className={cn(
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isHome
                ? "hover:text-white focus-visible:ring-offset-[#050608]"
                : "hover:text-foreground"
            )}
          >
            {t("legal.linkCgv")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
