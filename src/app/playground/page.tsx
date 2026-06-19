import { getLocale } from "@/lib/locale.server";
import { Playground } from "@/components/Playground";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const locale = await getLocale();
  return <Playground locale={locale} />;
}
