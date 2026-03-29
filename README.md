# Shotgun Notifier

Notifications en temps reel pour chaque vente de billet sur [Shotgun.live](https://shotgun.live).

Un worker Cloudflare surveille vos events toutes les minutes et envoie une notification Telegram a chaque nouvelle vente, avec le detail par vague/categorie.

Le dashboard web permet de configurer le canal de notification et de composer le message avec un editeur visuel.

## Structure

```
apps/
  worker/     Cloudflare Worker — polling + notifications Telegram
  web/        Next.js — dashboard de configuration + editeur de message
packages/
  shared/     Constantes partagees
```

## Stack

- **Worker** : Cloudflare Workers, KV Storage, Cron Triggers
- **Web** : Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Tiptap
- **Monorepo** : Turborepo + npm workspaces

## Installation

```bash
npm install
```

## Developpement

```bash
# Lancer les deux apps en parallele
npx turbo dev

# Ou separement
cd apps/web && npm run dev
cd apps/worker && npx wrangler dev --test-scheduled
```

## Configuration du Worker

Copiez le fichier d'exemple et remplissez vos identifiants :

```bash
cp apps/worker/.env.example apps/worker/.dev.vars
```

| Variable | Description |
|---|---|
| `SG_ORG_ID` | ID de votre organisation Shotgun |
| `SG_TOKEN` | Token API Shotgun (Smartboard > Settings > Integrations) |
| `TELEGRAM_TOKEN` | Token de votre bot Telegram (@BotFather) |
| `TELEGRAM_CHAT_ID` | ID du chat/groupe Telegram |

## Deploiement

```bash
# Worker → Cloudflare
cd apps/worker && npx wrangler deploy

# Web → Vercel / Cloudflare Pages
cd apps/web && npm run build
```

## Fonctionnement

1. Le worker s'execute toutes les minutes via un cron trigger
2. Il recupere la liste des events futurs via l'API Shotgun
3. Pour chaque event, il compare les billets vendus avec l'etat precedent (stocke en KV)
4. Si de nouvelles ventes sont detectees, il envoie une notification groupee par event avec le detail des vagues

### Exemple de notification

```
Nouvelle vente Shotgun
2 billets vendus : 57
VAGUE 2 : 4/200
```

## Licence

MIT
