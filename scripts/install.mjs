#!/usr/bin/env node
// BoomAI: copy a skill pack (frontend, backend or all) into a project.
// Usage: npx -y github:Mohamed-Khalil67/BoomAI [frontend|backend|all] [projectDir]   (no pack: interactive)
//          [--skills=both|agents|claude|none] [--mcp] [--mcp-skip=a,b] [--gemini] [--claude=symlink|import|skip] [--dry-run] [--list]
// Safe to re-run: it updates what it installed and never overwrites or removes your own files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS_DIR = path.join(KIT, 'packs');
const ORDER = ['frontend', 'backend'];
const PACKS = fs.readdirSync(PACKS_DIR).filter((d) => d !== 'common' && fs.statSync(path.join(PACKS_DIR, d)).isDirectory())
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
const MANAGED = ['<!-- ai-skills: managed file.', '<!-- frontend-ai-kit: managed file.'];
const LEGACY_BLOCK = ['<!-- frontend-ai-kit:start -->', '<!-- frontend-ai-kit:end -->'];
const LOCK = '.ai-skills.json';
const USAGE = `Usage: npx -y github:Mohamed-Khalil67/BoomAI [${[...PACKS, 'all'].join('|')}] [projectDir]
  (no pack: asks which pack, tools, MCP servers and GEMINI.md, with defaults guessed from package.json)
  --skills=both|agents|claude|none  where skills go (default both: .agents/skills and .claude/skills)
  --mcp                             add the pack's MCP servers to .mcp.json
  --mcp-skip=figma,...              leave some servers out
  --gemini                          also create GEMINI.md
  --claude=symlink|import|skip      how CLAUDE.md points at AGENTS.md (default symlink)
  --dry-run                         show what would change, write nothing
  --ask                             ask the questions even when a pack is given
  --list                            list the packs and their skills`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const positional = args.filter((a) => !a.startsWith('--'));
function fail(msg) { console.error(`boomai: ${msg}\n\n${USAGE}`); process.exit(1); }

// Skills of a pack: packs/<pack>/skills/<category>/<name>/SKILL.md, flattened to <name>.
function packSkills(pack) {
  const root = path.join(PACKS_DIR, pack, 'skills');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).flatMap((cat) =>
    fs.readdirSync(path.join(root, cat.name), { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, cat.name, d.name, 'SKILL.md')))
      .map((d) => ({ name: d.name, category: cat.name, dir: path.join(root, cat.name, d.name) })));
}

if (flag('help') || flag('h')) { console.log(USAGE); process.exit(0); }
if (flag('list')) {
  for (const p of PACKS) {
    console.log(`\n${p}`);
    for (const s of packSkills(p)) console.log(`  ${s.category.padEnd(15)} ${s.name}`);
    const agents = path.join(PACKS_DIR, p, 'agents');
    if (fs.existsSync(agents)) console.log(`  ${'agents'.padEnd(15)} ${fs.readdirSync(agents).map((f) => f.replace(/\.md$/, '')).join(', ')}`);
  }
  process.exit(0);
}

let packArg = positional.find((a) => [...PACKS, 'all'].includes(a));
const dirArg = positional.find((a) => a !== packArg && !PACKS.includes(a) && a !== 'all');
if (!packArg && positional.length && !dirArg) fail(`unknown pack "${positional[0]}"`);
const target = path.resolve(dirArg || process.cwd());
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) fail(`not a folder: ${target}`);
if (target === KIT) fail('run this inside your project, not inside the AI Skills repo');
const DRY = flag('dry-run');
const CLAUDE_MODE = opt('claude', 'symlink');
let SKILLS_MODE = opt('skills', 'both');
let MCP = flag('mcp');
let GEMINI = flag('gemini');
const MCP_SKIP = new Set(opt('mcp-skip', '').split(',').filter(Boolean));
if (!['symlink', 'import', 'skip'].includes(CLAUDE_MODE)) fail('--claude must be symlink, import or skip');
if (!['both', 'agents', 'claude', 'none'].includes(SKILLS_MODE)) fail('--skills must be both, agents, claude or none');

// No pack on the command line: ask, when someone is at the terminal. Each question suggests a default
// from the project (Angular -> frontend, NestJS -> backend, both -> all); Enter accepts it.
if (!packArg || flag('ask')) {
  if (!process.stdin.isTTY && !flag('ask')) fail('choose a pack, or run it in a terminal to be asked');
  const { createInterface } = await import('node:readline');
  const rl = createInterface({ input: process.stdin, terminal: false });
  // Queue lines as they arrive, so answers typed or pasted ahead of a question are not lost.
  const queued = [];
  let waiting = null;
  let closed = false;
  rl.on('line', (l) => (waiting ? (waiting(l), (waiting = null)) : queued.push(l)));
  rl.on('close', () => { closed = true; if (waiting) waiting(''); });
  const nextLine = () => (queued.length ? Promise.resolve(queued.shift()) : closed ? Promise.resolve('') : new Promise((r) => (waiting = r)));
  const ask = async (question, options, def) => {
    console.log(`\n${question}`);
    options.forEach(([, label], i) => console.log(`  ${i + 1}) ${label}${i === def ? '  (default)' : ''}`));
    for (;;) {
      process.stdout.write(`Choose 1-${options.length} [${def + 1}]: `);
      const a = (await nextLine()).trim();
      if (!process.stdin.isTTY) console.log(a);
      if (!a) return options[def][0];
      const n = Number(a);
      if (n >= 1 && n <= options.length) return options[n - 1][0];
      const byName = options.find(([v]) => String(v) === a);
      if (byName) return byName[0];
      console.log(`  Type a number from 1 to ${options.length}, or press Enter for ${def + 1}.`);
    }
  };
  const d = { ...readPkg().dependencies, ...readPkg().devDependencies };
  const guess = packArg ?? (d['@angular/core'] && d['@nestjs/core'] ? 'all' : d['@nestjs/core'] ? 'backend' : 'frontend');
  const packOptions = [...PACKS.map((p) => [p, `${p}${p === 'frontend' ? ' (Angular)' : p === 'backend' ? ' (NestJS)' : ''}: ${packSkills(p).length} skills`]), ['all', 'all: every pack']];
  console.log(`BoomAI -> ${target}`);
  packArg = await ask('Which pack?', packOptions, packOptions.findIndex(([v]) => v === guess));
  if (!args.some((a) => a.startsWith('--skills='))) SKILLS_MODE = await ask('Which tools will you use here?', [
    ['both', 'Any tool: .agents/skills/ (Codex, Cursor, Gemini CLI, Copilot) and .claude/skills/ (Claude Code)'],
    ['claude', 'Claude Code only: .claude/skills/'],
    ['agents', 'Other tools only: .agents/skills/'],
  ], 0);
  if (!flag('mcp')) MCP = await ask('Add the pack\'s MCP servers to .mcp.json? (servers you already have are kept)', [[true, 'Yes'], [false, 'No']], 0);
  if (!flag('gemini')) GEMINI = await ask('Create GEMINI.md for Gemini CLI?', [[false, 'No'], [true, 'Yes']], 0);
  const go = await ask(`Install ${packArg} into ${target}${DRY ? ' (dry run)' : ''}?`, [[true, 'Yes'], [false, 'Cancel']], 0);
  rl.close();
  if (!go) { console.log('Cancelled; nothing written.'); process.exit(0); }
  console.log('');
}
function readPkg() { try { return JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8')); } catch { return {}; } }
const selected = packArg === 'all' ? PACKS : [packArg];

const log = [];
const note = (s) => log.push(s);
const rel = (p) => path.relative(target, p) || '.';
const readJson = (f, d = {}) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
function write(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file).equals(Buffer.from(content))) return false;
  if (!DRY) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }
  return true;
}
function remove(p) { if (!DRY) fs.rmSync(p, { recursive: true, force: true }); }
let pkg = readJson(path.join(target, 'package.json'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const SKILL_DIRS = { agents: ['.agents/skills'], claude: ['.claude/skills'], both: ['.agents/skills', '.claude/skills'], none: [] }[SKILLS_MODE];
const linkDir = SKILL_DIRS[0] ?? null;

// 1. AGENTS.md: one block per pack between <!-- ai-skills:<pack>:start/end --> markers.
function linkSkills(text) {
  return text.split('\n').map((line) => {
    if (!/^- [^:\n]+:/.test(line)) return line;
    line = line.replace(/\[([^\]]+)\]\(skills\/[^/)]+\/([^/)]+)\/SKILL\.md\)/g, (m, label, name) =>
      linkDir ? `[${label}](${linkDir}/${name}/SKILL.md)` : `\`${label}\``);
    return line.replace(/`([a-z0-9-]+)`/g, (m, name) => {
      const found = [...new Set([linkDir, '.agents/skills', '.claude/skills'].filter(Boolean))]
        .find((d) => fs.existsSync(path.join(target, d, name, 'SKILL.md')));
      return found ? `[${name}](${found}/${name}/SKILL.md)` : m;
    });
  }).join('\n');
}
function projectHeader() {
  const has = (f) => fs.existsSync(path.join(target, f));
  const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lock') || has('bun.lockb') ? 'bun' : null;
  const v = (d) => deps[d]?.replace(/^[\^~]/, '');
  const scripts = Object.keys(pkg.scripts || {}).filter((k) => !['ng', 'start', 'build', 'watch', 'test', 'lint', 'e2e', 'serve'].includes(k));
  const dirs = ['src', 'projects', 'apps', 'libs', 'packages', 'test'].filter(has);
  const lines = [`# ${pkg.name || path.basename(target)}`, '', pkg.description || '<!-- One or two sentences: what this project is. -->', ''];
  if (pm) lines.push(`- Package manager: ${pm} (not npm).`);
  if (v('@angular/core')) lines.push(`- Angular ${v('@angular/core')}.`);
  if (v('@nestjs/core')) lines.push(`- NestJS ${v('@nestjs/core')}${pkg.type === 'module' ? ', ESM' : ''}.`);
  if (scripts.length) lines.push(`- Non-standard scripts: ${scripts.map((k) => `\`${k}\``).join(', ')}.`);
  if (dirs.length) lines.push(`- Layout: ${dirs.map((d) => `\`${d}/\``).join(', ')}.`);
  lines.push('', '<!-- Add a project rule only after you see the agent get something wrong. Put topic rules in docs/, and per-package rules in a nested AGENTS.md. -->', '');
  return lines.join('\n');
}
const agentsFile = path.join(target, 'AGENTS.md');
const before = fs.existsSync(agentsFile) ? fs.readFileSync(agentsFile, 'utf8') : null;
let agents = before ?? projectHeader();
for (const pack of selected) {
  const [start, end] = [`<!-- ai-skills:${pack}:start -->`, `<!-- ai-skills:${pack}:end -->`];
  const block = `${start}\n${linkSkills(fs.readFileSync(path.join(PACKS_DIR, pack, 'AGENTS.md'), 'utf8').trim())}\n${end}`;
  const spans = [[start, end], ...(pack === 'frontend' ? [LEGACY_BLOCK] : [])];
  const span = spans.map(([s, e]) => [agents.indexOf(s), agents.indexOf(e), e]).find(([s, e]) => s !== -1 && e > s);
  agents = span ? agents.slice(0, span[0]) + block + agents.slice(span[1] + span[2].length) : `${agents.replace(/\s*$/, '')}\n\n${block}\n`;
}
if (before === null) note(`created AGENTS.md (project header + ${selected.join(' + ')} block${selected.length > 1 ? 's' : ''})`);
else note(agents === before ? 'AGENTS.md already up to date' : `updated the ${selected.join(' + ')} block${selected.length > 1 ? 's' : ''} in AGENTS.md (your content kept)`);
write(agentsFile, agents);

// 2. docs/agents/*.md from common + the selected packs. Files you wrote yourself are skipped.
for (const pack of ['common', ...selected]) {
  const src = path.join(PACKS_DIR, pack, 'docs', 'agents');
  if (!fs.existsSync(src)) continue;
  for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.md'))) {
    const dest = path.join(target, 'docs', 'agents', f);
    if (fs.existsSync(dest) && !MANAGED.some((m) => fs.readFileSync(dest, 'utf8').startsWith(m))) { note(`skipped ${rel(dest)} (yours)`); continue; }
    if (write(dest, fs.readFileSync(path.join(src, f), 'utf8'))) note(`${DRY ? 'will write' : 'wrote'} ${rel(dest)}`);
  }
}

// 3. Skills and agents. The lock file records what each pack installed, so re-runs replace only those
//    folders, remove ones a pack dropped, and leave other packs and your own files alone.
function readLock(dir, legacyFile, legacyKey) {
  const lock = readJson(path.join(dir, LOCK), { packs: {} });
  lock.packs ??= {};
  const legacy = path.join(dir, legacyFile);
  if (fs.existsSync(legacy)) { lock.packs.frontend = [...new Set([...(lock.packs.frontend ?? []), ...(readJson(legacy)[legacyKey] ?? [])])]; remove(legacy); }
  return lock;
}
function installSet(base, legacyFile, legacyKey, items, kind) {
  const dir = path.join(target, base);
  const lock = readLock(dir, legacyFile, legacyKey);
  const ownedAnywhere = new Set(Object.values(lock.packs).flat());
  let count = 0;
  for (const pack of selected) {
    const now = items(pack);
    const kept = [];
    for (const it of now) {
      const to = path.join(dir, it.name);
      if (fs.existsSync(to) && !ownedAnywhere.has(it.name)) { note(`skipped ${rel(to)} (yours)`); continue; }
      remove(to);
      if (it.dir) copyDir(it.dir, to); else write(to, fs.readFileSync(it.file));
      kept.push(it.name); count++;
    }
    for (const old of lock.packs[pack] ?? []) if (!now.some((it) => it.name === old)) { remove(path.join(dir, old)); note(`removed ${rel(path.join(dir, old))} (dropped from ${pack})`); }
    lock.packs[pack] = kept;
  }
  for (const p of Object.keys(lock.packs)) if (!lock.packs[p].length) delete lock.packs[p];
  if (Object.keys(lock.packs).length) write(path.join(dir, LOCK), `${JSON.stringify({ note: `${kind} installed by BoomAI, per pack. Re-running the installer replaces them.`, packs: lock.packs }, null, 2)}\n`);
  else if (fs.existsSync(dir)) {
    remove(path.join(dir, LOCK));
    if (!DRY && !fs.readdirSync(dir).length) fs.rmdirSync(dir);
  }
  if (count) note(`${DRY ? 'will install' : 'installed'} ${count} ${kind.toLowerCase()} in ${rel(dir)}/`);
}
function copyDir(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) copyDir(path.join(from, e.name), path.join(to, e.name));
    else write(path.join(to, e.name), fs.readFileSync(path.join(from, e.name)));
  }
}
for (const base of SKILL_DIRS) installSet(base, '.frontend-ai-kit-skills.json', 'skills', packSkills, 'Skills');
if (SKILL_DIRS.includes('.claude/skills')) {
  installSet('.claude/agents', '.frontend-ai-kit-agents.json', 'agents', (pack) => {
    const d = path.join(PACKS_DIR, pack, 'agents');
    return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => ({ name: f, file: path.join(d, f) })) : [];
  }, 'Agents');
}

// 4. --mcp: merge the packs' servers into .mcp.json, run with npx (cmd /c on Windows). Existing servers are kept.
if (MCP) {
  const mcpFile = path.join(target, '.mcp.json');
  const mcp = readJson(mcpFile);
  mcp.mcpServers ??= {};
  const existing = JSON.stringify(mcp.mcpServers);
  const added = [];
  for (const pack of selected) {
    const { mcpServers = {}, onlyWith = {} } = readJson(path.join(PACKS_DIR, pack, 'mcp.json'));
    for (const [name, def] of Object.entries(mcpServers)) {
      if (mcp.mcpServers[name]) { if (!added.includes(name)) note(`.mcp.json: kept your ${name} server`); continue; }
      if (MCP_SKIP.has(name)) { note(`.mcp.json: skipped ${name} (--mcp-skip)`); continue; }
      if (onlyWith[name] && !deps[onlyWith[name]]) continue;
      // Same npm package already running under another name (for example your own Angular CLI server).
      const npmPkg = def.command === 'npx' ? def.args.find((a) => !a.startsWith('-')).replace(/(.)@[^/]*$/, '$1') : null;
      if (npmPkg && existing.includes(npmPkg)) { note(`.mcp.json: skipped ${name} (a server already runs ${npmPkg})`); continue; }
      mcp.mcpServers[name] = def.command === 'npx' && process.platform === 'win32' ? { command: 'cmd', args: ['/c', 'npx', ...def.args] } : def;
      added.push(name);
    }
  }
  if (added.length) { write(mcpFile, `${JSON.stringify(mcp, null, 2)}\n`); note(`.mcp.json: ${DRY ? 'will add' : 'added'} ${added.join(', ')}`); }
}

// 5. CLAUDE.md / GEMINI.md point at AGENTS.md (symlink, or an @AGENTS.md import).
function pointer(name, mode) {
  const file = path.join(target, name);
  let st = null; try { st = fs.lstatSync(file); } catch {}
  if (st?.isSymbolicLink()) return note(`${name} already links to ${fs.readlinkSync(file)}`);
  if (st) {
    const cur = fs.readFileSync(file, 'utf8');
    if (/^@AGENTS\.md\s*$/m.test(cur)) return note(`${name} already imports AGENTS.md`);
    write(file, `@AGENTS.md\n\n${cur}`);
    return note(`added @AGENTS.md to the top of your ${name}`);
  }
  if (mode === 'symlink') {
    try { if (!DRY) fs.symlinkSync('AGENTS.md', file, 'file'); return note(`created ${name} -> AGENTS.md (symlink)`); }
    catch (err) { note(`could not symlink ${name} (${err.code}); using an import instead`); }
  }
  write(file, '@AGENTS.md\n');
  note(`created ${name} containing @AGENTS.md`);
}
if (CLAUDE_MODE !== 'skip') pointer('CLAUDE.md', CLAUDE_MODE);
if (GEMINI) pointer('GEMINI.md', CLAUDE_MODE === 'skip' ? 'symlink' : CLAUDE_MODE);

// 6. Every relative link in AGENTS.md must resolve.
const missing = [...agents.matchAll(/\]\(([^)#\s]+)\)/g)].map((m) => m[1])
  .filter((l) => !/^[a-z]+:/i.test(l) && !fs.existsSync(path.join(target, l)))
  .filter((l) => !(DRY && (l.startsWith('docs/agents/') || SKILL_DIRS.some((d) => l.startsWith(`${d}/`)))));

console.log(`BoomAI: ${selected.join(' + ')} -> ${target}${DRY ? '  (dry run, nothing written)' : ''}`);
for (const l of log) console.log(`  - ${l}`);
console.log(missing.length ? `  ! broken links in AGENTS.md: ${missing.join(', ')}` : '  - all AGENTS.md links resolve');
console.log('\nNext: review AGENTS.md, then commit AGENTS.md, CLAUDE.md, docs/agents/ and the skill folders (or git-ignore them).');
if (log.some((l) => l.startsWith('.mcp.json: added'))) console.log('Claude Code asks you to approve the new .mcp.json servers at the next session start.');
if (missing.length) process.exitCode = 1;
