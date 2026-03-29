import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { BotFatherMockup } from "@/components/botfather-mockup";

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
);

interface SetupStep {
  content: ReactNode;
  link?: { label: string; url: string };
  columns?: {
    left: { title: string; content: ReactNode };
    right: { title: string; content: ReactNode };
  };
}

const GUIDES: Record<string, { steps: SetupStep[]; mockup?: "botfather" }> = {
  telegram: {
    mockup: "botfather",
    steps: [
      {
        content: <>Ouvrez Telegram et lancez une conversation avec</>,
        link: { label: "@BotFather", url: "https://t.me/BotFather" },
      },
      {
        content: <>Envoyez la commande <B>/newbot</B> et suivez les instructions : choisissez un <B>nom</B> (ex: Shotgun Notifier) puis un <B>username</B> (ex: shotgun_notifier_bot).</>,
      },
      {
        content: <>BotFather vous envoie un message avec votre <B>Bot Token</B> (ressemble a <B>7103948261:AAF...</B>). Copiez-le et collez-le dans le champ ci-dessous.</>,
      },
      {
        content: <>Pour obtenir votre <B>Chat ID</B>, faites d&apos;abord parler le bot dans le bon endroit.</>,
        columns: {
          left: {
            title: "Prive",
            content: <>Ouvrez votre bot, envoyez-lui un message, puis cliquez sur <B>Detecter mes chats</B>.</>,
          },
          right: {
            title: "Groupe",
            content: <>Ajoutez <B>votre bot</B> au groupe, envoyez un message dans ce groupe, puis cliquez sur <B>Detecter mes chats</B>.</>,
          },
        },
      },
    ],
  },
  discord: {
    steps: [
      {
        content: <>Creer un <B>webhook</B> dans le salon cible.</>,
        link: {
          label: "Guide Discord",
          url: "https://support.discord.com/hc/fr/articles/228383668",
        },
      },
      {
        content: <>Copier l&apos;<B>URL du webhook</B>.</>,
      },
    ],
  },
  whatsapp: {
    steps: [
      {
        content: <>Creer une app Meta avec <B>WhatsApp</B>.</>,
        link: {
          label: "Meta",
          url: "https://developers.facebook.com/apps/",
        },
      },
      {
        content: <>Recuperer <B>Access Token</B> et <B>Phone Number ID</B>.</>,
        link: {
          label: "Doc",
          url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
        },
      },
    ],
  },
  messenger: {
    steps: [
      {
        content: <>Creer une app Meta avec <B>Messenger</B>.</>,
        link: {
          label: "Meta",
          url: "https://developers.facebook.com/apps/",
        },
      },
      {
        content: <>Recuperer <B>Page Access Token</B> et <B>PSID</B>.</>,
        link: {
          label: "Doc",
          url: "https://developers.facebook.com/docs/messenger-platform/getting-started",
        },
      },
    ],
  },
};

function renderMockup(mockup: string) {
  if (mockup === "botfather") {
    return <BotFatherMockup />;
  }
  return null;
}

interface ChannelSetupGuideProps {
  channelKey: string;
  /** Render content after a specific step (0-indexed). Key = step index. */
  slots?: Record<number, ReactNode>;
  visibleSteps?: number;
}

export function ChannelSetupGuide({
  channelKey,
  slots,
  visibleSteps,
}: ChannelSetupGuideProps) {
  const guide = GUIDES[channelKey];

  if (!guide?.steps.length) {
    return null;
  }

  const steps = guide.steps.slice(0, visibleSteps ?? guide.steps.length);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
      <ol className="space-y-3">
        {steps.map((step, index) => (
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
                  <p className="text-xs font-semibold text-foreground mb-1.5">{step.columns.left.title}</p>
                  <p className="text-[13px] leading-[1.5] text-foreground/70">{step.columns.left.content}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/5 px-3 py-2.5">
                  <p className="text-xs font-semibold text-foreground mb-1.5">{step.columns.right.title}</p>
                  <p className="text-[13px] leading-[1.5] text-foreground/70">{step.columns.right.content}</p>
                </div>
              </div>
            )}
            {slots?.[index] && (
              <div className="mt-2 pl-9">{slots[index]}</div>
            )}
          </li>
        ))}
      </ol>

      {guide.mockup && (
        <div className="hidden xl:block">
          {renderMockup(guide.mockup)}
        </div>
      )}
    </div>
  );
}
