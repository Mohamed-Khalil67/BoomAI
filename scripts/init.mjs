#!/usr/bin/env node
// Frontend AI Kit by MK: install the shared AGENTS.md rules into any project.
// Usage: node scripts/init.mjs [projectDir] [--dry-run] [--gemini] [--claude=symlink|import|skip] [--skills=both|agents|claude|none] [--mcp]
// Safe to re-run: it updates the kit block, the kit's docs and the kit's skills, and never overwrites your own content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- frontend-ai-kit:start -->';
const END = '<!-- frontend-ai-kit:end -->';
const MANAGED = '<!-- frontend-ai-kit: managed file.';
const STANDARD_SCRIPTS = new Set(['ng', 'start', 'build', 'watch', 'test', 'lint', 'e2e', 'serve']);

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || `=${d}`).split('=')[1];
if (flag('help') || flag('h')) {
  console.log('Usage: frontend-ai-kit [projectDir] [--dry-run] [--gemini] [--claude=symlink|import|skip] [--skills=both|agents|claude|none] [--mcp]');
  process.exit(0);
}
const DRY = flag('dry-run');
const CLAUDE_MODE = opt('claude', 'symlink');
// Default both: .agents/skills for Codex, Cursor, Gemini CLI, Copilot and others, .claude/skills for Claude Code,
// so the project works in whichever tool opens it.
const SKILLS_MODE = opt('skills', 'both');
const target = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
if (!['symlink', 'import', 'skip'].includes(CLAUDE_MODE)) fail(`--claude must be symlink, import or skip`);
if (!['agents', 'claude', 'both', 'none'].includes(SKILLS_MODE)) fail(`--skills must be both, agents, claude or none`);
const MCP = flag('mcp');
const MCP_SKIP = new Set((opt('mcp-skip', '') || '').split(',').filter(Boolean));
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) fail(`Not a folder: ${target}`);
if (path.resolve(target) === KIT) fail('Run this inside your project, not inside the kit itself.');

const log = [];
const note = (s) => log.push(s);
const rel = (p) => path.relative(target, p) || '.';
function fail(msg) { console.error(`frontend-ai-kit: ${msg}`); process.exit(1); }
function write(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  if (!DRY) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }
  return true;
}

// 1. Project header (only for a new AGENTS.md): short description, package manager, unusual scripts, high-level layout.
function projectHeader() {
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')); } catch {}
  const has = (f) => fs.existsSync(path.join(target, f));
  const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lock') || has('bun.lockb') ? 'bun' : has('package-lock.json') ? 'npm' : null;
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const angular = deps['@angular/core'];
  const scripts = Object.entries(pkg.scripts || {}).filter(([k]) => !STANDARD_SCRIPTS.has(k));
  const dirs = ['src', 'projects', 'apps', 'libs', 'packages'].filter((d) => has(d));
  const lines = [`# ${pkg.name || path.basename(target)}`, ''];
  lines.push(pkg.description || '<!-- One or two sentences: what this project is. -->', '');
  if (pm && pm !== 'npm') lines.push(`- Package manager: ${pm} (not npm).`);
  if (angular) lines.push(`- Angular ${angular.replace(/^[\^~]/, '')}.`);
  if (scripts.length) lines.push(`- Non-standard scripts: ${scripts.map(([k]) => `\`${k}\``).join(', ')}.`);
  if (dirs.length) lines.push(`- Layout: ${dirs.map((d) => `\`${d}/\``).join(', ')}.`);
  lines.push('', '<!-- Add a project rule only after you see the agent get something wrong. Put topic rules in docs/, and per-package rules in a nested AGENTS.md. -->', '');
  return lines.join('\n');
}

// 2. AGENTS.md: replace the kit block if present, otherwise append it; create with a project header if missing.
// Skill links in the kit's AGENTS.md point at skills/<category>/<name>/SKILL.md, which only exists in the kit repo.
// Point them at the folder the skills are copied to here; with no copy (Claude Code plugin), keep the name only.
// Unlinked names (the official Angular skills) get a link when the project already has that skill.
const SKILL_DIRS = { agents: '.agents/skills', claude: '.claude/skills', both: '.agents/skills', none: null };
const skillDest = SKILL_DIRS[SKILLS_MODE];
function linkSkills(text) {
  const [head, rest] = text.split(/(?=^## Skills$)/m);
  if (!rest) return text;
  const end = rest.slice(3).search(/^## /m);
  let section = end === -1 ? rest : rest.slice(0, end + 3);
  section = section.replace(/\[([^\]]+)\]\(skills\/[^/)]+\/([^/)]+)\/SKILL\.md\)/g, (m, label, name) =>
    skillDest && name !== 'setup' ? `[${label}](${skillDest}/${name}/SKILL.md)` : `\`${label}\``);
  section = section.replace(/^(- [^:\n]+:.*)$/gm, (line) => line.replace(/`([a-z0-9-]+)`/g, (m, name) => {
    const found = [...new Set([skillDest, '.agents/skills', '.claude/skills'].filter(Boolean))].find((d) => fs.existsSync(path.join(target, d, name, 'SKILL.md')));
    return found ? `[${name}](${found}/${name}/SKILL.md)` : m;
  }));
  // Agents copied into .claude/agents/ have no plugin prefix.
  if (SKILLS_MODE === 'claude' || SKILLS_MODE === 'both') section = section.replaceAll('frontend-ai-kit:frontend-lead', 'frontend-lead');
  return head + section + (end === -1 ? '' : rest.slice(end + 3));
}
const kitRules = linkSkills(fs.readFileSync(path.join(KIT, 'AGENTS.md'), 'utf8').trim());
const block = `${START}\n${kitRules}\n${END}\n`;
const agentsFile = path.join(target, 'AGENTS.md');
let agents;
if (!fs.existsSync(agentsFile)) {
  agents = `${projectHeader()}\n${block}`;
  note('created AGENTS.md (project header + kit block)');
} else {
  const cur = fs.readFileSync(agentsFile, 'utf8');
  const s = cur.indexOf(START), e = cur.indexOf(END);
  if (s !== -1 && e > s) { agents = cur.slice(0, s) + block + cur.slice(e + END.length).replace(/^\n/, ''); }
  else { agents = `${cur.replace(/\s*$/, '')}\n\n${block}`; }
  note(agents === cur ? 'AGENTS.md already up to date' : (s !== -1 ? 'updated the kit block in AGENTS.md' : 'appended the kit block to your AGENTS.md (your content kept)'));
}
write(agentsFile, agents);

// 3. docs/agents/*.md: copy kit docs; update ones the kit manages; never touch files you wrote.
const srcDocs = path.join(KIT, 'docs', 'agents');
for (const f of fs.readdirSync(srcDocs).filter((f) => f.endsWith('.md'))) {
  const dest = path.join(target, 'docs', 'agents', f);
  const content = fs.readFileSync(path.join(srcDocs, f), 'utf8');
  if (fs.existsSync(dest) && !fs.readFileSync(dest, 'utf8').startsWith(MANAGED)) { note(`skipped ${rel(dest)} (yours, not the kit's)`); continue; }
  if (write(dest, content)) note(`${fs.existsSync(dest) && !DRY ? 'wrote' : 'will write'} ${rel(dest)}`);
}

// 4. CLAUDE.md / GEMINI.md: symlink to AGENTS.md (falls back to an @AGENTS.md import).
function pointer(name, mode) {
  const file = path.join(target, name);
  let st = null; try { st = fs.lstatSync(file); } catch {}
  if (st?.isSymbolicLink()) return note(`${name} already links to ${fs.readlinkSync(file)}`);
  if (st) {
    const cur = fs.readFileSync(file, 'utf8');
    if (/^@AGENTS\.md\s*$/m.test(cur)) return note(`${name} already imports AGENTS.md`);
    write(file, `@AGENTS.md\n\n${cur}`);
    return note(`added @AGENTS.md to the top of your ${name} (your content kept)`);
  }
  if (mode === 'symlink') {
    try { if (!DRY) fs.symlinkSync('AGENTS.md', file, 'file'); return note(`created ${name} -> AGENTS.md (symlink)`); }
    catch (err) { note(`could not symlink ${name} (${err.code}); using an import instead`); }
  }
  write(file, '@AGENTS.md\n');
  note(`created ${name} containing @AGENTS.md`);
}
if (CLAUDE_MODE !== 'skip') pointer('CLAUDE.md', CLAUDE_MODE);
if (flag('gemini')) pointer('GEMINI.md', CLAUDE_MODE === 'skip' ? 'symlink' : CLAUDE_MODE);

// 5. Skills: flatten skills/<category>/<name>/ into <project>/.agents/skills/<name>/ (and/or .claude/skills/).
// A lock file records which folders the kit owns, so your own skills are never overwritten or removed.
// `setup` is left out: it drives the Claude Code plugin and has no meaning elsewhere.
const SKILL_SKIP = new Set(['setup']);
const kitSkills = [];
const skillsRoot = path.join(KIT, 'skills');
for (const cat of fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const sk of fs.readdirSync(path.join(skillsRoot, cat.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dir = path.join(skillsRoot, cat.name, sk.name);
    if (fs.existsSync(path.join(dir, 'SKILL.md')) && !SKILL_SKIP.has(sk.name)) kitSkills.push({ name: sk.name, dir });
  }
}
function copyDir(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.isSymbolicLink()) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else write(b, fs.readFileSync(a));
  }
}
function installSkills(base) {
  const dest = path.join(target, base);
  const lockFile = path.join(dest, '.frontend-ai-kit-skills.json');
  const owned = new Set(fs.existsSync(lockFile) ? JSON.parse(fs.readFileSync(lockFile, 'utf8')).skills : []);
  const installed = [];
  for (const s of kitSkills) {
    const to = path.join(dest, s.name);
    if (fs.existsSync(to) && !owned.has(s.name)) { note(`skipped ${rel(to)} (yours, not the kit's)`); continue; }
    if (!DRY) fs.rmSync(to, { recursive: true, force: true });
    copyDir(s.dir, to);
    installed.push(s.name);
  }
  for (const name of owned) {
    if (!kitSkills.some((s) => s.name === name)) {
      if (!DRY) fs.rmSync(path.join(dest, name), { recursive: true, force: true });
      note(`removed ${rel(path.join(dest, name))} (no longer in the kit)`);
    }
  }
  write(lockFile, JSON.stringify({ note: 'Folders installed by frontend-ai-kit. Re-running the installer replaces them.', skills: installed }, null, 2) + '\n');
  note(`${DRY ? 'will install' : 'installed'} ${installed.length} skills in ${rel(dest)}/`);
}
if (SKILLS_MODE === 'agents' || SKILLS_MODE === 'both') installSkills(path.join('.agents', 'skills'));
if (SKILLS_MODE === 'claude' || SKILLS_MODE === 'both') installSkills(path.join('.claude', 'skills'));

// 5b. With skills in .claude/skills, also copy the kit's agents into .claude/agents so they work without the plugin.
// The agents preload skills by plain name, which matches the copied folders. Same lock-file rule as the skills.
if (SKILLS_MODE === 'claude' || SKILLS_MODE === 'both') {
  const dest = path.join(target, '.claude', 'agents');
  const lockFile = path.join(dest, '.frontend-ai-kit-agents.json');
  const owned = new Set(fs.existsSync(lockFile) ? JSON.parse(fs.readFileSync(lockFile, 'utf8')).agents : []);
  const kitAgents = fs.readdirSync(path.join(KIT, 'agents')).filter((f) => f.endsWith('.md'));
  const installed = [];
  for (const f of kitAgents) {
    const to = path.join(dest, f);
    if (fs.existsSync(to) && !owned.has(f)) { note(`skipped ${rel(to)} (yours, not the kit's)`); continue; }
    write(to, fs.readFileSync(path.join(KIT, 'agents', f), 'utf8'));
    installed.push(f);
  }
  for (const f of owned) {
    if (!kitAgents.includes(f)) { if (!DRY) fs.rmSync(path.join(dest, f), { force: true }); note(`removed ${rel(path.join(dest, f))} (no longer in the kit)`); }
  }
  write(lockFile, JSON.stringify({ note: 'Agents installed by frontend-ai-kit. Re-running the installer replaces them.', agents: installed }, null, 2) + '\n');
  note(`${DRY ? 'will install' : 'installed'} ${installed.length} agents in ${rel(dest)}/`);
}

// 5c. --mcp: add the kit's MCP servers to .mcp.json (Claude Code's project file), run with npx.
// Never changes a server already there; skips the Angular CLI server when one already runs @angular/cli.
if (MCP) {
  const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
  const mcpFile = path.join(target, '.mcp.json');
  const mcp = readJson(mcpFile);
  mcp.mcpServers ??= {};
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')); } catch {}
  const angular = Boolean({ ...pkg.dependencies, ...pkg.devDependencies }['@angular/core']);
  const servers = { ...readJson(path.join(KIT, '.mcp.json')).mcpServers };
  if (angular) Object.assign(servers, readJson(path.join(KIT, 'plugins', 'angular-mcp', '.mcp.json')).mcpServers);
  const existing = JSON.stringify(mcp.mcpServers);
  const added = [];
  for (const [name, def] of Object.entries(servers)) {
    if (mcp.mcpServers[name]) { note(`.mcp.json: kept your ${name} server`); continue; }
    if (MCP_SKIP.has(name)) { note(`.mcp.json: skipped ${name} (--mcp-skip)`); continue; }
    if (name === 'angular-cli' && existing.includes('@angular/cli')) { note('.mcp.json: skipped angular-cli (a server already runs @angular/cli)'); continue; }
    // npx needs a cmd /c wrapper for Claude Code on Windows.
    mcp.mcpServers[name] = def.command === 'npx' && process.platform === 'win32' ? { command: 'cmd', args: ['/c', 'npx', ...def.args] } : def;
    added.push(name);
  }
  if (added.length) { write(mcpFile, `${JSON.stringify(mcp, null, 2)}\n`); note(`.mcp.json: ${DRY ? 'will add' : 'added'} ${added.join(', ')}`); }
  else note('.mcp.json: nothing to add');
}

// 6. Check that every relative link in AGENTS.md resolves.
const missing = [...agents.matchAll(/\]\(([^)#\s]+)\)/g)].map((m) => m[1])
  .filter((l) => !/^[a-z]+:/i.test(l))
  .filter((l) => !fs.existsSync(path.join(target, l)) && !(DRY && (l.startsWith('docs/agents/') || (skillDest && l.startsWith(`${skillDest}/`)))));

console.log(`Frontend AI Kit -> ${target}${DRY ? '  (dry run, nothing written)' : ''}`);
for (const l of log) console.log(`  - ${l}`);
console.log(missing.length ? `  ! broken links in AGENTS.md: ${missing.join(', ')}` : '  - all AGENTS.md links resolve');
console.log('\nNext: review AGENTS.md (fill in the description if it is a placeholder), then commit AGENTS.md, CLAUDE.md, docs/agents/ and the skills folder.');
if ((SKILLS_MODE === 'claude' || SKILLS_MODE === 'both') && /frontend-ai-kit@[^"]*"\s*:\s*true/.test((() => { try { return fs.readFileSync(path.join(target, '.claude', 'settings.json'), 'utf8'); } catch { return ''; } })())) {
  console.log('Claude Code: the frontend-ai-kit plugin is also enabled here, so each skill shows twice. Use --skills=agents with the plugin, or remove the plugin.');
}
if (log.some((l) => l.includes('(symlink)'))) console.log('Windows teammates: a committed CLAUDE.md symlink needs `git config core.symlinks true` (and Developer Mode); otherwise re-run with --claude=import.');
if (missing.length) process.exitCode = 1;
