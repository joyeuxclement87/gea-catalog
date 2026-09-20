// Server-only image resolution.
//
// Product / category / cover images live in /public/images and are matched to
// data by filename (slug). We look the file up on disk at request time so the
// extension is discovered automatically (.jpg / .jpeg / .png / .webp) and so
// swapping an image never requires touching a React component.
//
// The result is cached per-directory and only re-read when the directory
// changes (a file added/removed), so replacing a file *in place* is picked up
// by the browser automatically.
import fs from "fs";
import path from "path";

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

function extPriority(file: string): number {
  const match = /\.([a-z0-9]+)$/i.exec(file);
  if (!match) return IMAGE_EXTENSIONS.length;
  const idx = IMAGE_EXTENSIONS.indexOf(match[1].toLowerCase() as (typeof IMAGE_EXTENSIONS)[number]);
  return idx === -1 ? IMAGE_EXTENSIONS.length : idx;
}

const DIRS = {
  products: { dir: path.join(process.cwd(), "public", "images", "products"), prefix: "/images/products" },
  categories: { dir: path.join(process.cwd(), "public", "images", "categories"), prefix: "/images/categories" },
} as const;

const dirCaches = new Map<string, { mtime: number; files: string[] }>();
const mapCaches = new Map<string, { mtime: number; map: Map<string, string> }>();

function snapshot(dir: string): { mtime: number; files: string[] } {
  const cached = dirCaches.get(dir);
  const mtime = fs.existsSync(dir) ? fs.statSync(dir).mtimeMs : 0;
  if (cached && cached.mtime === mtime) return cached;
  const files =
    mtime > 0
      ? fs.readdirSync(dir).filter((f) => IMAGE_EXTENSIONS.some((e) => f.toLowerCase().endsWith(`.${e}`)))
      : [];
  const snap = { mtime, files };
  dirCaches.set(dir, snap);
  return snap;
}

function buildMap(snap: { files: string[] }, prefix: string): Map<string, string> {
  const map = new Map<string, string>();
  const sorted = [...snap.files].sort((a, b) => {
    const byExt = extPriority(a) - extPriority(b);
    return byExt !== 0 ? byExt : a.localeCompare(b);
  });
  for (const file of sorted) {
    const base = path.basename(file, path.extname(file));
    if (!map.has(base)) map.set(base, `${prefix}/${file}`);
  }
  return map;
}

function dirMap(dir: string, prefix: string): Map<string, string> {
  const snap = snapshot(dir);
  const cached = mapCaches.get(dir);
  if (cached && cached.mtime === snap.mtime) return cached.map;
  const map = buildMap(snap, prefix);
  mapCaches.set(dir, { mtime: snap.mtime, map });
  return map;
}

export function resolveProductImage(slug: string): string | null {
  return dirMap(DIRS.products.dir, DIRS.products.prefix).get(slug) ?? null;
}

export function resolveCategoryImage(slug: string): string | null {
  return dirMap(DIRS.categories.dir, DIRS.categories.prefix).get(slug) ?? null;
}

export function resolveCoverImage(): string | null {
  const dir = path.join(process.cwd(), "public", "images", "cover");
  for (const ext of IMAGE_EXTENSIONS) {
    if (fs.existsSync(path.join(dir, `cover.${ext}`))) return `/images/cover/cover.${ext}`;
  }
  return null;
}