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
| `JIRA_BASE_URL` | `https://ваша-компанія.atlassian.net` |
| `JIRA_EMAIL` | email Atlassian |
| `JIRA_API_TOKEN` | [API token](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_JQL` | (опційно) JQL за замовчуванням |
| `CRON_SECRET` | довгий випадковий рядок |

4. Після деплою виконайте міграцію БД (один раз):

```bash
# локально з production DATABASE_URL або через Neon SQL Editor:
npm run db:migrate
```

Або вставте SQL з `drizzle/0000_init.sql` у Neon Console.

5. **Cron**: у `vercel.json` налаштовано щоденну синхронізацію о **06:00 UTC**. Vercel надсилає `Authorization: Bearer <CRON_SECRET>` автоматично, якщо `CRON_SECRET` задано в env.

## API

| Endpoint | Метод | Опис |
|----------|-------|------|
| `/api/sync` | POST | Ручна синхронізація (`Authorization: Bearer CRON_SECRET`) |
| `/api/cron/sync` | GET | Cron (те саме) |
| `/api/report` | GET | JSON-звіт з БД |

## JQL за замовчуванням

```text
assignee = currentUser() AND resolution = Unresolved ORDER BY duedate ASC
```

Приклад для команди:

```text
project = TEAM AND resolution = Unresolved ORDER BY duedate ASC
```

## Категорії дедлайнів

- **Прострочені** — дедлайн у минулому
- **Дедлайн сьогодні**
- **Цей тиждень** — до неділі
- **Пізніше**
- **Без дедлайну**
