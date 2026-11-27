# Maintaining AI Skills by MK

Read by agents and people working on this repo. Not copied into projects.

## Layers
1. **Pack block** (`packs/<pack>/AGENTS.md`): copied into the project's `AGENTS.md` between `<!-- ai-skills:<pack>:start -->` and `<!-- ai-skills:<pack>:end -->`. Sent with every request, so keep it under about 40 lines: always-true rules, links to docs, one line of skills per category.
2. **Docs** (`packs/<pack>/docs/agents/*.md`, plus `packs/common/docs/agents/` for every pack): topic rules read on demand. Each starts with `<!-- ai-skills: managed file. ... -->`; the installer only overwrites files that start with that line.
3. **Skills** (`packs/<pack>/skills/<category>/<name>/SKILL.md`): copied flattened to `<project>/.agents/skills/<name>/` and `.claude/skills/<name>/`. Skill names must be unique across all packs.
4. **Agents** (optional `packs/<pack>/agents/*.md`, Claude Code format): copied to `.claude/agents/`. No pack uses them now; prefer a skill, which works in every tool.
5. **MCP** (`packs/<pack>/mcp.json`): merged into `.mcp.json` with `--mcp`. `onlyWith` limits a server to projects that depend on a package.

## Adding a skill
1. Pick the pack and category; create `packs/<pack>/skills/<category>/<name>/SKILL.md` with `name` (same as the folder) and `description` frontmatter. The description decides when the skill triggers: say what it does and the phrases that should load it. Put long material in `references/*.md` and link it.
2. Add a row to the category's `AGENTS.md`, the pack's `skills/AGENTS.md` map, the skill line in `packs/<pack>/AGENTS.md` (as `[name](skills/<category>/<name>/SKILL.md)`, which the installer rewrites to the project path), the repo map in the root `AGENTS.md`, and the pack table in `README.md`.
3. Scripts inside a skill: state the runtime it needs, and keep paths relative to the skill folder.

## Vendoring a third-party skill
- Only with a licence that allows copying. Read every file before adding it: skills become instructions agents follow.
- Copy the folder at a specific commit, keep its LICENSE (or add a NOTICE.md when the licence is only stated in the frontmatter), and add an entry to `packs/<pack>/vendor.json` with repo, path, full commit SHA, licence and every local change.
- To update: read the upstream diff since the pinned commit, copy again, re-apply the listed local changes, bump the commit.

## Adding a pack
Create `packs/<name>/` with `AGENTS.md`, `skills/`, optionally `docs/agents/`, `agents/` and `mcp.json`. The installer lists it automatically (`--list`) and accepts it as a pack name. Add it to the README and the root `AGENTS.md`.

## Compatibility with the old Frontend AI Kit
`install.mjs` still recognises the old `<!-- frontend-ai-kit:start/end -->` block (replaced by the frontend block), the old managed-file marker, and the old `.frontend-ai-kit-skills.json` / `.frontend-ai-kit-agents.json` lock files (merged into `.ai-skills.json` as the frontend pack, then deleted). The old `.claude/agents/` files are removed on the next frontend install, because the lock lists them and the pack no longer has agents.

## Releasing
1. Bump `version` in `package.json`.
2. `node --check scripts/install.mjs`.
3. Run `node scripts/install.mjs <pack> <empty-folder> --mcp` for each pack and for `all`, then re-run to confirm nothing changes; check that `AGENTS.md` links all resolve (the installer prints it).
4. Run it on a project with its own `AGENTS.md`, `docs/agents/` files and skills, and confirm they are kept.
5. Do not commit or push unless the owner asks.
