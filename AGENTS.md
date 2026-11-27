# BoomAI: repository map

This repo holds skill packs that `scripts/install.mjs` copies into projects (`npx -y github:Mohamed-Khalil67/BoomAI <pack>`). This file is for agents working **on this repo**; it is not copied into projects. Maintenance rules: [docs/MAINTAINING.md](docs/MAINTAINING.md).

## Packs
Each pack is self-contained: an `AGENTS.md` block copied into the project's `AGENTS.md`, topic docs, skills by category, its MCP servers, and a `vendor.json` for third-party skills. There are no agent definitions: everything is a skill, so it works in every tool.

| Pack | Block | Skills map | Docs | Extra |
|---|---|---|---|---|
| frontend (Angular) | [packs/frontend/AGENTS.md](packs/frontend/AGENTS.md) | [packs/frontend/skills/AGENTS.md](packs/frontend/skills/AGENTS.md) | [angular](packs/frontend/docs/agents/angular.md), [accessibility](packs/frontend/docs/agents/accessibility.md) | [vendor.json](packs/frontend/vendor.json), [mcp.json](packs/frontend/mcp.json) |
| backend (NestJS) | [packs/backend/AGENTS.md](packs/backend/AGENTS.md) | [packs/backend/skills/AGENTS.md](packs/backend/skills/AGENTS.md) | [nestjs](packs/backend/docs/agents/nestjs.md) | [vendor.json](packs/backend/vendor.json), [mcp.json](packs/backend/mcp.json) |
| common (always installed) | none | none | [delivery](packs/common/docs/agents/delivery.md), [typescript](packs/common/docs/agents/typescript.md) | none |

## Skills, by pack and category
Every skill is `packs/<pack>/skills/<category>/<name>/SKILL.md`. Each category folder has an `AGENTS.md` index.

- Frontend
  - Angular ([index](packs/frontend/skills/angular/AGENTS.md)): [angular-developer](packs/frontend/skills/angular/angular-developer/SKILL.md), [angular-new-app](packs/frontend/skills/angular/angular-new-app/SKILL.md), [angular-patterns](packs/frontend/skills/angular/angular-patterns/SKILL.md)
  - TypeScript ([index](packs/frontend/skills/typescript/AGENTS.md)): [typescript-safety](packs/frontend/skills/typescript/typescript-safety/SKILL.md)
  - Styling ([index](packs/frontend/skills/styling/AGENTS.md)): [css-styling](packs/frontend/skills/styling/css-styling/SKILL.md)
  - Motion ([index](packs/frontend/skills/motion/AGENTS.md)): [web-animations](packs/frontend/skills/motion/web-animations/SKILL.md), [advanced-animations](packs/frontend/skills/motion/advanced-animations/SKILL.md)
  - Design to code ([index](packs/frontend/skills/design-to-code/AGENTS.md)): [replicate-website](packs/frontend/skills/design-to-code/replicate-website/SKILL.md)
  - Quality ([index](packs/frontend/skills/quality/AGENTS.md)): [accessibility-review](packs/frontend/skills/quality/accessibility-review/SKILL.md), [performance-audit](packs/frontend/skills/quality/performance-audit/SKILL.md)
  - Habits ([index](packs/frontend/skills/habits/AGENTS.md)): [my-coding-habits](packs/frontend/skills/habits/my-coding-habits/SKILL.md)
- Backend
  - NestJS ([index](packs/backend/skills/nestjs/AGENTS.md)): [nestjs-core](packs/backend/skills/nestjs/nestjs-core/SKILL.md), [nestjs-best-practices](packs/backend/skills/nestjs/nestjs-best-practices/SKILL.md)
  - API ([index](packs/backend/skills/api/AGENTS.md)): [api-contract](packs/backend/skills/api/api-contract/SKILL.md)
  - Database ([index](packs/backend/skills/database/AGENTS.md)): [postgresql-table-design](packs/backend/skills/database/postgresql-table-design/SKILL.md), [supabase-postgres-best-practices](packs/backend/skills/database/supabase-postgres-best-practices/SKILL.md)
  - Security ([index](packs/backend/skills/security/AGENTS.md)): [auth-jwt](packs/backend/skills/security/auth-jwt/SKILL.md), [security-review](packs/backend/skills/security/security-review/SKILL.md)
  - Testing ([index](packs/backend/skills/testing/AGENTS.md)): [nest-testing](packs/backend/skills/testing/nest-testing/SKILL.md)

## Installer and checker
[scripts/install.mjs](scripts/install.mjs) (the package `bin`) finds packs and skills by scanning folders, so a new skill or category needs no code change. [scripts/check.mjs](scripts/check.mjs) verifies every skill is well-formed and linked from all four indexes.

## Adding a skill
Create `packs/<pack>/skills/<category>/<name>/SKILL.md`, link it from the category `AGENTS.md`, the pack's `skills/AGENTS.md`, the pack's `AGENTS.md` block and this file, then run `node scripts/check.mjs`. Full steps, a template and the link formats: [README.md](README.md#adding-a-new-skill-install-it-index-it-reference-it).

## Always
- Never commit or push unless explicitly asked.
- Do not add a third-party skill, MCP server or dependency without asking the owner; pin vendored skills in the pack's `vendor.json`.
- Kit content must work in any project; nothing project-specific.
- Run `node scripts/check.mjs` before finishing any change to skills or indexes; it must print `ok`.
