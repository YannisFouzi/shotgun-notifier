import type { TFunction } from "i18next";

export function resolveTelegramApiErrorMessage(
  payload: { error?: string; errorKey?: string },
  t: TFunction
) {
  if (payload.errorKey) {
    return t(`errors.telegram.${payload.errorKey}`, {
      defaultValue: payload.error?.trim() || t("errors.telegram.generic"),
    });
  }
  return payload.error?.trim() || t("errors.telegram.generic");
}
