# Щоденний дайджест BF

- Статус: IDLE
- Джерело: automations
- Модель: grok-4.7-high-fast
- Початок: 2026-10-07 15:19 UTC
- Оновлення: 2026-10-08 17:39 UTC
- Гілка: `cursor/bf-6fac`
- Чат: https://cursor.com/agents/bc-fc3eadfa-2613-4299-91b7-0f57fa4efcde
- Ідентифікатор: `bc-fc3eadfa-2613-4299-91b7-0f57fa4efcde`

Текст нижче — те, що Cursor зберіг для цього чату: повні повідомлення користувача і відповіді асистента. Проміжні виклики інструментів у архів не включені.

## Користувач

Ти — сеньйорний PM на операційному рівні. Щоранку зроби дайджест Feature block’ів, де Project Manager = current user (Aid), і запости в Slack-канал #нотифікатор (ID C0C7FGB0V50).

Jira (підключи Atlassian MCP у Tools цієї automation):
1) JQL: issuetype = "Feature block" AND "Project Manager" = currentUser() AND resolution = Unresolved ORDER BY updated DESC
2) На кожну BF читай: summary, status, created, updated, description, duedate, Target end (customfield_10028), Target start (customfield_10015), TE Product (customfield_16007), Brand, Business Goal, PO, FB Ready, Design Ready, Status Product. PM field = customfield_10745.
3) Легке дерево дітей (статуси, due).

Slack:
- Канал з ключем BF-XXXX у назві (bf-XXXX-…). Відомі: BF-4712→C0BSDD0LET1, BF-4713→C0BSWMM60EM, BF-3450→C0B862V2ZGD, BF-1871→C0C0W0LN21Y, BF-5351→C0BSDC9GBN3, BF-4190→C0BQ1JZE7L1. Якщо каналу на BF немає — шукай канал дитини/PR.
- Recent 7–14 днів + будь-які @Aid / <@U0A2MJT8SJD> → завжди в Action items.

Перед постом обов’язково PM-аудит навіть якщо чат тихий: немає TE/Due і дати в описі; created давно без Target start; діти без due при живій розробці; сира підготовка BF; зависання статусу; залежність без ETA; ризик зриву TE; розсинхрон Slack/Jira.

Формат посту українською:
*Щоденний дайджест BF · <дата>*
*Усі BF* — КОЖНА BF коротким рядком (не ховай «тихі»).
*Action items* — конкретні пункти (проставь TE / спитай ETA у X). Пріоритет: @Aid > зрив/близький TE > дірки дат/підготовки > зависання > гігієна. Краще 3–8 влучних, ніж 20 дрібниць. Якщо немає — «немає».

Один пост у C0C7FGB0V50. Не вигадуй факти. Org: Brand front ≠ DevHub; decision maker часто Marketing/Revenue, не обов’язково PO.

## Асистент

Зроблю ранковий дайджест Feature block’ів, де PM — Aid: спочатку зберу Jira і Slack, потім перевірю дати й ризики і запощу один пост у #нотифікатор.

## Асистент

Jira відповіла. Розберу кожен Feature block і паралельно зберу Slack-канали.

## Асистент

У вибірці 13 відкритих BF. Далі дістану відсутні поля (Brand, PO, готовність) і дерево дітей.

## Асистент

Поля знайдені: Target start у схемі — `customfield_10027`, а `customfield_10015` — Start date. Добираю їх разом із Brand, PO і готовністю, і паралельно читаю Slack.

## Асистент

У треді WP немає відповіді на дедлайн 14.10. Збираю пост із посиланнями лише на те, що підтверджено в Jira й Slack.

## Асистент

Дайджест за 7 жовтня 2026 опубліковано в #нотифікатор: https://sharkscode.slack.com/archives/C0C7FGB0V50/p1791386815335909

У Jira 13 відкритих Feature block, де PM — Oleh Aid. У пості є кожен із них і 8 action items. Найтерміновіше: міт по заблокованому магазину (Corwin, Val, Ink), порожній TE на обидва Halloween до 19.10, рішення по турнірах після fyi Кирила, грумінг New Year до 26.10 і механіка WP до 14.10.
