import type { DefaultNamespace, ParseKeys, TOptions } from "i18next";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

type Resource = {
  translation: Record<string, string>;
};

type Resources = Record<string, Resource>;

const modules: Record<string, { default: Record<string, string> }> =
  import.meta.glob("./i18n/*.json", { eager: true });

const resources: Resources = Object.fromEntries(
  Object.entries(modules).map(([path, value]) => {
    const lang = path.match(/\/([a-z]+)\.json$/i)?.[1];
    if (!lang) {
      return [];
    }
    return [lang, { translation: value.default }];
  }),
) as Resources;

void i18n.use(initReactI18next).init({
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  lng: "en",
  react: { useSuspense: false },
  resources,
});

export type TranslationKey = ParseKeys<DefaultNamespace, TOptions>;

export default i18n;
