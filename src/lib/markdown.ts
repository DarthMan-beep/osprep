import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighter, type Highlighter } from "shiki";

// VS Code's "Dark+" theme + the languages our content actually uses.
const THEME = "dark-plus";
const LANGS = [
  "bash",
  "shellsession", // ```console blocks (the $-prompt sessions)
  "dockerfile",
  "java",
  "python",
  "yaml",
  "json",
  "diff",
];

// Building a highlighter loads grammars/themes and is expensive — do it once.
let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: [THEME], langs: LANGS });
  }
  return highlighterPromise;
}

/** Render markdown to HTML with VS Code-style syntax-highlighted code blocks. */
export async function renderMarkdown(md: string): Promise<string> {
  const highlighter = await getHighlighter();
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShikiFromHighlighter, highlighter, {
      theme: THEME,
      fallbackLanguage: "text",
    })
    .use(rehypeStringify)
    .process(md);
  return String(file);
}
