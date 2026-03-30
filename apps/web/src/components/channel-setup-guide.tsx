"use client";

import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";

import { BotFatherMockup } from "@/components/botfather-mockup";

interface SetupStep {
  content: ReactNode;
  link?: { label: string; url: string };
  columns?: {
    left: { title: string; content: ReactNode };
    right: { title: string; content: ReactNode };
  };
}

const GUIDE_META: Record<
  string,
  { steps: number; mockup?: string }
> = {
  telegram: { steps: 4, mockup: "botfather" },
  discord: { steps: 2 },
  whatsapp: { steps: 2 },
  messenger: { steps: 2 },
};

function renderMockup(mockup: string) {
  if (mockup === "botfather") {
    return <BotFatherMockup />;
  }
  return null;
}

interface ChannelSetupGuideProps {
  channelKey: string;
  slots?: Record<number, ReactNode>;
  visibleSteps?: number;
}

export function ChannelSetupGuide({
  channelKey,
  slots,
  visibleSteps,
}: ChannelSetupGuideProps) {
  const { t } = useTranslation();
  const meta = GUIDE_META[channelKey];

  if (!meta?.steps) {
    return null;
  }

  const p = `setup.${channelKey}` as const;

  const steps: SetupStep[] =
    channelKey === "telegram"
      ? [
          {
            content: <>{t(`${p}.step0`)}</>,
            link: { label: "@BotFather", url: "https://t.me/BotFather" },
          },
          {
            content: (
              <Trans
                i18nKey={`${p}.step1`}
                components={{
                  cmd: (
                    <span className="font-semibold text-foreground" />
                  ),
                  b: (
                    <strong className="font-semibold text-foreground" />
                  ),
                }}
              />
            ),
          },
          {
            content: (
              <Trans
                i18nKey={`${p}.step2`}
                components={{
                  b: (
                    <strong className="font-semibold text-foreground" />
                  ),
                }}
              />
            ),
          },
          {
            content: (
              <Trans
                i18nKey={`${p}.step3`}
                components={{
                  b: (
                    <strong className="font-semibold text-foreground" />
                  ),
                }}
              />
            ),
            columns: {
              left: {
                title: t(`${p}.colPrivateTitle`),
                content: (
                  <Trans
                    i18nKey={`${p}.colPrivateBody`}
                    components={{
                      b: (
                        <strong className="font-semibold text-foreground" />
                      ),
                    }}
                  />
                ),
              },
              right: {
                title: t(`${p}.colGroupTitle`),
                content: (
                  <Trans
                    i18nKey={`${p}.colGroupBody`}
                    components={{
                      b: (
                        <strong className="font-semibold text-foreground" />
                      ),
                    }}
                  />
                ),
              },
            },
          },
        ]
      : channelKey === "discord"
        ? [
            {
              content: (
                <Trans
                  i18nKey="setup.discord.step0"
                  components={{
                    b: (
                      <strong className="font-semibold text-foreground" />
                    ),
                  }}
                />
              ),
              link: {
                label: t("setup.linkDiscordGuide"),
                url: "https://support.discord.com/hc/fr/articles/228383668",
              },
            },
            {
              content: (
                <Trans
                  i18nKey="setup.discord.step1"
                  components={{
                    b: (
                      <strong className="font-semibold text-foreground" />
                    ),
                  }}
                />
              ),
            },
          ]
        : channelKey === "whatsapp"
          ? [
              {
                content: (
                  <Trans
                    i18nKey="setup.whatsapp.step0"
                    components={{
                      b: (
                        <strong className="font-semibold text-foreground" />
                      ),
                    }}
                  />
                ),
                link: {
                  label: t("setup.linkMeta"),
                  url: "https://developers.facebook.com/apps/",
                },
              },
              {
                content: (
                  <Trans
                    i18nKey="setup.whatsapp.step1"
                    components={{
                      b: (
                        <strong className="font-semibold text-foreground" />
                      ),
                    }}
                  />
                ),
                link: {
                  label: t("setup.linkDoc"),
                  url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
                },
              },
            ]
          : channelKey === "messenger"
            ? [
                {
                  content: (
                    <Trans
                      i18nKey="setup.messenger.step0"
                      components={{
                        b: (
                          <strong className="font-semibold text-foreground" />
                        ),
                      }}
                    />
                  ),
                  link: {
                    label: t("setup.linkMeta"),
                    url: "https://developers.facebook.com/apps/",
                  },
                },
                {
                  content: (
                    <Trans
                      i18nKey="setup.messenger.step1"
                      components={{
                        b: (
                          <strong className="font-semibold text-foreground" />
                        ),
                      }}
                    />
                  ),
                  link: {
                    label: t("setup.linkDoc"),
                    url: "https://developers.facebook.com/docs/messenger-platform/getting-started",
                  },
                },
              ]
            : [];

  const sliceEnd = visibleSteps ?? steps.length;
  const visible = steps.slice(0, Math.min(sliceEnd, steps.length));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
      <ol className="space-y-3">
        {visible.map((step, index) => (
          <li key={index}>
            <div className="flex gap-3 text-sm leading-[1.6] text-foreground/80">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-semibold text-foreground">
                {index + 1}
              </span>
              <span>
                {step.content}
                {step.link && (
                  <>
                    {" "}
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                    >
                      {step.link.label}
                      <ExternalLink className="size-3" />
                    </a>
                  </>
                )}
              </span>
            </div>
            {step.columns && (
              <div className="mt-3 ml-9 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-muted/5 px-3 py-2.5">
                  <p className="mb-1.5 text-xs font-semibold text-foreground">
                    {step.columns.left.title}
                  </p>
                  <p className="text-[13px] leading-[1.5] text-foreground/70">
                    {step.columns.left.content}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/5 px-3 py-2.5">
                  <p className="mb-1.5 text-xs font-semibold text-foreground">
                    {step.columns.right.title}
                  </p>
                  <p className="text-[13px] leading-[1.5] text-foreground/70">
                    {step.columns.right.content}
                  </p>
                </div>
              </div>
            )}
            {slots?.[index] && (
              <div className="mt-2 pl-9">{slots[index]}</div>
            )}
          </li>
        ))}
      </ol>

      {meta.mockup && (
        <div className="hidden xl:block">{renderMockup(meta.mockup)}</div>
      )}
    </div>
  );
}
