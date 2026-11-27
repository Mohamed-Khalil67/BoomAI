# Project description and maintenance guide (for the kit's own development)

This file describes the Frontend AI Kit repository itself. It is read by agents working on the kit. It is not copied into user projects (the installer copies only `AGENTS.md` and `docs/agents/*.md`).

## What this project is

Frontend AI Kit by MK is a Claude Code plugin, plus a shared-rules installer, for Angular frontend work. It has three layers, and each one has a different audience:

1. **Shared rules (`AGENTS.md`, `docs/agents/*.md`).** Plain Markdown that any agent harness can read. `AGENTS.md` is sent with every request in a user's project, so it must stay short: a few always-true rules, a list of links to the docs, and a one-line skill list. Topic rules go in `docs/agents/`.
2. **Skills and agents (`skills/<category>/<name>/SKILL.md`, `agents/<name>.md`).** Claude Code only for agents. Skills follow the Agent Skills format. The agents preload skills by name.
3. **Installer and setup (`scripts/init.mjs`, `skills/kit/setup/SKILL.md`).** Copies the rules, and the skills flattened into `.agents/skills/`, into a project, safely and repeatably. It finds skills by scanning `skills/<category>/<name>/SKILL.md`, so new skills and categories need no installer change.

The owner's personal habits are in `skills/kit/my-coding-habits/SKILL.md`. It points at `docs/agents/` and does not repeat the rules.

## Where things live

| Path | Purpose | Audience |
|---|---|---|
| `AGENTS.md` | Kit block copied into projects. Links only. | Every agent, every project |
| `docs/agents/*.md` | Topic rules, copied into projects. Each starts with a `frontend-ai-kit: managed file` comment. | Every agent, read on demand |
| `docs/INSTALL-AGENTS-MD.md`, `README.md` | Install and usage for humans | Humans |
| `docs/MAINTAINING.md` (this file) | Kit maintenance | Agents and maintainers of the kit |
| `CLAUDE.md` | Imports `AGENTS.md` and this file, for the kit repo only | Claude Code in this repo |
| `skills/AGENTS.md` | Map of skill categories, linking each category index | Agents and maintainers |
| `skills/<category>/AGENTS.md` | Category index: one row per skill, linking its `SKILL.md` | Agents and maintainers |
| `skills/<category>/<name>/SKILL.md` | Skills for Claude Code | Claude Code |
| `skills/kit/refresh-framework-skills/sources.json` | Upstream skill sources, with pinned commits where required | Maintainers |
| `agents/*.md` | Subagents (lead, Angular builder, stylist, motion, a11y, perf) | Claude Code |
| `scripts/init.mjs` | Installer. Run with `--dry-run` first. | Humans and setup skill |
| `scripts/setup.mjs` | One-command project setup: pulls the kit, installs the plugins with the `claude` CLI, then runs `init.mjs`. Run with `--dry-run` first. | Humans |
| `evals/README.md` | Manual test scenarios | Maintainers |
| `.claude-plugin/plugin.json`, `package.json` | Versions. Keep them equal. | Maintainers |

## Checklist: adding a docs file in `docs/agents/`

1. Create `docs/agents/<topic>.md`. Start with the managed-file comment used by the other files, then a `#` title. Keep it short and rule-like.
2. Link it from `AGENTS.md` under "Conventions", one line that says when to read it. Keep `AGENTS.md` under about 35 lines.
3. Link it from `skills/kit/my-coding-habits/SKILL.md` in the list of files.
4. Add it to the file tree in `docs/INSTALL-AGENTS-MD.md` and to the "Repository" description in `README.md` if the list is named there.
5. Link other docs to it where a reader would need it. Do not copy its rules into another file.
6. The installer copies every `.md` in `docs/agents/`, so `scripts/init.mjs` needs no change.
7. Check: `node scripts/init.mjs --dry-run` in an empty folder must report all links resolving, and a folder with an existing `docs/agents/<topic>.md` that you wrote must be skipped.

## Checklist: adding a skill

1. Pick the category folder (see [skills/AGENTS.md](../skills/AGENTS.md)) and create `skills/<category>/<name>/SKILL.md` with `name` and `description` frontmatter. Never put a skill directly in `skills/` or two levels deep: Claude Code only finds `<listed folder>/<name>/SKILL.md`. The description decides when the skill is used, so state the trigger in it. Split long material into `references/*.md`, and link to those from the skill.
2. Add a row to that category's `AGENTS.md`. For a new category: create `skills/<category>/AGENTS.md`, add it to `skills/AGENTS.md`, and add `./skills/<category>/` to `"skills"` in `.claude-plugin/plugin.json`, or its skills will not load.
3. If an agent should preload it, add it under `skills:` in the relevant `agents/*.md`. Only the agents that need it, since every preloaded skill costs context.
4. If the skill is an upstream one (not written here), add it to `skills/kit/refresh-framework-skills/sources.json`. Pin the commit for any source with scripts. Do not add unreviewed third-party code without a pin.
5. Add the skill to its category line in the root `AGENTS.md` only if the rule-based harnesses need to know when to use it. Keep it one line per category.
6. Add a row to the skills table in `README.md`.
7. Update `skills/kit/setup/SKILL.md` only if the setup flow changes (for example, a new install choice).
8. If the skill has scripts, state in `SKILL.md` which Python or Node version it needs, and that it runs in the project, not from `${CLAUDE_PLUGIN_ROOT}`.

## Checklist: changing a rule

- Change it in the topic file in `docs/agents/`. Do not repeat it in `AGENTS.md` or in `my-coding-habits`.
- Angular version claims (for example, "default since v20" or "stable in v22") must be checked against the current Angular docs before merging.
- If a rule is about the tool or harness and not about code, put it in `AGENTS.md` instead.

## Checklist: releasing

1. Bump the version in `.claude-plugin/plugin.json` and `package.json` together.
2. `node --check scripts/init.mjs`.
3. Run the installer on a sample folder, both fresh and with an existing `AGENTS.md`, and check the output.
4. Check every link in `AGENTS.md` and in `docs/agents/*.md`.
5. Update `evals/README.md` if behaviour changed.
6. Do not commit or push unless the owner asks.

## Rules for editing this repo

- Keep `AGENTS.md` small. It is sent with every user request.
- Do not put project-specific content in the kit. Kit content must work for any Angular project.
- Do not add an upstream skill, MCP server or dependency without asking the owner.
- Do not commit or push unless asked.
