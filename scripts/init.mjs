#!/usr/bin/env node
// Frontend AI Kit by MK: install the shared AGENTS.md rules into any project.
// Usage: node scripts/init.mjs [projectDir] [--dry-run] [--gemini] [--claude=symlink|import|skip]
// Safe to re-run: it updates the kit block and the kit's docs, and never overwrites your own content.
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
  console.log('Usage: frontend-ai-kit [projectDir] [--dry-run] [--gemini] [--claude=symlink|import|skip]');
  process.exit(0);
}
const DRY = flag('dry-run');
const CLAUDE_MODE = opt('claude', 'symlink');
const target = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
if (!['symlink', 'import', 'skip'].includes(CLAUDE_MODE)) fail(`--claude must be symlink, import or skip`);
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
const kitRules = fs.readFileSync(path.join(KIT, 'AGENTS.md'), 'utf8').trim();
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

// 5. Check that every relative link in AGENTS.md resolves.
const missing = [...agents.matchAll(/\]\(([^)#\s]+)\)/g)].map((m) => m[1])
  .filter((l) => !/^[a-z]+:/i.test(l))
  .filter((l) => !fs.existsSync(path.join(target, l)) && !(DRY && l.startsWith('docs/agents/')));

console.log(`Frontend AI Kit -> ${target}${DRY ? '  (dry run, nothing written)' : ''}`);
for (const l of log) console.log(`  - ${l}`);
console.log(missing.length ? `  ! broken links in AGENTS.md: ${missing.join(', ')}` : '  - all AGENTS.md links resolve');
console.log('\nNext: review AGENTS.md (fill in the description if it is a placeholder), then commit AGENTS.md, CLAUDE.md and docs/agents/.');
if (log.some((l) => l.includes('(symlink)'))) console.log('Windows teammates: a committed CLAUDE.md symlink needs `git config core.symlinks true` (and Developer Mode); otherwise re-run with --claude=import.');
if (missing.length) process.exitCode = 1;
