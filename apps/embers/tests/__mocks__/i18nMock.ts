import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/**
 * The i18n instance, initialized without Vite.
 *
 * `src/i18n.ts` collects its translation files with `import.meta.glob`, which
 * only Vite implements; under the CommonJS test transform the module fails to
 * parse, so ANY component that reaches it -- the language selector, and so the
 * whole dashboard -- was untestable. This is the same problem the `viteHmr`
 * mock already solves, and the same remedy.
 *
 * The real English catalogue is loaded rather than an empty one: a component
 * that renders a key with no translation looks identical to one rendering the
 * wrong key, and a test asserting on either would prove nothing. Suites that
 * would rather assert on key names still mock `react-i18next` themselves,
 * which takes precedence over this.
 */
import en from "@/i18n/en.json";

// Suites commonly stub `react-i18next` to make `t` return the key, and that
// stub replaces `initReactI18next` with undefined for this module too. Binding
// only when it is really there lets one mock serve both kinds of suite: those
// that want real translations, and those that want key names.
if (typeof initReactI18next === "object") {
  i18n.use(initReactI18next);
}

void i18n.init({
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  lng: "en",
  react: { useSuspense: false },
  resources: { en: { translation: en } },
});

export default i18n;
