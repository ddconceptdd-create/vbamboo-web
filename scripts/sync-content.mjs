// Copies photos, drawings and files from content/ to public/content/ so the
// site can serve them. Text files (info.txt, index.txt) and _TEMPLATE folders
// are not copied. Runs automatically before `npm run dev` and `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'content');
const dest = path.join(root, 'public', 'content');
const MAX = 25 * 1024 * 1024;

fs.rmSync(dest, { recursive: true, force: true });
let count = 0;
const big = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
    const from = path.join(dir, e.name);
    if (e.isDirectory()) walk(from);
    else if (!/\.(txt|md|bat|ps1)$/i.test(e.name)) {
      const to = path.join(dest, path.relative(src, from));
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      count++;
      if (fs.statSync(from).size > MAX) big.push(path.relative(root, from));
    }
  }
})(src);
console.log(`content: ${count} files ready`);
if (big.length) console.warn(`content: these files are over 25 MB and load slowly:\n  ${big.join('\n  ')}`);

// Drop-down choices for the /admin editor (collections can be added there).
const collections = [];
const cdir = path.join(src, 'collections');
for (const e of fs.existsSync(cdir) ? fs.readdirSync(cdir, { withFileTypes: true }) : []) {
  if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('.')) continue;
  const info = path.join(cdir, e.name, 'info.txt');
  if (!fs.existsSync(info)) continue;
  const text = fs.readFileSync(info, 'utf8');
  const get = (k) => text.match(new RegExp(`^${k}\\s*:\\s*(.*)$`, 'mi'))?.[1].trim() ?? '';
  const value = (get('Slug') || e.name.replace(/^\d+[-_ .]*/, '')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  collections.push({ value, label: get('Name') || value, folder: e.name });
}
collections.sort((a, b) => a.folder.localeCompare(b.folder, 'en', { numeric: true }));
fs.mkdirSync(path.join(root, 'public', 'admin'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'public', 'admin', 'options.json'),
  JSON.stringify({ collections: collections.map(({ value, label }) => ({ value, label })) }, null, 2) + '\n',
);
