# Jira Deadline Report (Vercel + Neon)

Звіт по дедлайнах для **SharksCode / MK** з фільтрами по типу (команда), простроченню та JQL в UI.

## Можливості

- Авто-синхронізація **кожні 5 хв** (Vercel Cron + оновлення сторінки в браузері)
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
| `GET /api/cron/sync` | Cron (кожні 5 хв) |
| `GET/PUT /api/settings` | JQL в БД |
| `GET /api/status` | Статистика |

Борди: `src/config/jira-boards.ts`
