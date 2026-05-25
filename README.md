# Jira Deadline Report (Vercel + Neon)

Веб-застосунок на **Next.js**, який синхронізує задачі з **Jira Cloud**, зберігає їх у **Neon Postgres** і показує звіт по дедлайнах.

## Стек

- [Next.js 15](https://nextjs.org) на Vercel
- [Neon](https://neon.tech) PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team)
- Jira REST API v3 (`/rest/api/3/search/jql`)

## Локальний запуск

```bash
npm install
cp .env.example .env.local
# Заповніть DATABASE_URL, JIRA_*, CRON_SECRET
npm run db:migrate
npm run dev
```

Відкрийте http://localhost:3000

## Деплой на Vercel

1. Створіть проєкт на [vercel.com](https://vercel.com) з цього репозиторію.
2. У **Storage** підключіть **Neon** — з’являться змінні з префіксом **`Shark_`** (назва інтеграції). Код підхоплює їх автоматично.
3. Додайте змінні середовища:

| Змінна | Опис |
|--------|------|
| `Shark_POSTGRES_URL` або `Shark_*` | з Neon (авто; достатньо host/user/password/database) |
| `DATABASE_URL` | альтернатива локально або вручну на Vercel |
| `JIRA_BASE_URL` | `https://sharkscode.atlassian.net` |
| `JIRA_EMAIL` | email Atlassian |
| `JIRA_API_TOKEN` | [API token](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_JQL` | (опційно) JQL за замовчуванням |
| `CRON_SECRET` | довгий випадковий рядок |

4. **Міграція БД**: під час `npm run build` на Vercel автоматично виконується `drizzle-kit migrate` (таблиці `jira_issues`, `sync_runs`). Якщо build уже пройшов без міграції, один раз викличте:

```bash
curl -X POST https://<your-app>.vercel.app/api/migrate \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Або локально з production `DATABASE_URL`: `npm run db:migrate`.

5. **Cron**: у `vercel.json` налаштовано щоденну синхронізацію о **06:00 UTC**. Vercel надсилає `Authorization: Bearer <CRON_SECRET>` автоматично, якщо `CRON_SECRET` задано в env.

## API

| Endpoint | Метод | Опис |
|----------|-------|------|
| `/api/sync` | POST | Ручна синхронізація (`Authorization: Bearer CRON_SECRET`) |
| `/api/cron/sync` | GET | Cron (те саме) |
| `/api/migrate` | POST | Idempotent міграція таблиць (`Authorization: Bearer CRON_SECRET`) |
| `/api/report` | GET | JSON-звіт з БД |

## JQL за замовчуванням

Проєкт **MK** на `sharkscode.atlassian.net`:

```text
project = MK AND resolution = Unresolved ORDER BY duedate ASC
```

Перевизначіть через `JIRA_JQL` у Vercel, якщо потрібен інший фільтр.

## Категорії дедлайнів

- **Прострочені** — дедлайн у минулому
- **Дедлайн сьогодні**
- **Цей тиждень** — до неділі
- **Пізніше**
- **Без дедлайну**
