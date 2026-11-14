# Install the kit's `AGENTS.md` in any agent harness

[`AGENTS.md`](../AGENTS.md) holds the house rules and the skill-routing table. It is plain Markdown, so any harness can use it. The only work is getting it where each harness looks.

The pattern is the same everywhere: **one real file (`AGENTS.md` in the project root), and a pointer from any tool that does not read that name.**

## Step 1: get the file into your project (all harnesses)

Pick one.

**A. Guided (Claude Code with the plugin installed):**
```
/frontend-ai-kit:setup
```
Step 4 copies `AGENTS.md`, creates `CLAUDE.md`, and merges safely if you already have an `AGENTS.md`.

**B. Download it** (run in your project root; `HEAD` is the repo's default branch):
```bash
curl -fsSL https://raw.githubusercontent.com/Mohamed-Khalil67/frontend-ai-kit-by-Mk/HEAD/AGENTS.md -o AGENTS.md
```
```powershell
Invoke-WebRequest https://raw.githubusercontent.com/Mohamed-Khalil67/frontend-ai-kit-by-Mk/HEAD/AGENTS.md -OutFile AGENTS.md
```
Read it before you commit it: these files become instructions your agent follows.

**C. Your project already has an `AGENTS.md`:** do not overwrite it. Append the kit's file between markers so you can replace it later:
```markdown
<!-- frontend-ai-kit:start -->
...contents of the kit's AGENTS.md...
<!-- frontend-ai-kit:end -->
```
Your project's own rules win over the kit's (the file says so in "Order of authority").

Commit `AGENTS.md` so the whole team gets it.

## Step 2: point each harness at it

| Harness | Reads `AGENTS.md` itself? | What to do |
|---|---|---|
| **Claude Code** | No, reads `CLAUDE.md` | Create `CLAUDE.md` containing one line: `@AGENTS.md` |
| **Gemini CLI** | Not by default, reads `GEMINI.md` | Create `GEMINI.md` containing `@AGENTS.md`, or set `context.fileName` (below) |
| **Cursor** | Yes, project root | Nothing. Optional: add the same rules as a `.cursor/rules/*.mdc` file if you want glob scoping |
| **Hermes Agent** | Yes (see note) | Nothing. Run it from inside the project |
| Codex, Copilot, Antigravity, and others | Yes | Nothing |

### Claude Code
`CLAUDE.md`:
```
@AGENTS.md
```
Check with `/memory`: both files should be listed. To add Claude-only notes, put them below the `@AGENTS.md` line.

### Gemini CLI
Either create `GEMINI.md` with `@AGENTS.md`, or tell Gemini to load `AGENTS.md` directly in `.gemini/settings.json` (project) or `~/.gemini/settings.json` (all projects):
```json
{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }
```
Check with `/memory show`; `/memory reload` re-scans after you edit.

### Cursor
Cursor picks up a root `AGENTS.md` automatically. Notes:
- A nested `AGENTS.md` applies to its own folder; a root one applies to the whole project.
- In multi-repo workspaces, a root `AGENTS.md` has been reported to leak into sibling repos. Open each repo as its own workspace.
- `.cursorrules` is legacy; do not use it. A plain `.md` in `.cursor/rules` is ignored: only `.mdc` files with frontmatter count.

### Hermes Agent (Nous Research)
Hermes loads project context files from the working directory (and parent directories, with the closest file winning) at session start, and lists `AGENTS.md` and `CLAUDE.md` among them. So a root `AGENTS.md` works with no extra setup, provided you start Hermes inside the project. Notes:
- Some sources also mention `.hermes.md`. If it exists in your version it may take precedence; if rules do not seem to apply, check your version's docs for the exact file names and order.
- Hermes scans context files for prompt-injection phrases before using them, so keep the file plain rules, not scripts.
- `skip_context_files` in `~/.hermes/config.yaml` turns this off; make sure it is not set.
- `SOUL.md` is for the agent's identity, not project rules. Do not put the kit there.

### Any other harness
Check its docs for "context file", "rules file" or "AGENTS.md". If it supports only its own filename, make that file a one-liner that imports `AGENTS.md` (if it supports imports), or a symlink to it:
```bash
ln -s AGENTS.md OTHER-TOOL.md
```
On Windows, symlinks need Developer Mode or an admin shell; otherwise copy the file and re-copy after edits.

## Step 3: skills are separate from rules

`AGENTS.md` carries the rules and names the skills; the skills themselves are separate files.
- **Claude Code:** install the plugin (see the README), which provides the skills and agents.
- **Other harnesses:** the skills in `skills/` follow the Agent Skills format. `npx skills add Mohamed-Khalil67/frontend-ai-kit-by-Mk` may work, but is untested here. Without the skills, the harness still follows the rules written in `AGENTS.md`; the routing table just points at skills it cannot load. The agents (`frontend-lead` and the specialists) are Claude Code only.

## Verify it works

Ask the agent, in a fresh session: *"What are my rules for components and git? Quote them."* It should answer with the standalone-components rule and "never commit or push unless asked". If it does not, the harness is not loading the file: recheck the filename, the folder you launched from, and the table above.

## Keeping it up to date
Edit the kit's `AGENTS.md` and `skills/my-coding-habits/SKILL.md` together (they duplicate the coding rules). In projects, re-download or re-append between the markers.

## Sources
- [Gemini CLI: GEMINI.md and `context.fileName`](https://geminicli.com/docs/cli/gemini-md/)
- [Cursor: rules](https://cursor.com/help/customization/rules)
- [Hermes Agent: context files (mirror)](https://www.mintlify.com/NousResearch/hermes-agent/user-guide/features/context-files)
