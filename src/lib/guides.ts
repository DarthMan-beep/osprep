import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Locale } from "./i18n";

export const GUIDES_ROOT = path.join(process.cwd(), "content", "guides");

export interface GuideMeta {
  slug: string;
  title: string;
  topic: string;
  order: number;
  summary: string;
}

export interface Guide extends GuideMeta {
  body: string; // markdown without frontmatter
}

/** Split a `---` YAML frontmatter block from the markdown body. */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  return { data: (yaml.load(m[1]) as Record<string, unknown>) ?? {}, body: m[2] };
}

function toMeta(slug: string, data: Record<string, unknown>): GuideMeta {
  return {
    slug,
    title: String(data.title ?? slug),
    topic: String(data.topic ?? ""),
    order: Number(data.order ?? 999),
    summary: String(data.summary ?? ""),
  };
}

async function readGuideFile(slug: string, locale: Locale): Promise<string> {
  if (locale !== "en") {
    try {
      return await fs.readFile(
        path.join(GUIDES_ROOT, `${slug}.${locale}.md`),
        "utf8",
      );
    } catch {
      /* fall back to English */
    }
  }
  return fs.readFile(path.join(GUIDES_ROOT, `${slug}.md`), "utf8");
}

export async function loadGuide(
  slug: string,
  locale: Locale = "en",
): Promise<Guide> {
  const safe = slug.replace(/[^a-z0-9-]/gi, "");
  const raw = await readGuideFile(safe, locale);
  const { data, body } = parseFrontmatter(raw);
  return { ...toMeta(safe, data), body };
}

// A "base" guide file is e.g. `01-foo.md`; localized variants like
// `01-foo.mk.md` carry a locale infix and are not listed as separate guides.
const BASE_GUIDE = /^[a-z0-9-]+\.md$/;

export async function listGuides(locale: Locale = "en"): Promise<GuideMeta[]> {
  let files: string[];
  try {
    files = await fs.readdir(GUIDES_ROOT);
  } catch {
    return [];
  }
  const guides: GuideMeta[] = [];
  for (const file of files) {
    if (!BASE_GUIDE.test(file)) continue; // skip variants like *.mk.md
    const slug = file.replace(/\.md$/, "");
    const raw = await readGuideFile(slug, locale); // localized frontmatter
    const { data } = parseFrontmatter(raw);
    guides.push(toMeta(slug, data));
  }
  return guides.sort((a, b) => a.order - b.order);
}
