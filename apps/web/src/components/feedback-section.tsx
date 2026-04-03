"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFeedback, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "feature";

export function FeedbackSection() {
  const { t } = useTranslation();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 5) {
      setError(t("dashboard.feedbackErrorMessageRequired"));
      return;
    }

    setStatus("loading");
    setError("");

    try {
      await apiFeedback({
        type,
        message: trimmed,
        email: email.trim(),
      });
      setStatus("ok");
      setMessage("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiError && err.message.trim()
          ? err.message
          : t("dashboard.feedbackErrorGeneric")
      );
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">
          {t("dashboard.feedbackTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.feedbackSubtitle")}
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div className="flex gap-1.5">
              {(["bug", "feature"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={type === option}
                  onClick={() => setType(option)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    type === option
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {t(`dashboard.feedbackType${option === "bug" ? "Bug" : "Feature"}`)}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (status === "error") setError("");
                if (status === "ok") setStatus("idle");
              }}
              placeholder={t("dashboard.feedbackMessagePlaceholder")}
              rows={3}
              disabled={status === "loading"}
              className={cn(
                "w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
              )}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("dashboard.feedbackEmailPlaceholder")}
                disabled={status === "loading"}
                className="sm:max-w-56"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={status === "loading"}
                className="inline-flex shrink-0 gap-2"
              >
                {status === "loading" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span>
                  {status === "loading"
                    ? t("dashboard.feedbackSubmitting")
                    : t("dashboard.feedbackSubmit")}
                </span>
              </Button>
            </div>

            {status === "ok" && (
              <p className="text-xs text-emerald-400">
                {t("dashboard.feedbackSuccess")}
              </p>
            )}
            {status === "error" && error && (
              <p className="text-xs text-amber-400">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
