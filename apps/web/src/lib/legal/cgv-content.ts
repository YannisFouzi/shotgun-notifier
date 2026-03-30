import type { LegalDocument } from "./types";

export const CGV_DOCUMENTS: Record<"fr" | "en", LegalDocument> = {
  fr: {
    title: "Conditions générales de vente",
    lastUpdatedLabel: "Dernière mise à jour : 29 mars 2026",
    lastUpdatedISO: "2026-03-29",
    sections: [
      {
        title: "1. Objet",
        paragraphs: [
          "Les présentes conditions générales de vente (« CGV ») régissent les relations contractuelles entre l’éditeur du Service ShotNotif (« le Vendeur ») et toute personne physique ou morale (« le Client ») commandant une prestation payante le cas échéant.",
          "Elles complètent les conditions générales d’utilisation (CGU), lesquelles restent applicables pour l’usage du Service.",
        ],
      },
      {
        title: "2. Prestations et tarification",
        paragraphs: [
          "À la date indiquée en tête du présent document, le Service peut être proposé gratuitement pour certaines fonctionnalités. Toute introduction de fonctionnalités payantes sera indiquée avant toute validation de commande (prix TTC ou HT selon le cas, TVA applicable, description de la prestation).",
          "Les tarifs affichés prévalent sur toute autre documentation non contractuelle. Le Vendeur peut modifier ses tarifs ; les prestations déjà commandées restent facturées au prix convenu au jour de la commande.",
        ],
      },
      {
        title: "3. Commande et formation du contrat",
        paragraphs: [
          "Toute commande de prestation payante vaut acceptation des CGV en vigueur au moment de la commande.",
          "Le contrat est formé lors de la confirmation de commande par le Vendeur ou, le cas échéant, lors du paiement réussi selon le parcours décrit sur le site.",
          "Le Vendeur se réserve le droit de refuser une commande en cas de litige antérieur, d’erreur manifeste de prix, ou de motif légitime.",
        ],
      },
      {
        title: "4. Paiement",
        paragraphs: [
          "Dès lors qu’une prestation payante est proposée et acceptée sur le site, le paiement s’effectue selon les moyens indiqués au moment de la commande (carte bancaire, prélèvement ou autre). Les délais et conditions de débit figurent sur le tunnel de paiement.",
          "En cas de défaut de paiement, le Vendeur peut suspendre l’exécution de la prestation et résilier la commande après mise en demeure restée infructueuse.",
        ],
      },
      {
        title: "5. Exécution des prestations numériques",
        paragraphs: [
          "Les prestations consistant en l’accès à un service numérique sont exécutées, sauf stipulation contraire, à compter de la confirmation de commande ou de la mise à disposition effective du Service.",
          "Le Client est responsable de la configuration de ses intégrations (Shotgun, Telegram, etc.) et de la conformité de ses usages.",
        ],
      },
      {
        title: "6. Droit de rétractation (consommateurs)",
        paragraphs: [
          "Lorsque le Client est un consommateur au sens du Code de la consommation et que le contrat est conclu à distance, il dispose d’un délai de quatorze (14) jours pour exercer son droit de rétractation, sauf exceptions légales.",
          "Pour un contenu numérique non fourni sur un support matériel, le droit de rétractation peut ne pas s’appliquer si le Client a expressément demandé l’exécution immédiate et renonce à son droit de rétractation conformément à l’article L.221-28 du Code de la consommation. Le cas échéant, une case à cocher ou mécanisme équivalent sera proposé avant validation.",
          "Les modalités d’exercice du droit de rétractation pourront être précisées sur le site ou communiquées sur demande à contact@fouzi-dev.fr.",
        ],
      },
      {
        title: "7. Garanties légales",
        paragraphs: [
          "Les garanties légales (notamment conformité du bien ou du service numérique, défauts de conformité, vices cachés dans les conditions du Code de la consommation et du Code civil) s’appliquent sans préjudice des exclusions légales.",
        ],
      },
      {
        title: "8. Réclamations et médiation",
        paragraphs: [
          "Pour toute réclamation relative à une commande, le Client peut écrire à contact@fouzi-dev.fr.",
          "Si le Client est un consommateur, il peut recourir à la médiation de la consommation dans les conditions du Code de la consommation (informations auprès des autorités ou organismes compétents, par exemple via les canaux publics dédiés).",
        ],
      },
      {
        title: "9. Droit applicable",
        paragraphs: [
          "Les présentes CGV sont soumises au droit français. Les règles impératives du pays du consommateur peuvent demeurer applicables lorsque celui-ci agit à des fins personnelles.",
        ],
      },
    ],
  },
  en: {
    title: "General terms of sale",
    lastUpdatedLabel: "Last updated: 29 March 2026",
    lastUpdatedISO: "2026-03-29",
    sections: [
      {
        title: "1. Purpose",
        paragraphs: [
          "These general terms of sale (“GTS”) govern the contractual relationship between the publisher of ShotNotif (“Seller”) and any customer (“Customer”) purchasing paid services where applicable.",
          "They complement the terms of use (ToU), which continue to apply to use of the Service.",
        ],
      },
      {
        title: "2. Services and pricing",
        paragraphs: [
          "As of the date at the top of this page, parts of the Service may be free. Any paid features will show price (incl. or excl. VAT as required), taxes, and service description before you confirm purchase.",
          "Displayed prices prevail over non-contractual material. The Seller may change prices; orders already placed remain at the agreed price.",
        ],
      },
      {
        title: "3. Order and contract formation",
        paragraphs: [
          "Placing a paid order means accepting the GTS in force at that time.",
          "The contract is formed on Seller confirmation or successful payment, as described in the checkout flow.",
          "The Seller may refuse an order for prior dispute, obvious pricing error, or legitimate reason.",
        ],
      },
      {
        title: "4. Payment",
        paragraphs: [
          "Where a paid service is offered and accepted, payment uses the methods shown at checkout. Timing of charge is stated in the payment flow.",
          "If payment fails, the Seller may suspend performance and cancel the order after formal notice.",
        ],
      },
      {
        title: "5. Digital performance",
        paragraphs: [
          "Digital services run from order confirmation or actual access, unless stated otherwise.",
          "The Customer is responsible for configuring integrations (Shotgun, Telegram, etc.) and lawful use.",
        ],
      },
      {
        title: "6. Right of withdrawal (consumers)",
        paragraphs: [
          "Where the Customer is a consumer under EU/FR law and the contract is concluded at a distance, a 14-day withdrawal right may apply, subject to legal exceptions.",
          "For digital content not supplied on a tangible medium, withdrawal may not apply if the Customer expressly requests immediate performance and waives withdrawal as permitted by law; a clear tick-box or equivalent will be used where required.",
          "How to exercise withdrawal will be described on the site or provided on request at contact@fouzi-dev.fr.",
        ],
      },
      {
        title: "7. Legal warranties",
        paragraphs: [
          "Mandatory legal warranties (conformity, hidden defects as applicable under French law) apply where relevant.",
        ],
      },
      {
        title: "8. Complaints and mediation",
        paragraphs: [
          "For order-related complaints, email contact@fouzi-dev.fr.",
          "Where the Customer is a consumer, consumer mediation under French law may be available (see official information channels for dispute resolution).",
        ],
      },
      {
        title: "9. Governing law",
        paragraphs: [
          "These GTS are governed by French law, without prejudice to mandatory consumer rules in the Customer’s country when acting as a consumer.",
        ],
      },
    ],
  },
};
