import type { LegalDocument } from "./types";

export const CGU_DOCUMENTS: Record<"fr" | "en", LegalDocument> = {
  fr: {
    title: "Conditions générales d’utilisation",
    lastUpdatedLabel: "Dernière mise à jour : 29 mars 2026",
    lastUpdatedISO: "2026-03-29",
    sections: [
      {
        title: "1. Objet",
        paragraphs: [
          "Les présentes conditions générales d’utilisation (« CGU ») régissent l’accès et l’utilisation du service en ligne ShotNotif (le « Service »), proposé par l’éditeur identifié ci-dessous.",
          "En accédant au tableau de bord ou en utilisant le Service, vous acceptez sans réserve les présentes CGU. Si vous n’acceptez pas ces conditions, vous ne devez pas utiliser le Service.",
        ],
      },
      {
        title: "2. Éditeur du Service et hébergement",
        paragraphs: [
          "Le Service ShotNotif est édité par l’exploitant joignable à l’adresse contact@fouzi-dev.fr.",
          "Hébergement de l’interface web : les contenus peuvent être servis via l’infrastructure Vercel Inc. (États-Unis) et/ou équivalent selon la configuration de déploiement.",
          "Traitement et API : certaines fonctionnalités peuvent être exécutées via Cloudflare Workers et bases de données associées (Cloudflare, Inc.), selon la configuration technique en vigueur.",
        ],
      },
      {
        title: "3. Description du Service",
        paragraphs: [
          "ShotNotif permet à un organisateur d’événements utilisant la plateforme Shotgun.live de configurer des notifications (notamment via Telegram) liées à l’activité de ses ventes, dans les limites techniques et des API proposées par Shotgun et par les services tiers concernés.",
          "ShotNotif est un outil d’intégration indépendant : il n’est pas édité par Shotgun. Les marques Shotgun et Shotgun.live désignent des services tiers. L’éditeur du Service n’est pas affilié à Shotgun sauf mention contraire explicite.",
          "Le Service peut évoluer (fonctionnalités, limites, disponibilité). L’éditeur s’efforce d’en assurer la continuité sans garantir une disponibilité absolue.",
        ],
      },
      {
        title: "4. Accès au Service",
        paragraphs: [
          "L’accès au tableau de bord suppose l’usage d’un jeton d’API Shotgun (ou mécanisme équivalent) conformément à la documentation Shotgun. Vous demeurez seul responsable de la confidentialité de ce jeton.",
          "Vous déclarez disposer de la capacité juridique et, le cas échéant, des autorisations nécessaires pour lier l’organisation représentée au Service.",
          "L’éditeur peut suspendre ou refuser l’accès en cas de violation des présentes CGU, d’usage abusif, ou pour des motifs de sécurité ou conformité.",
        ],
      },
      {
        title: "5. Obligations de l’utilisateur",
        paragraphs: [
          "Vous vous engagez à utiliser le Service de manière loyale, dans le respect des lois et règlements applicables, des droits des tiers, et des conditions d’utilisation des plateformes Shotgun et Telegram (ou autres canaux configurés).",
          "Vous ne devez pas tenter d’accéder de manière non autorisée aux systèmes, d’introduire des contenus illicites ou nuisibles, ni de porter atteinte à la sécurité ou à la stabilité du Service.",
          "Vous êtes responsable des contenus que vous configurez (modèles de messages, canaux) et de leur conformité (données personnelles des destinataires, obligations d’information, etc.).",
        ],
      },
      {
        title: "6. Données personnelles",
        paragraphs: [
          "Des données personnelles peuvent être traitées pour la fourniture du Service (par exemple : identifiants techniques, jetons nécessaires aux intégrations, journaux techniques). Le traitement est régi par le règlement (UE) 2016/679 (RGPD) et la loi française « Informatique et Libertés » lorsqu’elle s’applique.",
          "Une politique de confidentialité détaillée peut compléter les présentes CGU. Vous pouvez exercer vos droits (accès, rectification, opposition, effacement dans les limites légales) en écrivant à contact@fouzi-dev.fr.",
          "Les traceurs et cookies éventuels sont gérés conformément aux obligations applicables (information, consentement lorsque requis).",
        ],
      },
      {
        title: "7. Propriété intellectuelle",
        paragraphs: [
          "Les éléments du Service (logiciels, charte graphique, textes propres à ShotNotif hors contenus utilisateurs) sont protégés. Toute reproduction ou exploitation non autorisée est interdite.",
          "Vous conservez vos contenus ; vous accordez à l’éditeur, le cas échéant, une licence limitée pour les héberger et les traiter strictement aux fins d’exécution du Service.",
        ],
      },
      {
        title: "8. Responsabilité",
        paragraphs: [
          "Le Service est fourni « en l’état ». Dans les limites autorisées par la loi, l’éditeur décline toute responsabilité pour les dommages indirects, perte de données, perte d’exploitation, ou manque à gagner.",
          "L’éditeur n’est pas responsable des indisponibilités ou dysfonctionnements imputables à Shotgun, Telegram, à votre connexion Internet, ou à des cas de force majeure.",
        ],
      },
      {
        title: "9. Durée, résiliation et suppression du compte",
        paragraphs: [
          "Les CGU s’appliquent pendant toute la durée d’utilisation du Service.",
          "Vous pouvez cesser d’utiliser le Service à tout moment. Lorsque la fonctionnalité est proposée, la suppression de votre espace depuis le tableau de bord entraîne l’effacement des données associées côté Service dans les conditions techniques décrites sur l’interface, sans préjudice des obligations légales de conservation éventuelles.",
        ],
      },
      {
        title: "10. Droit applicable et litiges",
        paragraphs: [
          "Les présentes CGU sont soumises au droit français, sous réserve d’une disposition impérative d’ordre public plus favorable dans le pays du consommateur lorsque celui-ci agit à des fins personnelles.",
          "En cas de litige, les parties privilégient une solution amiable. À défaut, les tribunaux français sont compétents, sous réserve des règles impératives de compétence applicables aux consommateurs.",
        ],
      },
      {
        title: "11. Modification des CGU",
        paragraphs: [
          "L’éditeur peut modifier les CGU ; la date de mise à jour figurant en tête de document fait foi. L’utilisation du Service après modification vaut acceptation des nouvelles conditions, sauf disposition légale contraire.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of use",
    lastUpdatedLabel: "Last updated: 29 March 2026",
    lastUpdatedISO: "2026-03-29",
    sections: [
      {
        title: "1. Purpose",
        paragraphs: [
          "These terms of use (“Terms”) govern access to and use of the online service ShotNotif (the “Service”), provided by the publisher identified below.",
          "By accessing the dashboard or using the Service you agree to these Terms. If you do not agree, you must not use the Service.",
        ],
      },
      {
        title: "2. Publisher and hosting",
        paragraphs: [
          "ShotNotif is operated by the publisher reachable at contact@fouzi-dev.fr.",
          "The web interface may be hosted on Vercel Inc. (United States) or equivalent infrastructure depending on deployment.",
          "API and processing may run on Cloudflare Workers and related databases (Cloudflare, Inc.) depending on technical configuration.",
        ],
      },
      {
        title: "3. Description of the Service",
        paragraphs: [
          "ShotNotif helps event organizers using Shotgun.live configure notifications (including via Telegram) related to ticket sales, within the limits of Shotgun’s and third parties’ APIs.",
          "ShotNotif is an independent integration tool and is not operated by Shotgun. Shotgun and Shotgun.live are third-party services. The publisher is not affiliated with Shotgun unless explicitly stated.",
          "The Service may change over time. The publisher aims for reasonable availability but does not guarantee uninterrupted access.",
        ],
      },
      {
        title: "4. Access",
        paragraphs: [
          "Dashboard access requires an API token or credential issued by Shotgun (or equivalent) per Shotgun’s documentation. You are responsible for keeping that token confidential.",
          "You represent that you have legal capacity and, where relevant, authority to connect the represented organization to the Service.",
          "The publisher may suspend access for breach of these Terms, abuse, security, or compliance reasons.",
        ],
      },
      {
        title: "5. Your obligations",
        paragraphs: [
          "You must use the Service lawfully and in compliance with Shotgun’s and Telegram’s (or other channels’) terms.",
          "You must not attempt unauthorized access, inject unlawful or harmful content, or harm security or stability.",
          "You are responsible for message templates and channels you configure, including privacy obligations toward recipients.",
        ],
      },
      {
        title: "6. Personal data",
        paragraphs: [
          "Personal data may be processed to provide the Service (e.g. technical identifiers, integration tokens, logs). Processing follows the GDPR and applicable French law where it applies.",
          "A separate privacy policy may provide further detail. You may exercise GDPR rights (access, rectification, erasure where applicable, objection) by emailing contact@fouzi-dev.fr.",
          "Cookies and trackers, if any, follow applicable consent and information rules.",
        ],
      },
      {
        title: "7. Intellectual property",
        paragraphs: [
          "Service elements (software, branding, ShotNotif-specific text excluding user content) are protected. Unauthorized reproduction is prohibited.",
          "You retain your content; you grant the publisher a limited licence to host and process it solely to run the Service.",
        ],
      },
      {
        title: "8. Liability",
        paragraphs: [
          "The Service is provided “as is”. To the fullest extent permitted by law, the publisher disclaims liability for indirect loss, data loss, business interruption, or lost profits.",
          "The publisher is not liable for outages or faults caused by Shotgun, Telegram, your network, or force majeure.",
        ],
      },
      {
        title: "9. Term and account deletion",
        paragraphs: [
          "These Terms apply while you use the Service.",
          "You may stop using the Service at any time. Where offered, deleting your workspace from the dashboard removes associated data on the Service side as described in the interface, subject to legal retention duties.",
        ],
      },
      {
        title: "10. Governing law and disputes",
        paragraphs: [
          "These Terms are governed by French law, without prejudice to mandatory consumer protections in your country of residence where you act as a consumer.",
          "Parties will seek an amicable solution first. Failing that, French courts shall have jurisdiction, subject to overriding consumer jurisdiction rules.",
        ],
      },
      {
        title: "11. Changes",
        paragraphs: [
          "The publisher may update these Terms; the date at the top prevails. Continued use after changes constitutes acceptance unless mandatory law provides otherwise.",
        ],
      },
    ],
  },
};
