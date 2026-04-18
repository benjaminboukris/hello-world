# Récap Quotidien

Application Next.js qui scanne tes réseaux sociaux chaque jour et génère un
récap en français avec Claude Haiku 4.5.

- **Reddit** — via l'API officielle (gratuite, script app).
- **Twitter / Instagram / autres** — via flux RSS publics (Nitter, rss.app, etc.).
- **Dashboard web** — récap du jour, historique, gestion des sources.
- **Scheduling** — cron interne (node-cron) + webhook `/api/cron` pour cron externe.
- **Stockage** — SQLite local, aucune dépendance externe.

## Prérequis

- Node.js 20+
- Une clé API Anthropic (`ANTHROPIC_API_KEY`)
- Une app Reddit de type **script** créée sur <https://www.reddit.com/prefs/apps>

## Installation

```bash
npm install
cp .env.example .env
# remplir .env avec tes clés
npm run dev
```

Le dashboard est accessible sur <http://localhost:3000>.

## Configuration

Voir `.env.example`. Variables principales :

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Clé API Anthropic. |
| `ANTHROPIC_MODEL` | Modèle Claude (défaut `claude-haiku-4-5-20251001`). |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Identifiants de l'app script Reddit. |
| `REDDIT_USERNAME` / `REDDIT_PASSWORD` | Compte Reddit utilisé pour authentifier. |
| `REDDIT_USER_AGENT` | User-Agent (ex. `recap-app/0.1 by u/tonpseudo`). |
| `CRON_SECRET` | Secret pour authentifier les appels à `/api/cron`. |
| `DATABASE_PATH` | Chemin du fichier SQLite (défaut `./data/recap.db`). |
| `TZ` | Fuseau horaire pour le cron (défaut `Europe/Paris`). |
| `RECAP_HOUR` | Heure de génération (défaut `7`). |

## Usage

1. Ouvre <http://localhost:3000/sources> et ajoute :
   - Reddit : entre le nom du subreddit (ex. `france`).
   - RSS : entre l'URL complète du flux.
2. Clique sur « Générer maintenant » sur la page d'accueil, ou attends
   l'heure planifiée (`RECAP_HOUR`).
3. Les récaps passés sont listés dans `/historique`.

### Seed initial

```bash
npm run seed
```

Ajoute `r/france`, `r/programming`, `r/worldnews`.

### Cron externe (fallback)

Si tu ne laisses pas le serveur Next tourner 24/7, configure un cron qui appelle
le webhook :

```bash
0 7 * * * curl -s -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://ton-domaine/api/cron
```

Compatible Vercel Cron, GitHub Actions, systemd timer, crontab VPS.

## Où trouver des flux RSS

- **Twitter/X** : instances [Nitter](https://github.com/zedeus/nitter/wiki/Instances)
  (format `https://nitter.xxx/username/rss`). Les instances évoluent souvent ;
  un service type rss.app apporte plus de fiabilité.
- **Instagram** : très restrictif. rss.app ou picuki peuvent fonctionner pour
  certains comptes publics.
- **Blogs / YouTube** : flux RSS natifs (YouTube : `https://www.youtube.com/feeds/videos.xml?channel_id=...`).

## Architecture

```
src/
  db/            schéma SQLite + client
  lib/
    sources/     fetchers Reddit + RSS
    dedupe.ts    hash canonical title+url
    summarize.ts appel Claude Haiku 4.5
    pipeline.ts  fetch → dedupe → summarize → persist
    scheduler.ts node-cron, idempotent
  instrumentation.ts  démarre le scheduler au boot
  app/
    page.tsx             récap du jour
    historique/          liste
    recap/[date]/        détail
    sources/             CRUD sources
    api/
      recap/run/         force run (UI)
      sources/           CRUD
      cron/              webhook externe (auth Bearer)
```

## Build / déploiement

```bash
npm run build
npm run start
```

Le dossier `data/` contient la DB SQLite — pense à le persister en production
(volume Docker, disque persistant, etc.).
