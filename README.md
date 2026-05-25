# Jira Deadline Report (Vercel + Neon)

Звіт по дедлайнах для **SharksCode / проєкт MK** на Next.js + Neon.

Jira URL і борди захардкожені в `src/config/jira-boards.ts` — у Vercel потрібні лише **email + API token**.

## Локально

```bash
npm install
cp .env.example .env.local
# JIRA_EMAIL, JIRA_API_TOKEN, DATABASE_URL або Shark_*
npm run db:migrate
npm run dev
```

## Vercel env

| Змінна | Опис |
|--------|------|
| `Shark_*` / `DATABASE_URL` | Neon (інтеграція) |
| `JIRA_EMAIL` | Email Atlassian |
| `JIRA_API_TOKEN` | [API token](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_JQL` | (опційно) перевизначити JQL |

## Додати іншу борду

У `src/config/jira-boards.ts` додайте об’єкт у `JIRA_BOARDS`:

```ts
{
  id: "other",
  projectKey: "XXX",
  name: "Назва",
  boardUrl: "https://sharkscode.atlassian.net/browse/XXX",
  jql: "project = XXX AND statusCategory != Done ORDER BY duedate ASC",
},
```

Синхронізація: `POST /api/sync?board=mk`

## API

| Endpoint | Опис |
|----------|------|
| `POST /api/sync` | Синхронізація з Jira |
| `GET /api/report` | JSON-звіт |
| `GET /api/status` | Стан БД і останній sync |
| `GET /api/jira/debug` | Тест Jira (скільки задач повертає API) |

Міграція БД виконується при `npm run build` на Vercel (`scripts/migrate.mjs`).
