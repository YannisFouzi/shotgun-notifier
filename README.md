# Shotgun Notifier

Notifications pour chaque nouvelle vente de billet sur [Shotgun.live](https://shotgun.live), avec **polling planifié** sur Cloudflare Workers, persistance **Cloudflare D1**, et **dashboard Next.js** pour lier Telegram et éditer le message (même logique de rendu que le Worker grâce au package partagé).

---

## Sommaire

- [Vue d’ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Structure du dépôt](#structure-du-dépôt)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base Cloudflare D1](#base-cloudflare-d1)
- [Développement local](#développement-local)
- [API du Worker](#api-du-worker)
- [Comportement du cron (sync Shotgun → Telegram)](#comportement-du-cron-sync-shotgun--telegram)
- [Application web (Next.js)](#application-web-nextjs)
- [Déploiement](#déploiement)
- [Sécurité et données sensibles](#sécurité-et-données-sensibles)
- [Dépannage](#dépannage)
- [Licence](#licence)

---

## Vue d’ensemble

1. L’organisateur se connecte au site avec son **token API Shotgun** (JWT Smartboard — même famille que *Settings → Integrations*).
2. Le Worker enregistre l’organisateur en **D1** (`organizers`) et, à chaque minute (**cron**), interroge l’API Shotgun pour les **événements** et les **tickets**.
3. **Premier passage** : *bootstrap* — import massif de l’historique des tickets comptabilisables, **sans envoi Telegram**.
4. **Passes suivantes** : sync incrémental via **curseur** (`sync_state`) ; les **nouvelles ventes** déclenchent un `sendMessage` Telegram vers **un seul** `chat_id` configuré (privé, groupe ou supergroupe).
5. Le **texte** du message est rendu depuis un document **TipTap** (JSON) et des **variables** Shotgun, via `@shotgun-notifier/shared` — **même code** côté Worker et côté prévisualisation web.

Version logique du Worker dans le code : `shotgun-notifier-v3` (`apps/worker/src/index.js`).

---

## Architecture

```
┌─────────────────┐     Bearer: JWT Shotgun      ┌──────────────────────────────┐
│  Next.js (web)  │ ─────────────────────────► │  Cloudflare Worker           │
│  + routes       │     NEXT_PUBLIC_API_URL      │  fetch() + scheduled()       │
│    /api/telegram│                              │  binding: DB (D1)            │
└────────┬────────┘                              └───────────┬──────────────────┘
         │                                                    │
         │ discover / validate-chat                           │ cron * * * * *
         ▼                                                    ▼
┌─────────────────┐                              ┌──────────────────────────────┐
│  api.telegram.org│                              │  api.shotgun.live /          │
│  (Bot API)      │                              │  smartboard-api.shotgun.live │
└─────────────────┘                              └──────────────────────────────┘
```

- **Auth “métier”** : le JWT Shotgun sert à la fois d’identifiant (`organizerId` dans le payload) et de secret : le Worker compare le `Bearer` à `organizers.shotgun_token`.
- Les routes Next `/api/telegram/*` **ne stockent rien** : elles proxifient **getMe / getUpdates / validation de chat** vers Telegram pour le confort du dashboard.

---

## Structure du dépôt

```
apps/
  worker/                 # Cloudflare Worker (point d’entrée : src/index.js)
    migrations/           # SQL D1 (schéma initial)
    src/
      index.js            # Cron + router HTTP REST
      worker_v2.old.js    # Ancienne implémentation KV (référence / historique)
  web/                    # Next.js 16 — landing, dashboard, éditeur de template
packages/
  shared/                 # Templates TipTap, variables, rendu texte (Worker + Web)
```

Monorepo **npm workspaces** ; orchestration dev/build optionnelle avec **Turborepo** (`turbo.json`).

---

## Stack technique

| Zone | Technologies |
|------|----------------|
| Worker | Cloudflare Workers, **D1**, Cron Triggers, fetch vers Shotgun + Telegram |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS v4, TipTap, shadcn-style UI |
| Partagé | `@shotgun-notifier/shared` — types, contenu JSON par défaut, `renderMessageTemplateWithData`, etc. |
| Outils | Wrangler 4.x, ESLint |

---

## Prérequis

- **Node.js** récent (LTS recommandé)
- Compte **Cloudflare** avec Workers + **D1**
- **Token API Shotgun** (JWT organisateur)
- **Bot Telegram** (@BotFather) et un **chat_id** cible (une destination à la fois dans la config actuelle)

---

## Installation

À la racine du dépôt :

```bash
npm install
```

---

## Configuration

### Application web (`apps/web`)

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_API_URL` | URL **complète** du Worker (sans slash final), ex. `https://notifshotgun.<sous-domaine>.workers.dev` |

Sans cette variable, le client utilise le placeholder défini dans `apps/web/src/lib/api.ts` — à remplacer impérativement en production.

### Worker (`apps/worker`)

Le runtime du cron **ne lit pas** `TELEGRAM_TOKEN` / `TELEGRAM_CHAT_ID` / `SG_TOKEN` dans les secrets Wrangler pour la logique v3 : tout est lu depuis **D1** (`organizers`), alimenté par `POST /api/auth` et `PUT /api/config` depuis le dashboard.

> Le fichier `apps/worker/.env.example` peut encore mentionner d’anciennes variables « tout en env » : elles correspondent à l’**ancien** modèle (ex. `worker_v2.old.js`), pas au Worker `index.js` actuel.

---

## Base Cloudflare D1

Schéma défini dans `apps/worker/migrations/0001_initial.sql` :

| Table | Rôle |
|-------|------|
| `organizers` | Un organisateur : `shotgun_token`, `telegram_token`, `telegram_chat_id`, `message_template`, `message_template_settings`, `is_active` |
| `sync_state` | `bootstrapped`, `cursor` incrémental par organisateur |
| `tickets` | Suivi par billet (`counted` / statuts valides + revendus) |
| `event_counts` | Total vendus par événement |
| `deal_counts` | Compteurs par vague / type de billet |

Appliquer les migrations :

```bash
cd apps/worker
npm run db:migrate:local    # D1 local (wrangler dev)
npm run db:migrate:remote   # D1 production
```

Le nom de base et l’`database_id` dans `wrangler.jsonc` doivent correspondre à **votre** instance D1 Cloudflare (adapter si vous clonez le projet).

---

## Développement local

**Worker + D1 local**

```bash
cd apps/worker
npm run db:migrate:local
npx wrangler dev
```

**Next.js**

```bash
cd apps/web
# Définir NEXT_PUBLIC_API_URL vers l’URL affichée par wrangler dev
npm run dev
```

**Les deux** (depuis la racine, si vous utilisez Turbo) :

```bash
npx turbo dev
```

Tester le cron en local (Wrangler) :

```bash
cd apps/worker && npx wrangler dev --test-scheduled
```

---

## API du Worker

Base URL = déploiement Worker. CORS : `Access-Control-Allow-Origin: *` (méthodes GET, POST, PUT, DELETE, OPTIONS).

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| `GET` | `/` ou `/health` | Non | `{ ok, version }` |
| `POST` | `/api/auth` | Non | Body `{ "token": "<JWT Shotgun>" }` — valide le token contre Shotgun, **upsert** `organizers` |
| `GET` | `/api/config` | `Authorization: Bearer <JWT>` | Lit token Telegram, chat_id, template, settings |
| `PUT` | `/api/config` | Bearer | Met à jour `telegramToken`, `telegramChatId`, et optionnellement template (champs partiels) |
| `GET` | `/api/template` | Bearer | Lit le template TipTap + settings |
| `PUT` | `/api/template` | Bearer | Met à jour `messageTemplate` / `messageTemplateSettings` |
| `DELETE` | `/api/account` | Bearer | Supprime l’organisateur et ses lignes associées (cascade logique) |

Toute route protégée exige que le JWT Bearer soit **identique** à `organizers.shotgun_token` en base.

---

## Comportement du cron (sync Shotgun → Telegram)

1. **Sélection** : tous les `organizers` avec `is_active = 1`.
2. **Si `bootstrapped = 0`** : `bootstrapOrganizer` — parcourt les événements Shotgun, agrège jusqu’à `BOOTSTRAP_MAX_PAGES` pages par événement, remplit `tickets`, `event_counts`, `deal_counts`, met à jour le curseur — **aucune notification Telegram**.
3. **Sinon** : `syncOrganizer` — lit jusqu’à `SYNC_MAX_PAGES_PER_RUN` pages par événement depuis le curseur, met à jour les compteurs, détecte les **nouveaux** billets au statut compté (`valid`, `resold`).
4. **Notifications** : une notification **par événement** ayant eu des nouvelles ventes sur ce run ; texte via `renderMessageTemplateWithData` + fallback si le rendu est vide.
5. **Telegram** : `sendMessage` avec `disable_web_page_preview: true`. Si `telegram_token` ou `telegram_chat_id` est vide, aucun envoi (sync silencieux).

---

## Application web (Next.js)

- **/** — Saisie du token Shotgun → `POST` vers le Worker `/api/auth` via `apiLogin`, stockage local du JWT (`localStorage`), redirection `/dashboard`.
- **/dashboard** — Charge la config via `GET /api/config` ; en cas d’échec réseau, repli sur `localStorage` (cache). Configuration Telegram : découverte / validation via routes **Next** `POST /api/telegram/discover` et `POST /api/telegram/validate-chat` ; enregistrement métier via `PUT /api/config` sur le Worker. **Une seule** paire token + `chat_id` active par organisateur.
- **Éditeur de message** — TipTap + variables Shotgun ; sauvegarde locale immédiate + **debounce** ~1,5 s vers `PUT /api/template` sur le Worker (indicateur de sync dans l’UI).

Préviews multi-canaux (WhatsApp, Messenger, Discord) dans le code sont **principalement désactivées** ou réservées à de l’UI future ; le chemin prod documenté ici est **Telegram**.

---

## Déploiement

**Worker**

```bash
cd apps/worker
npm run db:migrate:remote
npx wrangler deploy
```

Vérifier que `wrangler.jsonc` pointe vers la bonne base D1 et que le cron est bien enregistré (`* * * * *` = chaque minute).

**Site Next.js**

```bash
cd apps/web
npm run build
```

Hébergement au choix (**Vercel**, **Cloudflare Pages**, etc.) ; définir `NEXT_PUBLIC_API_URL` vers l’URL **HTTPS** du Worker déployé.

---

## Sécurité et données sensibles

- Le **JWT Shotgun** est stocké côté client (`localStorage`) et renvoyé en **Bearer** au Worker : traiter le dashboard comme un poste de confiance ; prévoir HTTPS partout.
- Le Worker stocke en D1 le **token brut du bot Telegram** et le **chat_id** : accès D1 et logs Cloudflare doivent être restreints selon votre modèle de menace.
- L’API Worker est ouverte en CORS `*` : conçue pour un front public ; la surface sensible est protégée par le Bearer Shotgun + alignement avec la ligne `organizers`.

---

## Dépannage

| Symptôme | Piste |
|----------|--------|
| Dashboard « Impossible de valider » au login | `NEXT_PUBLIC_API_URL` incorrect, Worker injoignable, ou JWT Shotgun refusé par l’API événements Shotgun |
| Aucune notif Telegram | `telegram_token` / `telegram_chat_id` vides en D1, bot pas dans le chat, ou webhook Telegram déjà posé (découverte de chats via `getUpdates` échoue — erreur documentée côté discover) |
| Template vide ou cassé | Fallback automatique vers un message minimal dans le Worker ; vérifier le JSON TipTap via `GET /api/template` |
| Cron silencieux | Observabilité Workers / logs ; vérifier `is_active`, erreurs bootstrap (limite de pages), quotas Shotgun |

---

## Licence

MIT
