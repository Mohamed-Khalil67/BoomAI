#!/usr/bin/env node
// BoomAI repo check: every skill must be well-formed and linked from all four indexes.
// Usage: node scripts/check.mjs        (exit 1 and a list of problems when something is missing)
//
// For a skill packs/<pack>/skills/<category>/<name>/SKILL.md the four indexes are:
//   1. packs/<pack>/skills/<category>/AGENTS.md   category index (table row)
//   2. packs/<pack>/skills/AGENTS.md              pack skills map (category row)
//   3. packs/<pack>/AGENTS.md                     block copied into projects (skills/<category>/<name>/SKILL.md)
//   4. AGENTS.md                                  repo map (packs/<pack>/skills/<category>/<name>/SKILL.md)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS_DIR = path.join(ROOT, 'packs');
const problems = [];
const bad = (msg) => problems.push(msg);
const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');
const norm = (p) => path.resolve(p).toLowerCase();
const dirs = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);

// Targets linked from a Markdown file, resolved against that file's folder.
function linkedFrom(file, alsoIn = null) {
  if (!fs.existsSync(file)) { bad(`missing index file ${rel(file)}`); return { set: new Set(), all: [] }; }
  const links = [...fs.readFileSync(file, 'utf8').matchAll(/\]\(([^)#\s]+)\)/g)].map((m) => m[1]).filter((l) => !/^[a-z]+:/i.test(l));
  const all = links.map((l) => ({ link: l, target: path.resolve(path.dirname(file), l) }));
  // A pack block links docs that may live in packs/common (they land in one folder in a project).
  for (const { link, target } of all) if (!fs.existsSync(target) && !(alsoIn && fs.existsSync(path.resolve(alsoIn, link)))) bad(`${rel(file)}: link "${link}" does not exist`);
  return { set: new Set(all.map((a) => norm(a.target))), all };
}

const rootIdx = linkedFrom(path.join(ROOT, 'AGENTS.md'));
const seen = new Map();
const packs = dirs(PACKS_DIR).filter((p) => p !== 'common');
if (!packs.length) bad('no packs found in packs/');

for (const pack of packs) {
  const packDir = path.join(PACKS_DIR, pack);
  const block = linkedFrom(path.join(packDir, 'AGENTS.md'), path.join(PACKS_DIR, 'common'));
  const map = linkedFrom(path.join(packDir, 'skills', 'AGENTS.md'));
  const vendor = path.join(packDir, 'vendor.json');
  if (fs.existsSync(vendor)) {
    for (const v of JSON.parse(fs.readFileSync(vendor, 'utf8')).skills ?? []) {
      if (!fs.existsSync(path.join(packDir, v.into, 'SKILL.md'))) bad(`${pack}/vendor.json: "${v.name}" points at ${v.into}, which has no SKILL.md`);
      if (!/^[0-9a-f]{40}$/.test(v.commit ?? '')) bad(`${pack}/vendor.json: "${v.name}" needs a full 40-character commit`);
      if (!v.licence) bad(`${pack}/vendor.json: "${v.name}" has no licence recorded`);
    }
  }
  for (const category of dirs(path.join(packDir, 'skills'))) {
    const catIdx = linkedFrom(path.join(packDir, 'skills', category, 'AGENTS.md'));
    if (!map.set.has(norm(path.join(packDir, 'skills', category, 'AGENTS.md')))) bad(`${pack}/skills/AGENTS.md does not link the "${category}" category index`);
    for (const skill of dirs(path.join(packDir, 'skills', category))) {
      const dir = path.join(packDir, 'skills', category, skill);
      const file = path.join(dir, 'SKILL.md');
      const id = `${pack}/${category}/${skill}`;
      if (!fs.existsSync(file)) { bad(`${id}: folder has no SKILL.md`); continue; }
      const text = fs.readFileSync(file, 'utf8');
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
      const name = /^name:\s*(.+?)\s*$/m.exec(fm)?.[1]?.replace(/^["']|["']$/g, '');
      const desc = /^description:\s*([\s\S]*?)(?=\r?\n[a-z-]+:|$)/m.exec(fm)?.[1]?.trim();
      if (name !== skill) bad(`${id}: frontmatter name "${name}" must equal the folder name "${skill}"`);
      if (!desc) bad(`${id}: frontmatter has no description`);
      else if (desc.length > 1024) bad(`${id}: description is ${desc.length} characters (max 1024)`);
      if (seen.has(skill)) bad(`${id}: skill name also used by ${seen.get(skill)}; names must be unique across packs`);
      seen.set(skill, id);
      const want = norm(file);
      if (!catIdx.set.has(want)) bad(`${id}: not linked from packs/${pack}/skills/${category}/AGENTS.md`);
      if (!map.set.has(want)) bad(`${id}: not linked from packs/${pack}/skills/AGENTS.md`);
      if (!block.set.has(want)) bad(`${id}: not linked from packs/${pack}/AGENTS.md (use skills/${category}/${skill}/SKILL.md)`);
      if (!rootIdx.set.has(want)) bad(`${id}: not linked from the repo-root AGENTS.md (use packs/${pack}/skills/${category}/${skill}/SKILL.md)`);
    }
  }
}

if (problems.length) {
  console.error(`BoomAI check: ${problems.length} problem${problems.length > 1 ? 's' : ''}\n` + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`BoomAI check: ok (${seen.size} skills in ${packs.length} packs, all indexed and linked)`);
