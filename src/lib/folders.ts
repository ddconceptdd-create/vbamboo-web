import fs from 'node:fs';
import path from 'node:path';
import type { Bi } from '@/i18n';

/**
 * Reader for the content/ folder, which follows the DDConcept v11 layout:
 *
 *   content/<section>/index.txt          one folder name per line, in display order
 *   content/<section>/<NN-slug>/info.txt  fields above "---", text below
 *   content/<section>/<NN-slug>/*.jpg     photos, drawings, swatches…
 *
 * info.txt rules
 *   - Lines starting with "#" are notes (in the text part, "## " starts a heading).
 *   - Fields: "Key: value". Two languages: "Tiếng Việt | English".
 *     A key may repeat (Drawing:, Swatch:, Texture: …), one item per line.
 *   - Text: "[VI]" then "[EN]". Paragraphs are separated by a blank line,
 *     "## Heading" starts a section, "- " starts a list item.
 */

export const CONTENT_DIR = path.join(process.cwd(), 'content');
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

export type Section = { heading: string; lines: string[] };
export type Block = { paragraphs: string[]; sections: Section[] };
export type Doc = {
  dir: string; // e.g. products/01-bosento-sofa
  folder: string; // e.g. 01-bosento-sofa
  fields: Map<string, string[]>;
  vi: Block;
  en: Block;
};

const warned = new Set<string>();
export function warn(msg: string) {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[content] ${msg}`);
}

const keyOf = (k: string) => k.toLowerCase().replace(/[\s_-]+/g, '');

function paragraphs(lines: string[]): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) out.push(cur.join('\n').trim());
      cur = [];
    } else cur.push(l);
  }
  if (cur.length) out.push(cur.join('\n').trim());
  return out.filter(Boolean);
}

function parseBlock(lines: string[]): Block {
  const intro: string[] = [];
  const sections: Section[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      sections.push({ heading: h[1].trim(), lines: [] });
      continue;
    }
    if (/^#/.test(line.trim())) continue; // note
    (sections.length ? sections[sections.length - 1].lines : intro).push(line);
  }
  return { paragraphs: paragraphs(intro), sections };
}

export function readDoc(dir: string): Doc | null {
  const file = path.join(CONTENT_DIR, dir, 'info.txt');
  if (!fs.existsSync(file)) {
    warn(`missing ${path.join('content', dir, 'info.txt')}`);
    return null;
  }
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const fields = new Map<string, string[]>();
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') {
      i++;
      break;
    }
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]*?)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = keyOf(m[1]);
    fields.set(k, [...(fields.get(k) ?? []), m[2].trim()]);
  }
  // Text part: [VI] … [EN] …
  const parts: Record<'vi' | 'en', string[]> = { vi: [], en: [] };
  let lang: 'vi' | 'en' = 'vi';
  for (; i < lines.length; i++) {
    const marker = lines[i].trim().match(/^\[(VI|EN)\]$/i);
    if (marker) {
      lang = marker[1].toLowerCase() as 'vi' | 'en';
      continue;
    }
    if (lines[i].trim() === '---') continue;
    parts[lang].push(lines[i]);
  }
  return { dir, folder: path.basename(dir), fields, vi: parseBlock(parts.vi), en: parseBlock(parts.en) };
}

/** Folder names in display order (index.txt), or all folders when there is no index. */
export function listFolders(section: string): string[] {
  const base = path.join(CONTENT_DIR, section);
  if (!fs.existsSync(base)) return [];
  const existing = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name);
  const index = path.join(base, 'index.txt');
  if (!fs.existsSync(index)) return existing.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const names = fs
    .readFileSync(index, 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .filter((l) => {
      if (l.includes('/') || l.includes('\\') || l.includes('..')) {
        warn(`content/${section}/index.txt: "${l}" is not a folder name`);
        return false;
      }
      if (!existing.includes(l)) {
        warn(`content/${section}/index.txt lists "${l}" but that folder does not exist`);
        return false;
      }
      return true;
    });
  return [...new Set(names)];
}

/** "01-bosento-sofa" → "bosento-sofa" (or the Slug: field). */
export const slugOf = (doc: Doc) =>
  (field(doc, 'slug') || doc.folder.replace(/^\d+[-_ .]*/, ''))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const field = (doc: Doc, key: string): string => doc.fields.get(keyOf(key))?.[0] ?? '';
export const fieldAll = (doc: Doc, key: string): string[] => (doc.fields.get(keyOf(key)) ?? []).filter(Boolean);

/** "Tiếng Việt | English" → { vi, en }. One value is used for both languages. */
export const splitBi = (value: string): Bi => {
  const i = value.indexOf('|');
  if (i === -1) return { vi: value.trim(), en: value.trim() };
  return { vi: value.slice(0, i).trim(), en: value.slice(i + 1).trim() };
};
export const biField = (doc: Doc, key: string): Bi => splitBi(field(doc, key));

/** "a | b | c" → ["a", "b", "c"] */
export const cells = (value: string) => value.split('|').map((c) => c.trim());

export const yes = (value: string) => /^(yes|y|true|có|co|x|1|on)$/i.test(value.trim());
export const num = (value: string): number | null => {
  const n = Number(value.replace(/[\s.,]/g, ''));
  return value.trim() && Number.isFinite(n) ? n : null;
};

/** Public address of a file in the item's folder, or null when it does not exist. */
export function fileUrl(doc: Doc, name: string): string | null {
  const n = name.trim();
  if (!n) return null;
  if (n.includes('/') || n.includes('\\') || n.includes('..')) {
    warn(`content/${doc.dir}: "${n}" must be a file name in the same folder`);
    return null;
  }
  if (!fs.existsSync(path.join(CONTENT_DIR, doc.dir, n))) {
    warn(`content/${doc.dir}: file "${n}" not found`);
    return null;
  }
  return '/content/' + [...doc.dir.split('/'), n].map(encodeURIComponent).join('/');
}

export function imagesIn(doc: Doc): string[] {
  return fs
    .readdirSync(path.join(CONTENT_DIR, doc.dir))
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

/** Text of a section whose heading matches one of the names (either language). */
export function sectionOf(block: Block, names: string[]): Section | null {
  const wanted = names.map((n) => n.toLowerCase());
  return block.sections.find((s) => wanted.includes(s.heading.toLowerCase().split('|')[0].trim())) ?? null;
}
export const listItems = (s: Section | null) =>
  (s?.lines ?? []).map((l) => l.trim()).filter((l) => /^[-•*]\s+/.test(l)).map((l) => l.replace(/^[-•*]\s+/, '').trim());
export const sectionText = (s: Section | null) => paragraphs(s?.lines ?? []).join('\n\n');

/** Pair Vietnamese and English lists item by item. */
export const zipBi = (vi: string[], en: string[]): Bi[] =>
  Array.from({ length: Math.max(vi.length, en.length) }, (_, i) => ({ vi: vi[i] ?? '', en: en[i] ?? '' }));
