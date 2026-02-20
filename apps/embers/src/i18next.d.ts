import "i18next";

import type en from "./i18n/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: typeof en
    };
  }
}
