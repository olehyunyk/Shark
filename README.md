# Jira Deadline Report (Vercel + Neon)

Звіт по дедлайнах для **SharksCode / MK** з фільтрами по типу (команда), простроченню та JQL в UI.

## Можливості

- Авто-синхронізація **кожні 5 хв** у відкритій вкладці (без Vercel Cron — Hobby дозволяє лише 1 cron/день)
- Фільтри: прострочені, не прострочені, ≤7 днів, без дедлайну
- Сортування: дні прострочення, дедлайн, тип, ключ
- Тип задачі = команда (Affiliate, SMM, SEO, …)
- **JQL редагується на сайті** (зберігається в Neon, не в `.env`)

## Vercel env

| Змінна | Опис |
|--------|------|
| `Shark_*` / `DATABASE_URL` | Neon |
| `JIRA_EMAIL` | Email Atlassian |
| `JIRA_API_TOKEN` | API token |

## Локально

```bash
npm install
cp .env.example .env.local
npm run dev
```

## API

| Endpoint | Опис |
|----------|------|
| `POST /api/sync` | Синхронізація |
| `GET /api/cron/sync` | Ручний/cron виклик sync (опційно) |
| `GET/PUT /api/settings` | JQL в БД |
| `GET /api/status` | Статистика |

Борди: `src/config/jira-boards.ts`
