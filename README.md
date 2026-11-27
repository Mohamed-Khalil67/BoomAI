# BoomAI

Agent skills, house rules and MCP servers for **frontend (Angular)** and **backend (NestJS)** work. One `npx` command copies the pack you choose into a project, where Claude Code, Codex, Cursor, Gemini CLI, Copilot and other tools pick it up.

## Install

Run in the project root (Node 18+ and Git; nothing else to install):

```bash
npx -y github:Mohamed-Khalil67/BoomAI
```

With no pack named, it asks four questions, each with a default you accept with Enter:

1. **Which pack?** `frontend` (Angular), `backend` (NestJS) or `all`. The default is guessed from `package.json`: Angular gives `frontend`, NestJS gives `backend`, both give `all`.
2. **Which tools?** Any tool (`.agents/skills/` and `.claude/skills/`), Claude Code only, or other tools only.
3. **MCP servers?** Add the pack's servers to `.mcp.json`.
4. **GEMINI.md?** For Gemini CLI.

Then it shows what it will do and asks to confirm. To skip the questions (scripts, CI), name the pack and options:

```bash
npx -y github:Mohamed-Khalil67/BoomAI frontend --mcp
npx -y github:Mohamed-Khalil67/BoomAI backend --mcp
npx -y github:Mohamed-Khalil67/BoomAI all --mcp
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

## Architecture (read this first if you are an AI model working on this repo)

BoomAI is a **content repo plus one installer**. Nothing here runs inside a project; `scripts/install.mjs` copies files from `packs/` into the user's project. Everything is discovered by scanning folders, so the structure below is the contract.

```
BoomAI/
├── AGENTS.md               # map of THIS repo: links every pack, category index and SKILL.md
├── README.md               # install guide + this architecture section
├── package.json            # npx entry: "bin" -> scripts/install.mjs
├── scripts/install.mjs     # the only code; finds packs and skills by scanning folders
├── docs/MAINTAINING.md     # step-by-step checklists (add skill / category / pack, vendor, release)
├── evals/                  # manual test scenarios
└── packs/
    ├── common/             # installed with EVERY pack; no skills, no pack-specific content
    │   └── docs/agents/    #   delivery.md, typescript.md
    ├── frontend/           # Angular pack, self-contained
    │   ├── AGENTS.md       #   block copied into the project's AGENTS.md (<= ~40 lines)
    │   ├── docs/agents/    #   topic rules: angular.md, accessibility.md
    │   ├── skills/
    │   │   ├── AGENTS.md   #   map of this pack's categories
    │   │   └── <category>/ #   angular, typescript, styling, motion, design-to-code, quality, habits
    │   │       ├── AGENTS.md          # index of the skills in the category
    │   │       └── <skill>/SKILL.md   # one skill per folder (+ optional references/)
    │   ├── mcp.json        #   MCP servers added with --mcp (onlyWith limits by dependency)
    │   └── vendor.json     #   third-party skills: repo, path, pinned commit, licence, local changes
    └── backend/            # NestJS pack, same shape: nestjs, api, database, security, testing
```

### Rules that keep the packs separate
1. **A pack contains everything it needs and references nothing outside itself.** Frontend files never mention backend topics and vice versa; shared material lives in `packs/common/`. Relative links inside a pack stay inside the pack (docs link to sibling docs because the installer puts them in one folder).
2. **A skill is `packs/<pack>/skills/<category>/<skill>/SKILL.md`**, exactly three levels below `skills/`. The folder name equals the `name:` in the frontmatter. **Skill names are unique across all packs**, because the installer flattens them to `<project>/.agents/skills/<skill>/` and `.claude/skills/<skill>/`.
3. **The category is only for organisation in this repo.** It disappears on install; the project gets flat skill folders. Each category folder has an `AGENTS.md` index that links its skills.
4. **The pack's `AGENTS.md` is sent with every request in the project**, so it stays short and only links to docs and `SKILL.md` files. Skill links are written as `skills/<category>/<skill>/SKILL.md`; the installer rewrites them to the project's skill folder.
5. **Only the installer is code.** Skills, docs and MCP definitions are Markdown or JSON. No skill may rely on a path outside its own folder.

### What the installer does (so you can predict the result)
1. Reads the pack names from the folders in `packs/` (everything except `common`). `--list` prints them with their skills.
2. Writes one block per installed pack into the project's `AGENTS.md`, between `<!-- ai-skills:<pack>:start -->` and `<!-- ai-skills:<pack>:end -->`; the user's own text is kept.
3. Copies `packs/common/docs/agents/` and the pack's `docs/agents/` into the project's `docs/agents/`. A file the user wrote is never overwritten; only files starting with `<!-- ai-skills: managed file.` are updated.
4. Flattens the pack's skills into `.agents/skills/` and `.claude/skills/` and records them per pack in `.ai-skills.json`. Re-running replaces only what the lock lists, removes skills a pack dropped, and never touches other packs or the user's own skills.
5. With `--mcp`, merges the pack's `mcp.json` into the project's `.mcp.json`, keeping servers the user already has.
6. Points `CLAUDE.md` (and `GEMINI.md` with `--gemini`) at `AGENTS.md`, then checks every link in `AGENTS.md` resolves.

### Where does new work go?
| You want to... | Do this |
|---|---|
| Add a skill to an existing category | Create `packs/<pack>/skills/<category>/<skill>/SKILL.md`; add a row to the category `AGENTS.md`, the pack's `skills/AGENTS.md`, the skill line in `packs/<pack>/AGENTS.md`, the root `AGENTS.md` and this README. No code change |
| Add a category | Create `packs/<pack>/skills/<new-category>/` with a skill and an `AGENTS.md` index; add it to the pack's `skills/AGENTS.md` map. No code change |
| Add a pack (mobile, devops, ...) | Create `packs/<name>/` with `AGENTS.md` and `skills/`, optionally `docs/agents/`, `mcp.json`, `vendor.json`. `--list`, the guided questions and `npx ... <name>` pick it up. No code change |
| Add a shared rule used by every pack | `packs/common/docs/agents/` |
| Add a third-party skill | Copy it at a pinned commit, keep its licence, record it in the pack's `vendor.json` (see [docs/MAINTAINING.md](docs/MAINTAINING.md)) |

This was tested by adding a `queues` category to backend and a whole `mobile` pack: both appeared in `--list`, installed by name, and installing another pack afterwards kept them.

Step-by-step checklists: [docs/MAINTAINING.md](docs/MAINTAINING.md). Repo map with every link: [AGENTS.md](AGENTS.md).

## Adding a new skill: install it, index it, reference it

A skill only reaches AI agents if it is **indexed**: linked from four `AGENTS.md` files, so an agent can navigate from the root down to it, and so the installer writes the link into a project's `AGENTS.md`. `node scripts/check.mjs` fails until all four exist.

### 1. Create the skill
`packs/<pack>/skills/<category>/<skill>/SKILL.md` (pick the pack and category; both may be new):

```markdown
---
name: bullmq-basics            # exactly the folder name, unique across ALL packs
description: Adds background jobs with BullMQ in NestJS. Use when the user says add a queue, background job, retry, or scheduled task.   # what it does + the phrases that should load it, max 1024 characters
---

# BullMQ basics
Instructions the agent follows. Keep it short; put long material in `references/<topic>.md` next to SKILL.md and link it.
```

The `description` is what tools match against the user's request, so write the trigger phrases into it. Paths inside a skill stay relative to its own folder.

### 2. Index it in four places
Each file links the skill by a **relative path from that file**. With `pack = backend`, `category = queues`, `skill = bullmq-basics`:

| # | File | What to add | Link format |
|---|---|---|---|
| 1 | `packs/backend/skills/queues/AGENTS.md` (the category index; create it for a new category) | A table row: ``\| [`bullmq-basics`](bullmq-basics/SKILL.md) \| one-line description \|`` | relative to the category folder |
| 2 | `packs/backend/skills/AGENTS.md` (the pack's skills map) | The skill in its category row; a new category gets a whole row linking `queues/AGENTS.md` | `queues/bullmq-basics/SKILL.md` |
| 3 | `packs/backend/AGENTS.md` (the block copied into every project) | A bullet in the Skills list: `- Queues: [bullmq-basics](skills/queues/bullmq-basics/SKILL.md)` | `skills/<category>/<skill>/SKILL.md`. The installer rewrites it to the project's skill folder |
| 4 | `AGENTS.md` at the repo root (the map for agents working on this repo) | `  - Queues ([index](packs/backend/skills/queues/AGENTS.md)): [bullmq-basics](packs/backend/skills/queues/bullmq-basics/SKILL.md)` | `packs/<pack>/skills/<category>/<skill>/SKILL.md` |

Also add it to the pack table in this README. If the pack's `AGENTS.md` skill bullet was the only place a trigger is stated, remember it stays short: it names skills, it does not explain them.

### 3. Check
```bash
node scripts/check.mjs
```
It verifies that `name` equals the folder, `description` exists and fits, the name is unique across packs, the skill is linked from all four indexes, every link resolves, and every `vendor.json` entry has a full commit and a licence. Run it before every commit.

### 4. Get it into projects
Commit and push, then re-run the installer in each project (the same `npx -y github:Mohamed-Khalil67/BoomAI <pack>` command). It copies the new skill to `.agents/skills/<skill>/` and `.claude/skills/<skill>/` and rewrites the project's `AGENTS.md` block so the link points at the project's copy, for example `- Queues: [bullmq-basics](.agents/skills/bullmq-basics/SKILL.md)`. To try it first without pushing, run `node scripts/install.mjs <pack> <project-folder>` from your local clone.

### A third-party skill
Same four indexes, plus: copy the folder at one commit, keep its licence file (or add a `NOTICE.md` when the licence is only in its frontmatter), and add an entry to the pack's `vendor.json` with `name`, `into`, `repo`, `path`, the full 40-character `commit`, `licence` and every `localChanges`. Read every file first; a skill is instructions an agent will follow. The check enforces the `vendor.json` fields.

## Licence
The repo is public, but no licence is set for its own content yet, so others may read and install it but have no rights to reuse it. The vendored skills keep their own licences (see the packs' `vendor.json`).
