"use client";

import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  function set(l: Locale) {
    document.cookie = `locale=${l}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="ml-auto flex items-center gap-1 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          className={`rounded px-2 py-1 transition ${
            locale === l
              ? "bg-neutral-700 text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
