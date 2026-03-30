"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation, Trans } from "react-i18next";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDeleteAccount, ApiError } from "@/lib/api";
import { clearStoredMessageTemplate } from "@/lib/message-template";
import {
  clearStoredShotgunToken,
  saveStoredTelegramConfig,
} from "@/lib/shotgun";
import { cn } from "@/lib/utils";

/** Same string in all locales so the confirmation step stays unambiguous. */
const DELETE_ACCOUNT_CONFIRM_PHRASE = "DELETE";

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const confirmWord = t("dashboard.deleteAccountConfirmWord");
  const phraseOk = confirmText.trim() === DELETE_ACCOUNT_CONFIRM_PHRASE;

  const resetDialogState = useCallback(() => {
    setConfirmText("");
    setError("");
    setSubmitting(false);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        resetDialogState();
      }
    },
    [resetDialogState]
  );

  const handleDelete = useCallback(async () => {
    if (!phraseOk || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await apiDeleteAccount();
      clearStoredShotgunToken();
      saveStoredTelegramConfig("", "");
      clearStoredMessageTemplate();
      router.replace("/");
    } catch (err) {
      setSubmitting(false);
      const message =
        err instanceof ApiError && err.message.trim()
          ? err.message
          : t("dashboard.deleteAccountError");
      setError(message);
    }
  }, [phraseOk, submitting, router, t]);

  return (
    <>
      <section
        className="mt-16 border-t border-destructive/20 pt-10 pb-4"
        aria-labelledby="delete-account-zone-title"
      >
        <h2
          id="delete-account-zone-title"
          className="text-sm font-semibold uppercase tracking-wide text-destructive"
        >
          {t("dashboard.deleteAccountZoneTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("dashboard.deleteAccountZoneHint")}
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={() => setOpen(true)}
        >
          {t("dashboard.deleteAccountOpen")}
        </Button>
      </section>

      <Dialog.Root open={open} onOpenChange={handleOpenChange} modal>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]",
              "transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
            )}
          />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <Dialog.Popup
              className={cn(
                "w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl outline-none",
                "transition-transform duration-200 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
              )}
              initialFocus={true}
            >
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                {t("dashboard.deleteAccountDialogTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                {t("dashboard.deleteAccountDialogBody")}
              </Dialog.Description>

              <div className="mt-6 space-y-2">
                <Label htmlFor="delete-account-confirm">
                  <Trans
                    i18nKey="dashboard.deleteAccountTypeLabel"
                    values={{ word: confirmWord }}
                    components={{ strong: <strong className="text-foreground" /> }}
                  />
                </Label>
                <Input
                  id="delete-account-confirm"
                  type="text"
                  name="delete-account-confirm"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={t("dashboard.deleteAccountConfirmPlaceholder")}
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError("");
                  }}
                  disabled={submitting}
                  aria-invalid={error ? true : undefined}
                  className="font-mono text-sm"
                />
              </div>

              {error ? (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleOpenChange(false)}
                >
                  {t("dashboard.deleteAccountCancel")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!phraseOk || submitting}
                  onClick={() => void handleDelete()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("dashboard.deleteAccountSubmitting")}
                    </>
                  ) : (
                    t("dashboard.deleteAccountSubmit")
                  )}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
