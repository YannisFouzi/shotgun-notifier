"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">500</p>
      <h1 className="text-2xl font-semibold">{t("errorPage.errorTitle")}</h1>
      <p className="max-w-md text-muted-foreground">
        {t("errorPage.errorBody")}
      </p>
      <Button onClick={reset} className="mt-2">
        {t("errorPage.retry")}
      </Button>
    </div>
  );
}
