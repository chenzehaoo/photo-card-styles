import { readdir, readFile, stat, access } from 'node:fs/promises';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const required = [
  'SKILL.md', 'README.md', 'LICENSE', '.gitignore', 'THIRD_PARTY_NOTICES.md',
  'agents/openai.yaml', 'references/integration.md', 'examples/BasicPhoto.vue',
  'docs/architecture.md', 'docs/gallery.md',
  ...['holo', 'awakening', 'mythic', 'summon', 'diffraction', 'cyber',
    'studio-flat', 'studio-three', 'assembled', 'exploded'].map(name => `docs/images/${name}.png`),
  ...['PhotoCard.vue', 'catalog.ts', 'styles.css', 'state.ts', 'NativeField.ts',
    'NativeButton.ts', 'studio-tokens.css', 'PhotoStyleStudio.vue', 'PhotoScene.vue',
    'ExportPanel.vue', 'export.ts', 'frame3d.ts', 'layered3d.ts', 'game3d.ts',
    'anime3d.ts', 'extra3d.ts'].map(name => `assets/${name}`),
  ...['GreatVibes.ttf', 'PlayfairRegular.ttf', 'PlayfairItalic.ttf',
    'PlayfairSemibold.ttf', 'GreatVibes-OFL.txt', 'Playfair-OFL.txt']
    .map(name => `assets/fonts/${name}`),
];
for (const path of required) {
  try { if (!(await stat(resolve(root, path))).isFile()) errors.push(`Not a file: ${path}`); }
  catch { errors.push(`Missing: ${path}`); }
}
const skip = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'artifacts']);
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) { errors.push(`Symlink requires manual review: ${relative(root, path)}`); continue; }
    if (entry.isDirectory()) { if (!skip.has(entry.name)) files.push(...await walk(path)); }
    else files.push(path);
  }
  return files;
}
const files = await walk(root);
for (const path of files) {
  const name = relative(root, path).replaceAll('\\', '/');
  if (/^\.env(?:\.|$)/.test(name) && name !== '.env.example') errors.push(`Environment file: ${name}`);
  if (/\.(pem|key|p12|log|zip)$/i.test(name)) errors.push(`Unexpected release file: ${name}`);
  if (!['.md', '.ts', '.vue', '.css', '.yaml', '.json', '.html'].includes(extname(path))) continue;
  const source = await readFile(path, 'utf8');
  if (/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(source)) errors.push(`Possible credential: ${name}`);
  if (/[A-Za-z]:[\\/](?:Users|Serene)[\\/]/i.test(source)) errors.push(`Machine-specific path: ${name}`);
  if (extname(path) === '.md') {
    const prose = source.replace(/```[\s\S]*?```/g, '');
    const links = [...prose.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g),
      ...prose.matchAll(/\b(?:src|href)="([^"]+)"/g)];
    for (const match of links) {
      if (/^(?:https?:|mailto:|#)/.test(match[1])) continue;
      const target = resolve(dirname(path), decodeURIComponent(match[1].split('#')[0]));
      if (relative(root, target).startsWith('..')) { errors.push(`Document link escapes package: ${name}`); continue; }
      try { await access(target); } catch { errors.push(`Broken document link in ${name}: ${match[1]}`); }
    }
  }
  if (!['.ts', '.vue'].includes(extname(path))) continue;
  if (/['"]@\//.test(source)) errors.push(`Host-specific import alias: ${name}`);
  // A lightweight check for this bundle's static imports, not a JavaScript parser.
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"](\.[^'"]+)['"]/g)) {
    const target = resolve(dirname(path), match[1]);
    if (relative(root, target).startsWith('..')) { errors.push(`Import escapes package: ${name}`); continue; }
    let found = false;
    for (const suffix of ['', '.ts', '.vue', '.css', '/index.ts']) {
      try { await access(target + suffix); found = true; break; } catch { /* Try the next supported extension. */ }
    }
    if (!found) errors.push(`Unresolved relative import in ${name}: ${match[1]}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${required.length} required files, ${files.length} package files; imports and basic release hygiene checked. Browser tests and a full security review are separate.`);
