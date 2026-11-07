"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { messages, type Locale, type MessageKey } from "../lib/i18n/messages";

const Context = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string } | null>(null);
export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, updateLocale] = useState(initialLocale);
  function setLocale(next: Locale) {
    document.cookie = `happy-town-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    updateLocale(next);
    router.refresh();
  }
  return <Context.Provider value={{ locale, setLocale, t: (key) => messages[locale][key] }}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error("I18nProvider is missing");
  return context;
}
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return <div className="language-switcher" role="group" aria-label={t("language")}>
    {(["ru", "en"] as const).map((value) => <button key={value} type="button" lang={value} aria-label={value === "ru" ? "Русский" : "English"} aria-pressed={locale === value} onClick={() => setLocale(value)}>{value.toUpperCase()}</button>)}
  </div>;
}
