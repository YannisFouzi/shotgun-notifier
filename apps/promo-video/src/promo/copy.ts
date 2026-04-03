import type { TelegramMessage } from "./mockups/TelegramPreviewDashboard";

export const COPY = {
  demo: {
    line1: "Tu es organisateur sur Shotgun ?",
    line2: "Jusqu’ici, tu ne pouvais pas être\nnotifié à chaque vente.",
    line3: "Aujourd’hui, avec ShotNotif,\nc’est enfin possible.",
    messages: [
      {
        text: "Nouvelle vente\n1 billet vendu : 55\nVAGUE 2 : 5/200",
        time: "14:30",
        delay: 18,
      },
      {
        text: "Nouvelle vente\n3 billets vendus : 58\nVAGUE 2 : 8/200",
        time: "14:31",
        delay: 66,
      },
      {
        text: "Nouvelle vente\n2 billets vendus : 60\nVAGUE 2 : 10/200",
        time: "14:32",
        delay: 114,
      },
    ] satisfies TelegramMessage[],
  },

  editor: {
    label: "Personnalise ta notification",
    templateRows: [
      [{ text: "Nouvelle vente !", type: "text" as const, delay: 48 }],
      [
        {
          text: "Event name",
          key: "event_name" as const,
          type: "chip" as const,
          section: "event" as const,
          delay: 92,
        },
      ],
      [
        {
          text: "Tickets sold (label)",
          key: "new_tickets_label" as const,
          type: "chip" as const,
          section: "summary" as const,
          delay: 138,
        },
        { text: " : ", type: "text" as const, delay: 152 },
        {
          text: "Total tickets sold",
          key: "event_total_sold" as const,
          type: "chip" as const,
          section: "summary" as const,
          delay: 166,
        },
      ],
      [
        {
          text: "Ticket summary",
          key: "deal_lines" as const,
          type: "chip" as const,
          section: "deal" as const,
          delay: 210,
        },
      ],
    ],
    previewContext: {
      event_name: "KODZ X GUETTAPEN X MERCI LILLE",
      new_tickets_label: "1 billet vendu",
      event_total_sold: "57",
      deal_lines: "VAGUE 2 : 4/200",
    },
    palette: [
      {
        label: "EVENT",
        section: "event" as const,
        chips: ["Event name", "Date", "Start time", "Venue", "City"],
      },
      {
        label: "SALES",
        section: "summary" as const,
        chips: [
          "Tickets sold (label)",
          "Total tickets sold",
          "Tickets left",
        ],
      },
      {
        label: "TICKETS",
        section: "deal" as const,
        chips: ["Ticket summary", "Ticket name", "Ticket price"],
      },
    ],
  },

  outro: {
    tagline: "Chaque vente.",
    accent: "Sur Telegram.",
    url: "shotnotif.vercel.app",
    tags: ["Temps réel", "Personnalisable", "Gratuit"],
  },
} as const;
