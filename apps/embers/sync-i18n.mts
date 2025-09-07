import * as fs from "fs";
import * as path from "path";

type Translations = Record<string, string | Record<string, any>>;

const i18nDir = path.resolve("./src/i18n");
const masterFile = path.join(i18nDir, "en.json");

// Load master translations
const master: Translations = JSON.parse(fs.readFileSync(masterFile, "utf-8"));

/**
 * Recursively merge keys from master into target
 * - If key exists in target → keep it
 * - If key missing → add empty string (or object if nested)
 */
function mergeKeys(masterObj: Translations, targetObj: Translations): Translations {
  const result: Translations = { ...targetObj };

  for (const key in masterObj) {
    const masterVal = masterObj[key];
    const targetVal = targetObj[key];

    if (masterVal && typeof masterVal === "object" && !Array.isArray(masterVal)) {
      result[key] = mergeKeys(masterVal as Translations, (targetVal as Translations) || {});
    } else {
      if (!(key in result)) {
        result[key] = "";
      }
    }
  }

  return result;
}

/**
 * Remove keys from target that don't exist in master
 */
function removeExtraKeys(masterObj: Translations, targetObj: Translations): Translations {
  const result: Translations = {};

  for (const key in targetObj) {
    if (key in masterObj) {
      const masterVal = masterObj[key];
      const targetVal = targetObj[key];

      if (
        masterVal &&
        typeof masterVal === "object" &&
        targetVal &&
        typeof targetVal === "object" &&
        !Array.isArray(masterVal) &&
        !Array.isArray(targetVal)
      ) {
        result[key] = removeExtraKeys(masterVal as Translations, targetVal as Translations);
      } else {
        result[key] = targetVal;
      }
    }
  }

  return result;
}

// Iterate over all other language files
for (const file of fs.readdirSync(i18nDir)) {
  if (file === "en.json" || !file.endsWith(".json")) continue;

  const filePath = path.join(i18nDir, file);
  const current: Translations = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let merged = mergeKeys(master, current);
  merged = removeExtraKeys(master, merged); // comment this line if you want to keep extras

  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
  console.log(`✅ Updated ${file}`);
}

console.log("🌍 i18n sync complete!");
