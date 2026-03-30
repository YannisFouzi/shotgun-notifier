/**
 * Message template definitions and rendering logic.
 * Shared between the Worker (notification sending) and the frontend (editor + preview).
 *
 * This module is intentionally dependency-free so it can run in any JS runtime
 * (Cloudflare Worker, Node, browser).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface MessageTemplateSettings {
  showEventNameOnlyWhenMultipleEvents: boolean;
}

/**
 * Minimal JSONContent-compatible type so we don't depend on @tiptap/core here.
 */
export interface TemplateNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TemplateNode[];
  text?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SHOTGUN_VARIABLE_NODE_NAME = "shotgunVariable";

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
  event_url:
    "https://shotgun.live/events/guettapenmercililleinvitentrebelion",
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getMessageTemplateVariable(key: string) {
  return MESSAGE_TEMPLATE_VARIABLES.find((v) => v.key === key);
}

export function getMessageTemplateVariablesForSection(
  section: MessageTemplateSection
) {
  return MESSAGE_TEMPLATE_VARIABLES.filter((v) => v.section === section);
}

export function createMessageTemplateVariableNode(
  key: string,
  labelOverride?: string
): TemplateNode {
  const variable = getMessageTemplateVariable(key);
  return {
    type: SHOTGUN_VARIABLE_NODE_NAME,
    attrs: {
      key,
      label: labelOverride ?? variable?.label ?? key,
    },
  };
}

export function cloneTemplateContent<T>(content: T): T {
  return JSON.parse(JSON.stringify(content)) as T;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

function p(content: TemplateNode[]): TemplateNode {
  return { type: "paragraph", content };
}

function txt(value: string): TemplateNode {
  return { type: "text", text: value };
}

function v(key: string): TemplateNode {
  return createMessageTemplateVariableNode(key);
}

export const DEFAULT_MESSAGE_TEMPLATE_CONTENT: TemplateNode = {
  type: "doc",
  content: [
    p([txt("Nouvelle vente ShotNotif")]),
    p([v("new_tickets_label"), txt(" : "), v("event_total_sold")]),
    p([v("deal_lines")]),
  ],
};

export interface MessageTemplatePreset {
  content: TemplateNode;
  label: string;
}

export const MESSAGE_TEMPLATE_PRESETS: MessageTemplatePreset[] = [
  {
    label: "Minimal",
    content: cloneTemplateContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT),
  },
  {
    label: "Detaille",
    content: {
      type: "doc",
      content: [
        p([v("event_name")]),
        p([v("event_date"), txt(" - "), v("event_start_time")]),
        p([v("new_tickets_label"), txt(" : "), v("event_total_sold")]),
        p([v("deal_lines")]),
      ],
    },
  },
  {
    label: "Pro",
    content: {
      type: "doc",
      content: [
        p([txt("Nouvelle vente ShotNotif")]),
        p([v("new_tickets_label"), txt(" - "), v("new_tickets_revenue")]),
        p([v("first_deal_name"), txt(" : "), v("deal_lines")]),
        p([txt("Paiement : "), v("payment_methods")]),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

function renderInlineNodes(
  content: TemplateNode[] | undefined,
  resolver: (key: string, label: string) => string
): string {
  if (!content?.length) return "";

  return content
    .map((node) => {
      if (node.type === "text") return node.text || "";

      if (node.type === SHOTGUN_VARIABLE_NODE_NAME) {
        const key =
          typeof node.attrs?.key === "string" ? node.attrs.key : "unknown";
        const label =
          typeof node.attrs?.label === "string"
            ? (node.attrs.label as string)
            : key;
        return resolver(key, label);
      }

      if (node.type === "hardBreak") return "\n";

      return renderInlineNodes(node.content, resolver);
    })
    .join("");
}

function normalizeRenderedMessage(value: string) {
  return value
    .split("\n")
    .map((line) =>
      line
        // Espace double quand une variable vide disparaît en ligne (ex. nom d'event masqué)
        .replace(/[ \t]{2,}/g, " ")
        .replace(/[ \t]+$/g, "")
    )
    .join("\n")
    .trim();
}

function renderMessageTemplate(
  content: TemplateNode,
  resolver: (key: string, label: string) => string
): string {
  const blocks = (content.content || []).map((node) =>
    renderInlineNodes(node.content, resolver)
  );
  // Paragraphes vides supprimés (ex. ligne avec seulement event_name masqué)
  const visible = blocks.filter((block) => block.trim().length > 0);
  // Un seul \n entre paragraphes → pas de « trou » entre l’intro et la suite
  return normalizeRenderedMessage(visible.join("\n"));
}

function applyMessageTemplateSettings(
  context: Record<string, string>,
  settings: MessageTemplateSettings
) {
  if (!settings.showEventNameOnlyWhenMultipleEvents) return context;

  const count = Number(context.scheduled_events_count || "1");
  if (!Number.isFinite(count) || count >= 2) return context;

  return { ...context, event_name: "" };
}

/**
 * Render a template with sample data for preview (frontend).
 */
export function renderMessageTemplatePreview(
  content: TemplateNode,
  context: Record<string, string> = SAMPLE_MESSAGE_TEMPLATE_CONTEXT,
  settings: MessageTemplateSettings = DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
  resolveLabel?: (key: string, fallbackLabel: string) => string
) {
  const resolved = applyMessageTemplateSettings(context, settings);
  return renderMessageTemplate(
    content,
    (key, label) => {
      if (Object.prototype.hasOwnProperty.call(resolved, key)) {
        return resolved[key] ?? "";
      }
      return `[${resolveLabel ? resolveLabel(key, label) : label}]`;
    }
  );
}

/**
 * Render a template with real notification data (Worker).
 */
export function renderMessageTemplateWithData(
  content: TemplateNode,
  data: Record<string, string>,
  settings: MessageTemplateSettings = DEFAULT_MESSAGE_TEMPLATE_SETTINGS
) {
  const resolved = applyMessageTemplateSettings(data, settings);
  return renderMessageTemplate(content, (key) => resolved[key] || "");
}

/**
 * Serialize a template to a string with {{variable}} placeholders.
 */
export function serializeMessageTemplate(content: TemplateNode) {
  return renderMessageTemplate(content, (key) => `{{${key}}}`);
}

/**
 * Extract all variable keys used in a template.
 */
export function extractMessageTemplateVariableKeys(content: TemplateNode) {
  const keys: string[] = [];

  function walk(nodes: TemplateNode[] | undefined) {
    if (!nodes?.length) return;

    for (const node of nodes) {
      if (
        node.type === SHOTGUN_VARIABLE_NODE_NAME &&
        typeof node.attrs?.key === "string" &&
        !keys.includes(node.attrs.key as string)
      ) {
        keys.push(node.attrs.key as string);
      }
      walk(node.content);
    }
  }

  walk(content.content);
  return keys;
}

// ---------------------------------------------------------------------------
// Settings normalization
// ---------------------------------------------------------------------------

export function normalizeMessageTemplateSettings(
  value: unknown
): MessageTemplateSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }

  const candidate = value as Partial<MessageTemplateSettings>;
  return {
    showEventNameOnlyWhenMultipleEvents:
      candidate.showEventNameOnlyWhenMultipleEvents === true,
  };
}
