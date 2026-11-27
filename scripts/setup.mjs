#!/usr/bin/env node
// Frontend AI Kit by MK: one command that sets the kit up in a project.
// Usage: node <kit>/scripts/setup.mjs [projectDir] [--tools=claude,codex,gemini,cursor,copilot,opencode] [--skills=agents|claude|both|none] [--no-pull] [--dry-run]
// Pulls the kit, registers it with Claude Code, installs the plugins for this project, then runs init.mjs.
// Safe to re-run: every step is skipped or updated when it is already done.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE = 'frontend-ai-kit-by-mk';
const PLUGIN = `frontend-ai-kit@${MARKETPLACE}`;
const ANGULAR_MCP = `angular-mcp@${MARKETPLACE}`;
const TOOLS = ['claude', 'codex', 'gemini', 'cursor', 'copilot', 'opencode'];

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
if (flag('help') || flag('h')) {
  console.log('Usage: node scripts/setup.mjs [projectDir] [--tools=claude,codex,gemini,cursor,copilot,opencode] [--skills=agents|claude|both|none] [--no-pull] [--dry-run]');
  process.exit(0);
}
const DRY = flag('dry-run');
const target = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) fail(`Not a folder: ${target}`);
if (target === KIT) fail('Run this inside your project, not inside the kit itself.');

const has = (cmd) => spawnSync(`${cmd} --version`, { shell: true, stdio: 'ignore' }).status === 0;
const tools = (opt('tools') ?? (has('claude') ? 'claude' : 'codex')).split(',').map((t) => t.trim()).filter(Boolean);
const bad = tools.filter((t) => !TOOLS.includes(t));
if (bad.length) fail(`unknown tool(s): ${bad.join(', ')}. Use: ${TOOLS.join(', ')}`);
const usesClaude = tools.includes('claude');
const usesOthers = tools.some((t) => t !== 'claude');
// Claude Code gets the skills from the plugin; other tools read .agents/skills/.
const skills = opt('skills') ?? (usesOthers ? 'agents' : 'none');

const todo = [];
function fail(msg) { console.error(`\nfrontend-ai-kit setup: ${msg}`); process.exit(1); }
function step(title) { console.log(`\n> ${title}`); }
function run(cmd, cmdArgs, { cwd = target, capture = false, optional = false } = {}) {
  const shown = [cmd, ...cmdArgs].map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ');
  console.log(`  $ ${shown}`);
  if (DRY && !capture) return '';
  // shell: true resolves claude.cmd / git.exe on Windows; quote each argument for it.
  const r = spawnSync(shown, { cwd, shell: true, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (r.status !== 0 && !optional) fail(`command failed (exit ${r.status}): ${shown}${capture ? `\n${r.stderr || r.stdout}` : ''}`);
  return capture ? r.stdout : '';
}

console.log(`Frontend AI Kit setup -> ${target}${DRY ? '  (dry run: commands are shown, not run)' : ''}`);
console.log(`  tools: ${tools.join(', ')}  |  skills folder: ${skills}`);

// 1. Bring the kit clone up to date.
step('Update the kit');
if (flag('no-pull')) console.log('  skipped (--no-pull)');
else if (!fs.existsSync(path.join(KIT, '.git'))) console.log('  skipped: the kit is not a git clone, so it cannot be pulled');
else run('git', ['-C', KIT, 'pull', '--ff-only']);

// 2. Claude Code: marketplace, plugin, Angular MCP add-on.
if (usesClaude) {
  if (!has('claude')) fail('Claude Code (`claude`) is not on PATH. Install it, or pass --tools without claude.');

  step('Register the kit with Claude Code');
  const markets = JSON.parse(run('claude', ['plugin', 'marketplace', 'list', '--json'], { capture: true }) || '[]');
  const market = markets.find((m) => m.name === MARKETPLACE);
  if (!market) run('claude', ['plugin', 'marketplace', 'add', KIT]);
  else if (market.source === 'directory' && path.resolve(market.path) !== KIT) {
    console.log(`  note: the marketplace points at another clone (${market.path}); keeping it`);
  } else console.log(`  already registered (${market.source === 'directory' ? market.path : market.repo})`);
  if (market && market.source !== 'directory') run('claude', ['plugin', 'marketplace', 'update', MARKETPLACE]);

  const angular = (() => {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
      return Boolean({ ...pkg.dependencies, ...pkg.devDependencies }['@angular/core']);
    } catch { return false; }
  })();
  const plugins = [PLUGIN, ...(angular ? [ANGULAR_MCP] : [])];

  step(`Install the plugin${angular ? 's' : ''} for this project only`);
  const installed = JSON.parse(run('claude', ['plugin', 'list', '--json'], { capture: true }) || '[]');
  for (const id of plugins) {
    const here = installed.find((p) => p.id === id && p.scope === 'project' && path.resolve(p.projectPath || '') === target);
    if (here) run('claude', ['plugin', 'update', id, '--scope', 'project'], { optional: true });
    else run('claude', ['plugin', 'install', id, '--scope', 'project']);
  }
  if (!angular) console.log('  no @angular/core in package.json, so the angular-mcp add-on was skipped');
  todo.push('Restart Claude Code (or run /reload-plugins) so the plugin, agents and MCP servers load.');
  todo.push('Commit .claude/settings.json so the kit stays on for everyone who opens this project.');
  todo.push('Figma: run /mcp in Claude Code, choose figma, Authenticate (only if you build from Figma).');
  todo.push('In Claude Code, say "set up the kit" for the guided checks (agent choice, official Angular skills).');
}

// 3. Shared rules, docs and skills.
step('Install AGENTS.md, docs/agents/ and skills');
const initArgs = [path.join(KIT, 'scripts', 'init.mjs'), target, `--skills=${skills}`];
if (tools.includes('gemini')) initArgs.push('--gemini');
if (DRY) initArgs.push('--dry-run');
const r = spawnSync(process.execPath, initArgs, { stdio: 'inherit' });
if (r.status !== 0) fail('init.mjs reported a problem (see above).');
todo.push('Review AGENTS.md, then commit AGENTS.md, CLAUDE.md, docs/agents/' + (skills === 'none' ? '.' : ' and the skills folder.'));

console.log(`\nDone${DRY ? ' (dry run)' : ''}. Still to do:`);
todo.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
