# Install the kit's rules in any project

The layout follows one idea: `AGENTS.md` is sent with **every** request, so it stays small and links out. Topic rules live in `docs/agents/*.md` and are read only when the task needs them. Occasional, specialised tasks are skills.

```
your-project/
├── AGENTS.md            # short project header + kit block (links only)
├── CLAUDE.md            # symlink to AGENTS.md (or a one-line @AGENTS.md import)
├── docs/agents/         # angular.md, typescript.md, accessibility.md, delivery.md
└── apps/web/AGENTS.md   # optional: rules for one package in a monorepo
```

## One command

Run in your project root (needs Node 18+). Preview first with `--dry-run`:

```bash
npx github:Mohamed-Khalil67/frontend-ai-kit-by-Mk --dry-run
npx github:Mohamed-Khalil67/frontend-ai-kit-by-Mk
```

With a local clone of the kit: `node <kit>/scripts/init.mjs`. In Claude Code with the plugin: `/frontend-ai-kit:setup` (Step 4 runs the same script).

Options: `--gemini` also creates `GEMINI.md`; `--claude=import` writes `@AGENTS.md` instead of a symlink; `--claude=skip` leaves `CLAUDE.md` alone.

What it does, and what it never does:
- **New `AGENTS.md`:** writes a short header from `package.json` (name, description, package manager if not npm, Angular version, non-standard scripts, top-level folders), then the kit block between `<!-- frontend-ai-kit:start -->` and `<!-- frontend-ai-kit:end -->`.
- **Existing `AGENTS.md`:** appends the kit block, or replaces only that block on re-runs. Your text is kept.
- **`docs/agents/`:** copies the kit's docs. Files the kit manages are updated on re-run; a file you wrote with the same name is skipped.
- **`CLAUDE.md`:** creates a symlink to `AGENTS.md` so the two can never drift; if symlinks are not allowed it writes `@AGENTS.md`. An existing `CLAUDE.md` gets `@AGENTS.md` added at the top.
- Checks every link in `AGENTS.md` resolves. Never commits.

Then review `AGENTS.md`, fill in the description if it is a placeholder, and commit `AGENTS.md`, `CLAUDE.md` and `docs/agents/`.

## Keep it small

- Add a rule only after you see the agent get something wrong, and put it in the matching `docs/agents/` file (or a new doc linked from `AGENTS.md`), not as another bullet in `AGENTS.md`.
- No "getting started" or setup instructions; the agent works in a project that is already set up.
- Keep layout notes high-level (folders, not individual files) so they do not go stale.
- Do not ask an agent to generate `AGENTS.md` from the repo; it comes out long. Start from the header the script writes.
- Docs may link to each other (for example `typescript.md` links to `delivery.md`).

## Monorepos: nested AGENTS.md

Put an `AGENTS.md` in a package folder (for example `apps/web/`) for rules that only apply there. Tools load the root file plus the nested one for the folder you start the agent in, so start the agent inside that package when working on it.

## Symlinks on Windows

- Creating one: `mklink CLAUDE.md AGENTS.md` in an admin Command Prompt, or with Developer Mode on (no `/D`; that is for folders).
- Committed symlinks only check out as links on Windows with `git config core.symlinks true` and Developer Mode. Otherwise Git writes a text file containing `AGENTS.md`, which the agent cannot follow. If your team is on Windows without that, use `--claude=import`.

## Per harness

| Harness | Reads | Needs |
|---|---|---|
| Claude Code | `CLAUDE.md` | The symlink or `@AGENTS.md` (the script does this). Check with `/memory`. |
| Gemini CLI | `GEMINI.md` | `--gemini`, or set `{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }` in `.gemini/settings.json`. Check with `/memory show`. |
| Cursor | `AGENTS.md` | Nothing. Open each repo as its own workspace (a root `AGENTS.md` has been reported to leak into sibling repos). |
| Hermes Agent | `AGENTS.md`, `CLAUDE.md` | Start it inside the project; make sure `skip_context_files` is not set. |
| Codex, Copilot, Antigravity, others | `AGENTS.md` | Nothing. If a tool only reads its own filename, symlink or import `AGENTS.md` from it. |

## Skills

`AGENTS.md` names the skills; the skills are separate. In Claude Code, install the plugin (see the README). Elsewhere, `npx skills add Mohamed-Khalil67/frontend-ai-kit-by-Mk` may work but is untested. Every installed skill's name and description is sent with each request, so install only the ones you use. Without the skills, the docs in `docs/agents/` still apply.

## Verify

In a fresh session ask: *"What are my rules for components and git? Quote them."* The agent should open `docs/agents/angular.md` and quote the standalone-components rule and "never commit or push unless asked". If not, the tool is not loading `AGENTS.md`: check the filename, the folder you started in, and the table above.

## Sources
- [Web Dev Simplified: Why Your AI Generates Crap Code (AGENTS.md structure)](https://www.youtube.com/watch?v=jojMVmRZABw)
- [Gemini CLI: GEMINI.md and `context.fileName`](https://geminicli.com/docs/cli/gemini-md/)
- [Cursor: rules](https://cursor.com/help/customization/rules)
- [Hermes Agent: context files (mirror)](https://www.mintlify.com/NousResearch/hermes-agent/user-guide/features/context-files)
