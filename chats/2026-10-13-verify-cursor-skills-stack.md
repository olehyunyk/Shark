# Verify Cursor skills stack

- Статус: ERROR
- Джерело: desktop
- Модель: claude-opus-5-5-medium
- Початок: 2026-10-13 08:42 UTC
- Оновлення: 2026-10-13 08:44 UTC
- Чат: https://cursor.com/agents/bc-bab880bc-9107-5e3d-869b-6d42944d65cd
- Ідентифікатор: `bc-bab880bc-9107-5e3d-869b-6d42944d65cd`

Текст нижче — те, що Cursor зберіг для цього чату: повні повідомлення користувача і відповіді асистента. Проміжні виклики інструментів у архів не включені.

## Користувач

Project: Project Health Monitor (internal PM tool, Next.js likely). Context: /cursor/stores/bc-09ae5caa-9aa7-47d8-ab36-ebd1e3bf3d25/docs/project-context.md (see "Tooling idea under evaluation").

Task: research on the web and verify a lean, non-redundant set of agent skills/tools for building this product with Cursor so it looks and works like a real product, not generic "AI dashboard" output. Read-only research, no code changes, no PR.
- Verify each suggested item exists, is maintained, works with Cursor (SKILL.md / rules / MCP), exact repo URL and install method: Anthropic frontend-design skill, Product Manager skill (Aleksander Dytko starter kit), Paweł Huryn PM skills framework (problem-statement, user-story-splitting), UI/UX Pro Max, Vercel web-design-guidelines, Vercel react-best-practices, Playwright MCP, "Frontend Agent Skills".
- Find better alternatives if any (PM/PO, UX, design systems, data-dense enterprise UI, testing, LLM evals). Prefer quality over quantity: max ~8 recommended, flag overlaps and conflicts.
- Be critical: mark what is hype or unverifiable.
Write the result to /cursor/stores/bc-09ae5caa-9aa7-47d8-ab36-ebd1e3bf3d25/docs/skills-stack.md: table of recommended items (name, URL, purpose, install command, install now / reference / skip), plus short rationale. Return a short summary.

## Асистент

I'll read the project context first, then verify each item on the web.

## Асистент

Now verifying the candidate repos directly via the GitHub API.

## Асистент

Dytko's kit is a personal PM productivity workspace, not a product-building skill. Checking contents of the other repos now.

## Асистент

`problem-statement` and `user-story-splitting` don't exist in Huryn's repo. I believe those names come from Dean Peters' repo; checking.

## Асистент

Dean Peters' repo is CC BY-NC-SA 4.0 (non-commercial), which I'll flag for an internal company tool. Now checking alternatives: Impeccable, shadcn's skill/MCP, evals tooling, and testing options.
