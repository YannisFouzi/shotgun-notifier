import { ExternalLink } from "lucide-react";

interface SetupStep {
  text: string;
  link?: { label: string; url: string };
}

interface ChannelGuide {
  steps: SetupStep[];
}

const GUIDES: Record<string, ChannelGuide> = {
  telegram: {
    steps: [
      {
        text: "Ouvrez Telegram et lancez une conversation avec",
        link: { label: "@BotFather", url: "https://t.me/BotFather" },
      },
      {
        text: "Envoyez /newbot, choisissez un nom et un username. BotFather vous donne le Bot Token.",
      },
      {
        text: "Pour le Chat ID, envoyez un message a votre bot puis ouvrez",
        link: {
          label: "api.telegram.org/bot<TOKEN>/getUpdates",
          url: "https://core.telegram.org/bots/api#getupdates",
        },
      },
      {
        text: "Le Chat ID se trouve dans la reponse JSON sous result > message > chat > id.",
      },
    ],
  },
  discord: {
    steps: [
      {
        text: "Ouvrez les parametres de votre serveur Discord.",
      },
      {
        text: "Allez dans Integrations > Webhooks > Nouveau webhook.",
        link: {
          label: "Documentation Discord",
          url: "https://support.discord.com/hc/fr/articles/228383668",
        },
      },
      {
        text: "Choisissez le salon ou recevoir les notifications.",
      },
      {
        text: "Cliquez sur Copier l'URL du webhook et collez-la ici.",
      },
    ],
  },
  whatsapp: {
    steps: [
      {
        text: "Creez une application sur Meta for Developers.",
        link: {
          label: "developers.facebook.com",
          url: "https://developers.facebook.com/apps/",
        },
      },
      {
        text: "Ajoutez le produit WhatsApp a votre app et configurez un numero de telephone.",
      },
      {
        text: "Dans Configuration API, generez un Access Token permanent.",
        link: {
          label: "Documentation WhatsApp API",
          url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
        },
      },
      {
        text: "Copiez le Phone Number ID et le Token, puis collez-les ici.",
      },
    ],
  },
  messenger: {
    steps: [
      {
        text: "Creez une application sur Meta for Developers.",
        link: {
          label: "developers.facebook.com",
          url: "https://developers.facebook.com/apps/",
        },
      },
      {
        text: "Ajoutez le produit Messenger et connectez votre page Facebook.",
        link: {
          label: "Documentation Messenger API",
          url: "https://developers.facebook.com/docs/messenger-platform/getting-started",
        },
      },
      {
        text: "Generez un Page Access Token depuis les parametres Messenger de votre app.",
      },
      {
        text: "Le Recipient ID (PSID) est l'identifiant de l'utilisateur qui a envoye un message a votre page.",
      },
    ],
  },
};

interface ChannelSetupGuideProps {
  channelKey: string;
}

export function ChannelSetupGuide({ channelKey }: ChannelSetupGuideProps) {
  const guide = GUIDES[channelKey];

  if (!guide) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-border/40 bg-muted/10 px-4 py-3">
      <p className="text-xs font-medium text-foreground">Comment obtenir ces informations ?</p>
      <ol className="mt-2.5 space-y-2">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-2.5 text-[12px] leading-[1.5] text-muted-foreground">
            <span className="mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full bg-muted/50 text-[10px] font-semibold text-foreground/70">
              {i + 1}
            </span>
            <span>
              {step.text}
              {step.link && (
                <>
                  {" "}
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                  >
                    {step.link.label}
                    <ExternalLink className="size-2.5" />
                  </a>
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
