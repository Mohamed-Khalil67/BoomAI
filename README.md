# Frontend AI Kit by MK

A Claude Code plugin for Angular frontend work: a lead agent that delegates to specialist agents, plus frontend skills and MCP servers.

## What is inside

| Part | Name | Purpose |
|---|---|---|
| Lead agent | `frontend-lead` | The "super agent": takes any frontend order, plans it, delegates to the specialists below, verifies, and reports. Run it as the main agent. |
| Specialists | `angular-dev` | Builder: components, services, routes, forms, signals. Preloads the Angular skills, type safety, patterns and your habits. |
| | `ui-stylist` | CSS, layout, tokens, Figma fidelity, replicating a site's look |
| | `motion-dev` | Transitions, scroll-driven effects, timelines, performance of motion |
| | `a11y-reviewer` | Read-only WCAG AA review; never edits files |
| | `perf-auditor` | Read-only performance audit; measures before it recommends |
| Skills | `setup` | Guided first-time setup: choose the agent, install the Angular skills, check MCP servers, get a to-do checklist |
| | `css-styling` | Layout, responsive design, tokens, theming, dark mode with modern CSS |
| | `web-animations` | Transitions, keyframes, micro-interactions, View Transitions, reduced motion |
| | `advanced-animations` | Scroll-driven, timelines, FLIP, SVG, canvas/WebGL |
| | `replicate-website` | Rebuild a site's design from a URL or screenshot in your Angular project |
| | `typescript-safety` | Strict typing rules and a typecheck gate for Angular |
| | `angular-patterns` | AsyncState unions and `@let` narrowing, declarative RxJS streams, signals with `ngModel`, `ng serve` port collisions on Windows |
| | `my-coding-habits` | The owner's personal Angular/TypeScript habits; the agent also learns new ones from corrections (user-scope memory) |
| | `refresh-framework-skills` | Fetches the latest official Angular skills into the project |
| MCP | Figma, Chrome DevTools, Context7 | Design to code, browser verification, current library docs |
| Add-on plugin | `angular-mcp` | The Angular team's CLI MCP (best practices, docs search) |

## Install

Three steps: once per machine, once per project, and again whenever the kit changes. Needs Git and Node 18+.

### 1. Once per machine

Clone the kit over SSH (or HTTPS) to a fixed folder:

```bash
git clone git@github.com:Mohamed-Khalil67/frontend-ai-kit-by-Mk.git C:\Workspace\github\frontend-ai-kit-by-Mk
```

**Claude Code:** register the clone as a local marketplace. It loads in place, so edits to the clone need no reinstall.

```bash
claude plugin marketplace add C:\Workspace\github\frontend-ai-kit-by-Mk
```

To use GitHub instead of a clone (read-only, updates through `/plugin`): `claude plugin marketplace add Mohamed-Khalil67/frontend-ai-kit-by-Mk`.

**Other tools:** nothing to do here; step 2 copies the skills into each project.

### 2. Once per project

Run these in the project root.

**Claude Code:**

```bash
claude plugin install frontend-ai-kit@frontend-ai-kit-by-mk --scope project
node C:\Workspace\github\frontend-ai-kit-by-Mk\scripts\init.mjs
```

The first line turns the kit on for this project only, in `.claude/settings.json`; commit that file so it stays on. The second writes `AGENTS.md`, `CLAUDE.md` and `docs/agents/`. In Angular projects also run `claude plugin install angular-mcp@frontend-ai-kit-by-mk --scope project`. Restart the session, then optionally run `/frontend-ai-kit:setup` for the guided checks (Angular version, official Angular skills, MCP servers).

**Codex, Gemini CLI, Cursor, Copilot, OpenCode and other tools:**

```bash
node C:\Workspace\github\frontend-ai-kit-by-Mk\scripts\init.mjs --gemini
```

Or without a clone: `npx github:Mohamed-Khalil67/frontend-ai-kit-by-Mk --gemini`. This writes `AGENTS.md`, `docs/agents/` and copies the skills, flattened, into `.agents/skills/<name>/SKILL.md`. Drop `--gemini` if you do not use Gemini CLI. Add `--skills=claude` or `--skills=both` to also copy them into `.claude/skills/` (for Claude Code without the plugin; do not combine it with the plugin, or each skill shows twice). Add `--dry-run` to preview. Your own skills in those folders are never overwritten.

### 3. Whenever the kit changes

```bash
git -C C:\Workspace\github\frontend-ai-kit-by-Mk pull
```

- Claude Code: run `/reload-plugins` or start a new session. If a new skill still does not appear, run `claude plugin update frontend-ai-kit@frontend-ai-kit-by-mk`.
- Each project: re-run the `init.mjs` command from step 2. It updates the kit block in `AGENTS.md`, the kit's docs and the kit's skills, removes skills the kit dropped, and leaves your own content alone.

## Using the skills: automatic or by name

Every skill's `description` says when it applies, so a tool with skill support picks it up on its own when your request matches. You can also call one by name:

| Tool | Automatic | By name |
|---|---|---|
| Claude Code (plugin) | Yes | `/frontend-ai-kit:css-styling`, or "use the css-styling skill" |
| Tools that read `.agents/skills/` | Yes, where the tool supports Agent Skills | The tool's own syntax (for example `/css-styling` or `$css-styling`), or "use the css-styling skill" |
| Tools without skill support | Through `AGENTS.md`: it tells the agent to read the matching `.agents/skills/<name>/SKILL.md` first | "use the css-styling skill" |

`setup` is Claude Code only and runs only when you type `/frontend-ai-kit:setup`. Only Claude Code has been tested; check your tool's docs for the folder it reads skills from.

## Use

**The lead agent (recommended):** start a session with it as the main agent:

```
claude --agent frontend-ai-kit:frontend-lead
```

Then give orders in plain language: "implement this Figma frame: <link>", "add a courses page with search", "review the last change for accessibility". It checks your versions and connected tools, picks specialists, runs independent ones in parallel, and verifies the result. If the prefixed name is not found, try `--agent frontend-lead`. Because it replaces the default session agent only when you pass the flag, nothing changes for sessions that don't use it. A plugin can also set a default agent in its own `settings.json`; this kit does not, so it never takes over your sessions.

**Specialists directly:**


- "use angular-dev to build this Figma frame: <link>"
- "use angular-dev to add a reviews page"
- "replicate this page: <url>" (the `replicate-website` skill)
- "animate the sidebar and check it in the browser"

On first use, the agent offers to install the official Angular skills into the project's `.claude/skills/` (see below) and asks before fetching.

## Official Angular skills

| Source | Publisher |
|---|---|
| `github.com/angular/skills` (`angular-developer`, `angular-new-app`) | Angular team |
| `github.com/nextlevelbuilder/ui-ux-pro-max-skill` (`ui-ux-pro-max`, optional, pinned to a reviewed commit) | nextlevelbuilder (third party, MIT). A searchable design database plus stdlib-only Python scripts; needs Python 3. |

The agent runs `skills/kit/refresh-framework-skills/scripts/refresh-skills.mjs`, which shallow-clones the repos listed in `skills/kit/refresh-framework-skills/sources.json` at their default branch, copies the listed skill folders into `<project>/.claude/skills/`, and records each commit in `.claude/skills/.frontend-ai-kit-lock.json`. It refreshes at most once a week. It never runs upstream code, never follows symlinks and never overwrites skills it did not install. Nothing is installed without your approval first. To refresh by hand: ask "refresh the framework skills".

These files become instructions Claude follows, so skim them the first time. Decide per project whether to commit or git-ignore the fetched folders.

## MCP servers

- **Figma** (`https://mcp.figma.com/mcp`): sign in with `/mcp`, then Authenticate.
- **Chrome DevTools** (`npx chrome-devtools-mcp@latest`): needs Node and Chrome. It controls its own Chrome instance.
- **Context7** (`https://mcp.context7.com/mcp`): works without a key; an optional key raises rate limits.
- On Windows, if `npx`-based servers fail to start, change the entry in `.mcp.json` to `"command": "cmd", "args": ["/c", "npx", ...]`.

### Angular MCP add-on (install per project)

Plugin agents cannot scope an MCP server to themselves (the docs say `mcpServers` is ignored for plugin agents), so the Angular CLI MCP is a separate add-on plugin. Install it at **project scope** in Angular projects:

```
/plugin install angular-mcp@frontend-ai-kit-by-mk
```

It runs `npx -y @angular/cli mcp` and gives `get_best_practices`, `search_documentation`, `list_projects` and dev server and build tools. Docs: https://angular.dev/ai/mcp.

## Type safety

The `typescript-safety` skill is preloaded by `angular-dev`: strict compiler settings and `strictTemplates`, no `any`, validated API data, typed signal inputs, outputs and forms, and a typecheck gate before finishing.

## Shared rules: `AGENTS.md`

`AGENTS.md` is kept small because it is sent with every request: a few always-true rules and links to topic docs in [`docs/agents/`](docs/agents/) (Angular, TypeScript, accessibility, delivery), which the agent reads only when the task needs them. `my-coding-habits` points at the same docs, so each rule has one copy. `CLAUDE.md` and `GEMINI.md` import `AGENTS.md`.

Install into any project (Node 18+, run in the project root, safe to re-run):

```bash
npx github:Mohamed-Khalil67/frontend-ai-kit-by-Mk --dry-run   # preview
npx github:Mohamed-Khalil67/frontend-ai-kit-by-Mk             # install
```

It writes a short project header plus the kit block into `AGENTS.md` (or updates only the kit block in an existing one), copies `docs/agents/`, copies the skills into `.agents/skills/`, and makes `CLAUDE.md` a symlink to `AGENTS.md` (or an `@AGENTS.md` import). `/frontend-ai-kit:setup` runs the same script. Details, monorepos, Windows symlinks and per-harness notes: [docs/INSTALL-AGENTS-MD.md](docs/INSTALL-AGENTS-MD.md).

## Other tools (Codex, Gemini CLI, Cursor, Copilot, Antigravity)

The plugin format is for Claude Code. The skills follow the Agent Skills format, and the installer copies them into `.agents/skills/` (see Install, step 2). The agents in `agents/` use Claude Code's subagent format and do not carry over. MCP servers must be added in each tool's own settings.

## Develop

```
claude plugin validate .
```

Each skill is `skills/<category>/<name>/SKILL.md`, and each category folder has an `AGENTS.md` index (map: `skills/AGENTS.md`); each agent is `agents/<name>.md`. Manual test scenarios are in `evals/README.md`. No licence is set yet; add one before making the repo public.
