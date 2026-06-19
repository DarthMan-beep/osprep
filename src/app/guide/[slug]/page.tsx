import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadGuide } from "@/lib/guides";
import { getLocale } from "@/lib/locale.server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  let guide;
  try {
    guide = await loadGuide(slug, locale);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        {t(locale, "wb.allTopics")}
      </Link>
      <article className="prose prose-invert mt-4 max-w-none prose-headings:scroll-mt-20 prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none prose-table:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.body}</ReactMarkdown>
      </article>
    </main>
  );
}
