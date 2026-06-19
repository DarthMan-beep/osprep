import { cookies } from "next/headers";
import type { Locale } from "./i18n";

/** Resolve the active locale from the `locale` cookie (server components). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("locale")?.value === "mk" ? "mk" : "en";
}
