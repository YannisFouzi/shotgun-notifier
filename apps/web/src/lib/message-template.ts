import type { JSONContent } from "@tiptap/react";

import { SHOTGUN_VARIABLE_NODE_NAME } from "@/lib/shotgun-variable-node";

export const MESSAGE_TEMPLATE_STORAGE_KEY = "message_template";
export const MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY = "message_template_settings";

export type MessageTemplateSection = "event" | "summary" | "deal" | "context";

export interface MessageTemplateSectionMeta {
  description: string;
  key: MessageTemplateSection;
  label: string;
}

export interface MessageTemplateVariable {
  description: string;
  example: string;
  key: string;
  label: string;
  section: MessageTemplateSection;
}

export interface MessageTemplatePreset {
  content: JSONContent;
  label: string;
}

export interface MessageTemplateSettings {
  showEventNameOnlyWhenMultipleEvents: boolean;
}

export const DEFAULT_MESSAGE_TEMPLATE_SETTINGS: MessageTemplateSettings = {
  showEventNameOnlyWhenMultipleEvents: false,
};

export const MESSAGE_TEMPLATE_SECTIONS: MessageTemplateSectionMeta[] = [
  {
    key: "event",
    label: "Event",
    description: "Nom, date, lieu, organisateur...",
  },
  {
    key: "summary",
    label: "Vente",
    description: "Billets vendus, total, montant...",
  },
  {
    key: "deal",
    label: "Billets",
    description: "Type de billet, prix, resume par vague...",
  },
  {
    key: "context",
    label: "Contexte",
    description: "Paiement, canal, source marketing...",
  },
];

export const MESSAGE_TEMPLATE_VARIABLES: MessageTemplateVariable[] = [
  {
    section: "event",
    key: "event_name",
    label: "Nom de l'event",
    description: "Titre Shotgun de l'event.",
    example: "KODZ X GUETTAPEN X MERCI LILLE : REBELION, ECSTATIC & MORE",
  },
  {
    section: "event",
    key: "event_date",
    label: "Date",
    description: "Date de l'event.",
    example: "1 mai 2026",
  },
  {
    section: "event",
    key: "event_start_time",
    label: "Heure de debut",
    description: "Heure de debut de l'event.",
    example: "21:00",
  },
  {
    section: "event",
    key: "event_end_time",
    label: "Heure de fin",
    description: "Heure de fin de l'event.",
    example: "04:00",
  },
  {
    section: "event",
    key: "event_venue",
    label: "Lieu",
    description: "Nom du lieu.",
    example: "Kodz",
  },
  {
    section: "event",
    key: "event_city",
    label: "Ville",
    description: "Ville de l'event.",
    example: "Englos",
  },
  {
    section: "event",
    key: "organizer_name",
    label: "Organisateur",
    description: "Nom de l'organisateur Shotgun.",
    example: "KODZ",
  },
  {
    section: "event",
    key: "event_url",
    label: "Lien de l'event",
    description: "URL publique Shotgun.",
    example: "https://shotgun.live/events/guettapenmercililleinvitentrebelion",
  },
  {
    section: "event",
    key: "event_id",
    label: "ID de l'event",
    description: "Identifiant Shotgun de l'event.",
    example: "531055",
  },
  {
    section: "summary",
    key: "new_tickets_label",
    label: "Billets vendus",
    description: "Texte deja formate selon le volume vendu.",
    example: "1 billet vendu",
  },
  {
    section: "summary",
    key: "new_tickets_count",
    label: "Nombre de nouveaux billets",
    description: "Nombre de billets dans cette notification.",
    example: "1",
  },
  {
    section: "summary",
    key: "event_total_sold",
    label: "Total billets vendus",
    description: "Total cumule sur l'event.",
    example: "57",
  },
  {
    section: "summary",
    key: "event_left_tickets",
    label: "Billets restants",
    description: "Stock restant selon Shotgun.",
    example: "2414",
  },
  {
    section: "summary",
    key: "new_tickets_revenue",
    label: "Montant de la vente",
    description: "Montant estime de cette vente.",
    example: "16.50 EUR",
  },
  {
    section: "summary",
    key: "currency",
    label: "Devise",
    description: "Devise de la commande.",
    example: "EUR",
  },
  {
    section: "deal",
    key: "deal_lines",
    label: "Resume des billets",
    description: "Bloc deja formate par type de billet.",
    example: "VAGUE 2 : 4/200",
  },
  {
    section: "deal",
    key: "first_deal_name",
    label: "Nom du billet principal",
    description: "Premier type de billet detecte.",
    example: "VAGUE 2",
  },
  {
    section: "deal",
    key: "first_deal_sold",
    label: "Vendus sur ce billet",
    description: "Total vendus sur le type principal.",
    example: "4",
  },
  {
    section: "deal",
    key: "first_deal_max",
    label: "Capacite de ce billet",
    description: "Capacite maximale du type principal.",
    example: "200",
  },
  {
    section: "deal",
    key: "first_deal_price",
    label: "Prix du billet principal",
    description: "Prix detecte pour le type principal.",
    example: "16.50 EUR",
  },
  {
    section: "deal",
    key: "new_deal_names",
    label: "Noms des billets vendus",
    description: "Liste des types de billets vendus.",
    example: "VAGUE 2",
  },
  {
    section: "deal",
    key: "new_deals_count",
    label: "Nombre de types vendus",
    description: "Nombre de types de billets distincts.",
    example: "1",
  },
  {
    section: "context",
    key: "payment_methods",
    label: "Paiement",
    description: "Moyens de paiement detectes.",
    example: "card",
  },
  {
    section: "context",
    key: "sales_channels",
    label: "Canal de vente",
    description: "Canaux de vente detectes.",
    example: "online",
  },
  {
    section: "context",
    key: "utm_sources",
    label: "Source marketing",
    description: "UTM source detectee.",
    example: "shotgun",
  },
  {
    section: "context",
    key: "utm_mediums",
    label: "Support marketing",
    description: "UTM medium detecte.",
    example: "website",
  },
  {
    section: "context",
    key: "order_ids",
    label: "Numero de commande",
    description: "IDs de commande associes.",
    example: "123456789",
  },
];

export const SAMPLE_MESSAGE_TEMPLATE_CONTEXT: Record<string, string> = {
  currency: "EUR",
  deal_lines: "VAGUE 2 : 4/200",
  event_city: "Englos",
  event_date: "1 mai 2026",
  event_end_time: "04:00",
  event_id: "531055",
  event_left_tickets: "2414",
  event_name:
    "KODZ X GUETTAPEN X MERCI LILLE : REBELION, ECSTATIC & MORE",
  event_start_time: "21:00",
  event_total_sold: "57",
  event_url: "https://shotgun.live/events/guettapenmercililleinvitentrebelion",
  event_venue: "Kodz",
  first_deal_max: "200",
  first_deal_name: "VAGUE 2",
  first_deal_price: "16.50 EUR",
  first_deal_sold: "4",
  new_deal_names: "VAGUE 2",
  new_deals_count: "1",
  new_tickets_count: "1",
  new_tickets_label: "1 billet vendu",
  new_tickets_revenue: "16.50 EUR",
  order_ids: "123456789",
  organizer_name: "KODZ",
  payment_methods: "card",
  sales_channels: "online",
  utm_mediums: "website",
  utm_sources: "shotgun",
  scheduled_events_count: "1",
};

export function getMessageTemplateVariable(key: string) {
  return MESSAGE_TEMPLATE_VARIABLES.find((variable) => variable.key === key);
}

export function getMessageTemplateVariablesForSection(
  section: MessageTemplateSection
) {
  return MESSAGE_TEMPLATE_VARIABLES.filter(
    (variable) => variable.section === section
  );
}

export function createMessageTemplateVariableNode(key: string): JSONContent {
  const variable = getMessageTemplateVariable(key);

  return {
    type: SHOTGUN_VARIABLE_NODE_NAME,
    attrs: {
      key,
      label: variable?.label || key,
    },
  };
}

function createParagraph(content: JSONContent[]): JSONContent {
  return {
    type: "paragraph",
    content,
  };
}

function cloneContent(content: JSONContent) {
  return JSON.parse(JSON.stringify(content)) as JSONContent;
}

export const DEFAULT_MESSAGE_TEMPLATE_CONTENT: JSONContent = {
  type: "doc",
  content: [
    createParagraph([{ type: "text", text: "Nouvelle vente Shotgun" }]),
    createParagraph([
      createMessageTemplateVariableNode("new_tickets_label"),
      { type: "text", text: " : " },
      createMessageTemplateVariableNode("event_total_sold"),
    ]),
    createParagraph([createMessageTemplateVariableNode("deal_lines")]),
  ],
};

export const MESSAGE_TEMPLATE_PRESETS: MessageTemplatePreset[] = [
  {
    label: "Simple",
    content: cloneContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT),
  },
  {
    label: "Avec l'event",
    content: {
      type: "doc",
      content: [
        createParagraph([createMessageTemplateVariableNode("event_name")]),
        createParagraph([
          createMessageTemplateVariableNode("event_date"),
          { type: "text", text: " - " },
          createMessageTemplateVariableNode("event_start_time"),
        ]),
        createParagraph([
          createMessageTemplateVariableNode("new_tickets_label"),
          { type: "text", text: " : " },
          createMessageTemplateVariableNode("event_total_sold"),
        ]),
        createParagraph([createMessageTemplateVariableNode("deal_lines")]),
      ],
    },
  },
  {
    label: "Avec montant",
    content: {
      type: "doc",
      content: [
        createParagraph([{ type: "text", text: "Nouvelle vente Shotgun" }]),
        createParagraph([
          createMessageTemplateVariableNode("new_tickets_label"),
          { type: "text", text: " - " },
          createMessageTemplateVariableNode("new_tickets_revenue"),
        ]),
        createParagraph([
          createMessageTemplateVariableNode("first_deal_name"),
          { type: "text", text: " : " },
          createMessageTemplateVariableNode("deal_lines"),
        ]),
        createParagraph([
          { type: "text", text: "Paiement : " },
          createMessageTemplateVariableNode("payment_methods"),
        ]),
      ],
    },
  },
];

function renderInlineNodes(
  content: JSONContent[] | undefined,
  resolver: (key: string, label: string) => string
): string {
  if (!content?.length) {
    return "";
  }

  return content
    .map((node) => {
      if (node.type === "text") {
        return node.text || "";
      }

      if (node.type === SHOTGUN_VARIABLE_NODE_NAME) {
        const key =
          typeof node.attrs?.key === "string" ? node.attrs.key : "unknown";
        const label =
          typeof node.attrs?.label === "string" ? node.attrs.label : key;
        return resolver(key, label);
      }

      if (node.type === "hardBreak") {
        return "\n";
      }

      return renderInlineNodes(node.content, resolver);
    })
    .join("");
}

function normalizeRenderedMessage(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function renderMessageTemplate(
  content: JSONContent,
  resolver: (key: string, label: string) => string
): string {
  const blocks = (content.content || []).map((node) => {
    if (node.type === "paragraph") {
      return renderInlineNodes(node.content, resolver);
    }

    return renderInlineNodes(node.content, resolver);
  });

  return normalizeRenderedMessage(blocks.join("\n\n"));
}

function applyMessageTemplateSettings(
  context: Record<string, string>,
  settings: MessageTemplateSettings
) {
  if (!settings.showEventNameOnlyWhenMultipleEvents) {
    return context;
  }

  const scheduledEventsCount = Number(context.scheduled_events_count || "1");

  if (!Number.isFinite(scheduledEventsCount) || scheduledEventsCount >= 2) {
    return context;
  }

  return {
    ...context,
    event_name: "",
  };
}

export function renderMessageTemplatePreview(
  content: JSONContent,
  context: Record<string, string> = SAMPLE_MESSAGE_TEMPLATE_CONTEXT,
  settings: MessageTemplateSettings = DEFAULT_MESSAGE_TEMPLATE_SETTINGS
) {
  const resolvedContext = applyMessageTemplateSettings(context, settings);

  return renderMessageTemplate(
    content,
    (key, label) => resolvedContext[key] || `[${label}]`
  );
}

export function serializeMessageTemplate(content: JSONContent) {
  return renderMessageTemplate(content, (key) => `{{${key}}}`);
}

export function extractMessageTemplateVariableKeys(content: JSONContent) {
  const keys: string[] = [];

  function walk(nodes: JSONContent[] | undefined) {
    if (!nodes?.length) {
      return;
    }

    for (const node of nodes) {
      if (
        node.type === SHOTGUN_VARIABLE_NODE_NAME &&
        typeof node.attrs?.key === "string" &&
        !keys.includes(node.attrs.key)
      ) {
        keys.push(node.attrs.key);
      }

      walk(node.content);
    }
  }

  walk(content.content);
  return keys;
}

export function readStoredMessageTemplateContent() {
  if (typeof window === "undefined") {
    return cloneContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT);
  }

  const raw = window.localStorage.getItem(MESSAGE_TEMPLATE_STORAGE_KEY);
  if (!raw) {
    return cloneContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT);
  }

  try {
    const parsed = JSON.parse(raw) as JSONContent;

    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }

    return cloneContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT);
  } catch {
    return cloneContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT);
  }
}

function normalizeMessageTemplateSettings(value: unknown) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }

  const candidate = value as Partial<MessageTemplateSettings>;

  return {
    showEventNameOnlyWhenMultipleEvents:
      candidate.showEventNameOnlyWhenMultipleEvents === true,
  };
}

export function saveStoredMessageTemplateContent(content: JSONContent) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    MESSAGE_TEMPLATE_STORAGE_KEY,
    JSON.stringify(content)
  );
}

export function readStoredMessageTemplateSettings() {
  if (typeof window === "undefined") {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }

  const raw = window.localStorage.getItem(MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }

  try {
    return normalizeMessageTemplateSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }
}

export function saveStoredMessageTemplateSettings(
  settings: MessageTemplateSettings
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeMessageTemplateSettings(settings))
  );
}

export function cloneMessageTemplateContent(content: JSONContent) {
  return cloneContent(content);
}
