import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiClientRoot = path.join(packageRoot, "src", "api-client");
const generatorConfig = JSON.parse(
  await readFile(path.join(packageRoot, "openapitools.json"), "utf8"),
);
const modelIndexPath = path.join(
  apiClientRoot,
  "models",
  "index.ts",
);

async function generatedTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? generatedTypeScriptFiles(entryPath)
        : Promise.resolve(entry.name.endsWith(".ts") ? [entryPath] : []);
    }),
  );
  return files.flat();
}

for (const generatedFile of await generatedTypeScriptFiles(apiClientRoot)) {
  const source = await readFile(generatedFile, "utf8");
  const normalized = source.replace("/* eslint-disable */\n", "");
  if (normalized !== source) {
    await writeFile(generatedFile, normalized);
  }
}
const lines = (await readFile(modelIndexPath, "utf8")).trimEnd().split("\n");
const mappedModels = [...new Set(Object.values(generatorConfig.typeMappings ?? {}))].sort(
  (left, right) => left.localeCompare(right),
);

for (const model of mappedModels) {
  await readFile(
    path.join(apiClientRoot, "models", `${model}.ts`),
    "utf8",
  );
}

const exportLines = new Set(lines.filter((line) => line.startsWith("export * from ")));
for (const model of mappedModels) {
  exportLines.add(`export * from "./${model}";`);
}

const preamble = lines.filter((line) => !line.startsWith("export * from "));
const sortedExports = [...exportLines].sort((left, right) => left.localeCompare(right));
await writeFile(modelIndexPath, `${[...preamble, ...sortedExports].join("\n")}\n`);
