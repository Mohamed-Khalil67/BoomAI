# AI Skills by MK

Agent skills, house rules and MCP servers for **frontend (Angular)** and **backend (NestJS)** work. One `npx` command copies the pack you choose into a project, where Claude Code, Codex, Cursor, Gemini CLI, Copilot and other tools pick it up.

## Install

Run in the project root (Node 18+ and Git; nothing else to install):

```bash
npx -y github:Mohamed-Khalil67/ai-skills-by-mk
```

With no pack named, it asks four questions, each with a default you accept with Enter:

1. **Which pack?** `frontend` (Angular), `backend` (NestJS) or `all`. The default is guessed from `package.json`: Angular gives `frontend`, NestJS gives `backend`, both give `all`.
2. **Which tools?** Any tool (`.agents/skills/` and `.claude/skills/`), Claude Code only, or other tools only.
3. **MCP servers?** Add the pack's servers to `.mcp.json`.
4. **GEMINI.md?** For Gemini CLI.

Then it shows what it will do and asks to confirm. To skip the questions (scripts, CI), name the pack and options:

```bash
npx -y github:Mohamed-Khalil67/ai-skills-by-mk frontend --mcp
npx -y github:Mohamed-Khalil67/ai-skills-by-mk backend --mcp
npx -y github:Mohamed-Khalil67/ai-skills-by-mk all --mcp
```

Installing a second pack later adds it next to the first.

| Option | Effect |
|---|---|
| `frontend`, `backend`, `all` | The pack to install. Leave it out to be asked |
| `--ask` | Ask the questions even when a pack is given |
| `--mcp` | Add the pack's MCP servers to `.mcp.json` (servers you already have are kept) |
| `--mcp-skip=figma,...` | Leave some servers out, for example when a Figma plugin already provides one |
| `--skills=both` (default), `agents`, `claude`, `none` | Where the skills go: `.agents/skills/` (Codex, Cursor, Gemini CLI, Copilot, OpenCode), `.claude/skills/` (Claude Code), both, or nowhere |
| `--gemini` | Also create `GEMINI.md` |
| `--claude=symlink` (default), `import`, `skip` | How `CLAUDE.md` points at `AGENTS.md`. Use `import` on Windows without Developer Mode |
| `--dry-run` | Show what would change; write nothing |
| `--list` | List the packs and their skills |

**Update:** run the same command again. It replaces what it installed, removes skills a pack dropped, and never touches your own files, other packs, or MCP servers you already had. Use forward slashes in any path you pass (Git Bash strips backslashes).

## What a project gets

```
your-project/
├── AGENTS.md              # your header + one block per pack, linking every skill's SKILL.md
├── CLAUDE.md              # -> AGENTS.md (symlink or @AGENTS.md import)
├── docs/agents/           # topic rules read on demand: delivery, typescript (+ angular, accessibility | nestjs)
├── .agents/skills/        # every skill of the pack, one <name>/SKILL.md per folder
├── .claude/skills/        # the same skills for Claude Code
└── .mcp.json              # with --mcp
```

`.agents/skills/.ai-skills.json` and `.claude/skills/.ai-skills.json` record which folders each pack installed.

## The packs

### frontend (Angular)

| Category | Skills |
|---|---|
| Angular | `angular-developer` and `angular-new-app` (official, from the Angular team), `angular-patterns` |
| TypeScript | `typescript-safety` |
| Styling | `css-styling` |
| Motion | `web-animations`, `advanced-animations` |
| Design to code | `replicate-website` |
| Quality | `accessibility-review` (WCAG AA), `performance-audit` (bundle, Core Web Vitals); both read-only reviews |
| Habits | `my-coding-habits` |

MCP (`--mcp`): Figma, Chrome DevTools, Context7, and the Angular CLI server in Angular projects.

### backend (NestJS)

| Category | Skills |
|---|---|
| NestJS | `nestjs-core` (NestJS 11/12 wiring: validation, config, rate limits, shutdown, ESM), `nestjs-best-practices` (Kadajett, 40 rules) |
| API | `api-contract` (DTOs, RFC 9457 errors, pagination, idempotency, versioning, OpenAPI) |
| Database | `postgresql-table-design` (wshobson), `supabase-postgres-best-practices` (Supabase) |
| Security | `auth-jwt` (guards, rotating refresh tokens, argon2, ownership checks), `security-review` (Sentry, OWASP) |
| Testing | `nest-testing` (TestingModule, supertest e2e, Testcontainers) |

MCP (`--mcp`): Context7.

Third-party skills (both packs) are copied at a reviewed commit and listed with their licence in [`packs/frontend/vendor.json`](packs/frontend/vendor.json) and [`packs/backend/vendor.json`](packs/backend/vendor.json). `security-review` is CC BY-SA 4.0; the others are MIT. Updating one means bumping the pinned commit in the repo; projects get it by re-running the installer.

## Using the skills: automatic or by name

Each skill's `description` says when it applies, so tools with skill support load it on their own when a request matches. You can also call one by name:

| Tool | Automatic | By name |
|---|---|---|
| Claude Code (`.claude/skills/`) | Yes | `/css-styling`, or "use the css-styling skill" |
| Tools that read `.agents/skills/` | Yes, where the tool supports Agent Skills | The tool's own syntax, or "use the css-styling skill" |
| Tools without skill support | Through `AGENTS.md`, which tells the agent to open the linked `SKILL.md` first | "use the css-styling skill" |

Every loaded skill's name and description is sent with each request, so install only the packs a project needs.

## How tools read `AGENTS.md`

| Tool | Reads | Needs |
|---|---|---|
| Claude Code | `CLAUDE.md` | The symlink or `@AGENTS.md` import the installer writes. Check with `/memory`. |
| Gemini CLI | `GEMINI.md` | `--gemini`, or `{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }` in `.gemini/settings.json` |
| Codex, Cursor, Copilot, OpenCode, Antigravity | `AGENTS.md` | Nothing |

On Windows, a committed `CLAUDE.md` symlink only works with `git config core.symlinks true` and Developer Mode; otherwise use `--claude=import`. In a monorepo, a nested `AGENTS.md` in a package folder adds rules for that package.

## Repository layout

See [AGENTS.md](AGENTS.md) for the map of this repo and [docs/MAINTAINING.md](docs/MAINTAINING.md) for adding skills or packs. The repo is public, but no licence is set for its own content yet, so others may read and install it but have no rights to reuse it. The vendored skills keep their own licences (see the packs' `vendor.json`).
