#!/usr/bin/env node
// Documentation integrity checker: relative links/anchors and GFM inline-math
// delimiters across docs/, README.md, and CLAUDE.md — plus, for the API
// method reference (which lives in the sibling embers backend repository at
// ../embers/docs/api and is skipped with a warning when that checkout is
// absent), that every quoted TypeScript declaration matches the generated
// model it names (members, order, optionality, types, and doc comments) and
// that every schema pin names the snapshot's last-touching commit. Exits 1
// on any finding.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const siblingEmbersRoot = resolve(root, "..", "embers");
const apiDocsRoot = join(siblingEmbersRoot, "docs", "api");
const apiDocsPresent = existsSync(apiDocsRoot);

function collect(dir, out) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (p.endsWith(".md")) out.push(p);
  }
  return out;
}
const files = collect(join(root, "docs"), []);
for (const f of ["README.md", "CLAUDE.md"]) files.push(join(root, f));
if (apiDocsPresent) collect(apiDocsRoot, files);
else
  console.warn(
    `docs check: sibling API reference not found at ${apiDocsRoot}; skipping API method checks and sibling links`,
  );

const slugCache = new Map();
function slugsOf(path) {
  if (!slugCache.has(path)) {
    const found = new Set();
    const counts = new Map();
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = /^#{1,6}\s+(.*)$/.exec(line);
      if (!m) continue;
      let text = m[1].replace(/[`*_]/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
      let slug = "";
      for (const ch of text.toLowerCase()) {
        if (/[\p{L}\p{N}]/u.test(ch)) slug += ch;
        else if (ch === " " || ch === "-") slug += "-";
      }
      slug = slug.replace(/^-+|-+$/g, "");
      const n = counts.get(slug) ?? 0;
      counts.set(slug, n + 1);
      found.add(n === 0 ? slug : `${slug}-${n}`);
    }
    slugCache.set(path, found);
  }
  return slugCache.get(path);
}

const failures = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");

  // Links and anchors.
  for (const m of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
    let target = m[1];
    if (/^(https?:|mailto:|<http)/.test(target)) continue;
    if (target.startsWith("#")) {
      if (!slugsOf(file).has(target.slice(1)))
        failures.push(`${file}: intra-file anchor ${target} not found`);
      continue;
    }
    let frag = null;
    const h = target.indexOf("#");
    if (h >= 0) [target, frag] = [target.slice(0, h), target.slice(h + 1)];
    const dest = resolve(dirname(file), target);
    if (!existsSync(dest)) {
      // Links into the sibling embers checkout are only checkable when it is
      // cloned alongside; its absence was warned about once above.
      if (!(!apiDocsPresent && dest.startsWith(siblingEmbersRoot + sep)))
        failures.push(`${file}: target does not exist: ${m[1]}`);
    } else if (frag !== null && dest.endsWith(".md") && !slugsOf(dest).has(frag))
      failures.push(`${file}: anchor #${frag} not found in ${dest}`);
  }

  // Inline math: after removing well-formed $`...`$ spans and then plain code
  // spans (the sanctioned home for literal dollars), no dollar may remain.
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^(```|~~~)/.test(line.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const residue = line.replace(/\$`[^`$]*`\$/g, "").replace(/`[^`]*`/g, "");
    if (residue.includes("$"))
      failures.push(`${file}:${i + 1}: malformed math or stray dollar: ${line.trim().slice(0, 90)}`);
  });
}

// --- API method reference: quoted declarations versus generated models ----
//
// Every "### … types (TypeScript)" fence under ../embers/docs/api/methods/
// (the API reference lives in the sibling embers backend repository) quotes
// the cleaned form of GENERATED declarations (this repository's
// packages/client/src/api-client/models/<Name>.ts): file header, imports,
// codecs, and companion TypeEnum
// declarations dropped; JSDoc reduced to its description lines. The checks
// below re-derive that cleaned view from the generated sources and require
// byte-level agreement on member names, order (ascending, as the generated
// files are), optionality, type text, and description text — so the docs
// cannot drift from the models, nor the models' doc comments from the docs.
// The deploys-websocket page quotes Zod-inferred types instead; its fence is
// compared against the schemas in packages/client/src/services/EmbersEvents.ts.

const FRAMING =
  "Generated declarations from `packages/client/src/api-client/models/`, doc comments included — the comments are generated from the backend models' Rust `///` doc comments (property names are the SDK's camelCase; the wire JSON uses snake_case where they differ):";
const ZOD_FRAMING_TAIL = "their field documentation, are:";
const methodsDir = join(apiDocsRoot, "methods");
const modelsDir = join(root, "packages/client/src/api-client/models");
const eventsSource = join(root, "packages/client/src/services/EmbersEvents.ts");

const collapse = (s) => s.replace(/\s+/g, " ").trim();
const cleanJsdoc = (lines) =>
  collapse(
    lines
      .map((l) => l.replace(/^\s*\/\*\*\s*/, "").replace(/\s*\*\/\s*$/, "").replace(/^\s*\*\s?/, ""))
      .filter((l) => l.trim() !== "" && !l.trim().startsWith("@"))
      .join(" "),
  );

// Parse export declarations (interface / const / type) with attached JSDoc
// out of a TypeScript source. Works identically on docs fences and generated
// model files; extra file content is simply skipped.
function parseDeclarations(text) {
  const lines = text.split("\n");
  const decls = [];
  let pendingDoc = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("/**")) {
      pendingDoc = [line];
      while (!lines[i].includes("*/")) pendingDoc.push(lines[++i]);
      continue;
    }
    const m = /^export (interface|const|type) (\w+)[ =]/.exec(line);
    if (!m) {
      if (line.trim() !== "") pendingDoc = [];
      continue;
    }
    const [, kind, name] = m;
    const doc = cleanJsdoc(pendingDoc);
    pendingDoc = [];
    if (kind === "type") {
      let body = line;
      while (!lines[i].trimEnd().endsWith(";")) body += ` ${lines[++i].trim()}`;
      decls.push({ kind, name, doc, alias: collapse(body) });
      continue;
    }
    if (kind === "const") {
      let body = "";
      while (!lines[i].includes("} as const;")) body += `${lines[++i].trim()} `;
      decls.push({ kind, name, doc, entries: collapse(body) });
      continue;
    }
    const members = [];
    let memberDoc = [];
    i++;
    for (; i < lines.length && lines[i].trim() !== "}"; i++) {
      const inner = lines[i];
      if (inner.trim().startsWith("/**")) {
        memberDoc = [inner];
        while (!lines[i].includes("*/")) memberDoc.push(lines[++i]);
        continue;
      }
      const mm = /^\s+(\w+)(\?)?:\s*(.*)$/.exec(inner);
      if (!mm) continue;
      let type = mm[3];
      while (!type.trimEnd().endsWith(";")) type += ` ${lines[++i].trim()}`;
      members.push({
        name: mm[1],
        optional: Boolean(mm[2]),
        type: collapse(type.replace(/;\s*$/, "")),
        doc: cleanJsdoc(memberDoc),
      });
      memberDoc = [];
    }
    decls.push({ kind, name, doc, members });
  }
  return decls;
}

function compareDeclaration(where, docsDecl, genDecl) {
  if (!genDecl) {
    failures.push(`${where}: ${docsDecl.kind} ${docsDecl.name}: no matching declaration in the generated model`);
    return;
  }
  if (docsDecl.doc !== genDecl.doc)
    failures.push(`${where}: ${docsDecl.name}: declaration doc "${docsDecl.doc}" != generated "${genDecl.doc}"`);
  if (docsDecl.kind === "type") {
    if (docsDecl.alias !== genDecl.alias)
      failures.push(`${where}: type ${docsDecl.name}: docs "${docsDecl.alias}" != generated "${genDecl.alias}"`);
    return;
  }
  if (docsDecl.kind === "const") {
    if (docsDecl.entries !== genDecl.entries)
      failures.push(`${where}: const ${docsDecl.name}: docs "${docsDecl.entries}" != generated "${genDecl.entries}"`);
    return;
  }
  const docsNames = docsDecl.members.map((m) => m.name);
  const genNames = genDecl.members.map((m) => m.name);
  if (docsNames.join(",") !== genNames.join(",")) {
    failures.push(`${where}: ${docsDecl.name}: members [${docsNames}] != generated [${genNames}]`);
    return;
  }
  const sorted = [...genNames].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  if (genNames.join(",") !== sorted.join(","))
    failures.push(`${where}: ${docsDecl.name}: generated members are not in ascending order`);
  for (let k = 0; k < docsDecl.members.length; k++) {
    const d = docsDecl.members[k];
    const g = genDecl.members[k];
    if (d.optional !== g.optional)
      failures.push(`${where}: ${docsDecl.name}.${d.name}: optionality docs ${d.optional} != generated ${g.optional}`);
    if (d.type !== g.type)
      failures.push(`${where}: ${docsDecl.name}.${d.name}: type docs "${d.type}" != generated "${g.type}"`);
    if (d.doc !== g.doc)
      failures.push(`${where}: ${docsDecl.name}.${d.name}: doc "${d.doc}" != generated "${g.doc}"`);
  }
}

function checkZodFence(where, fenceText) {
  const source = readFileSync(eventsSource, "utf8");
  const docs = parseDeclarations(fenceText);
  // NodeType: the docs alias's string literals must equal the z.enum values.
  const nodeType = docs.find((d) => d.name === "NodeType");
  const enumMatch = /NodeType = z\.enum\(\[([^\]]*)\]\)/.exec(source);
  if (nodeType && enumMatch) {
    const docsValues = [...nodeType.alias.matchAll(/"(\w+)"/g)].map((m) => m[1]).join(",");
    const zodValues = [...enumMatch[1].matchAll(/"(\w+)"/g)].map((m) => m[1]).join(",");
    if (docsValues !== zodValues)
      failures.push(`${where}: NodeType values [${docsValues}] != Zod enum [${zodValues}]`);
  } else failures.push(`${where}: NodeType declaration missing in docs or Zod source`);
  // WalletEvent: every documented member must exist in the z.object with the
  // same doc comment. The docs quote the INFERRED type, an alias whose body
  // is an object literal, so its members are parsed here rather than by the
  // interface path above.
  const walletEvent = (() => {
    const fenceLines = fenceText.split("\n");
    const start = fenceLines.findIndex((l) => l.startsWith("export type WalletEvent ="));
    if (start < 0) return null;
    const members = [];
    let memberDoc = [];
    for (let i = start + 1; i < fenceLines.length && !fenceLines[i].startsWith("};"); i++) {
      const line = fenceLines[i];
      if (line.trim().startsWith("/**")) {
        memberDoc = [line];
        while (!fenceLines[i].includes("*/")) memberDoc.push(fenceLines[++i]);
        continue;
      }
      const mm = /^\s+(\w+)(\?)?:\s*(.*);\s*$/.exec(line);
      if (mm) {
        members.push({ name: mm[1], doc: cleanJsdoc(memberDoc) });
        memberDoc = [];
      }
    }
    return { members };
  })();
  const objMatch = /z\.object\(\{([\s\S]*?)\}\)/.exec(source);
  if (walletEvent && objMatch) {
    const zodMembers = new Map();
    const objLines = objMatch[1].split("\n");
    let docBuf = [];
    for (let i = 0; i < objLines.length; i++) {
      const line = objLines[i];
      if (line.trim().startsWith("/**")) {
        docBuf = [line];
        while (!objLines[i].includes("*/")) docBuf.push(objLines[++i]);
        continue;
      }
      const km = /^\s*(\w+):/.exec(line);
      if (km) {
        zodMembers.set(km[1], cleanJsdoc(docBuf));
        docBuf = [];
      }
    }
    const aliasMembers = /\{([\s\S]*)\}/.exec(fenceText.split("export type WalletEvent =")[1] ?? "");
    for (const member of walletEvent.members ?? []) {
      if (!zodMembers.has(member.name))
        failures.push(`${where}: WalletEvent.${member.name}: not present in the Zod schema`);
      else if (zodMembers.get(member.name) !== member.doc)
        failures.push(`${where}: WalletEvent.${member.name}: doc "${member.doc}" != Zod source "${zodMembers.get(member.name)}"`);
    }
    for (const key of zodMembers.keys())
      if (!(walletEvent.members ?? []).some((m) => m.name === key))
        failures.push(`${where}: WalletEvent.${key}: present in the Zod schema but not documented`);
    void aliasMembers;
  } else failures.push(`${where}: WalletEvent declaration missing in docs or Zod source`);
}

let fencesChecked = 0;
const methodFiles = files.filter((f) => f.startsWith(methodsDir));
for (const file of methodFiles) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!/^### .*types \(TypeScript\)$/.test(lines[i])) continue;
    let s = i + 1;
    while (s < lines.length && lines[s].trim() === "") s++;
    // The sentence above the fence may wrap onto several lines; it ends at
    // the blank line that separates it from the fence.
    let f = s;
    while (f < lines.length && lines[f].trim() !== "") f++;
    const sentence = collapse(lines.slice(s, f).join(" "));
    while (f < lines.length && lines[f].trim() === "") f++;
    if (lines[f] !== "```typescript") {
      failures.push(`${file}:${i + 1}: types heading without a typescript fence`);
      continue;
    }
    const zodMode = sentence.endsWith(ZOD_FRAMING_TAIL);
    if (!zodMode && sentence !== FRAMING) {
      failures.push(`${file}:${s + 1}: nonstandard framing sentence above the types fence`);
      continue;
    }
    let end = f + 1;
    while (end < lines.length && lines[end] !== "```") end++;
    const fenceText = lines.slice(f + 1, end).join("\n");
    fencesChecked++;
    const where = `${file}:${f + 1}`;
    if (zodMode) {
      checkZodFence(where, fenceText);
      continue;
    }
    for (const decl of parseDeclarations(fenceText)) {
      const modelFile = join(modelsDir, `${decl.name}.ts`);
      if (!existsSync(modelFile)) {
        failures.push(`${where}: ${decl.name}: no generated model file ${modelFile}`);
        continue;
      }
      const genDecl = parseDeclarations(readFileSync(modelFile, "utf8")).find(
        (g) => g.kind === decl.kind && g.name === decl.name,
      );
      compareDeclaration(where, decl, genDecl);
    }
  }
}

// Schema pins must name the snapshot's last-touching commit.
const snapshotCommit = execFileSync(
  "git",
  ["log", "-1", "--format=%h", "--", "packages/client/schema.json"],
  { cwd: root, encoding: "utf8" },
).trim();
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/Schema pin \| `packages\/client\/schema\.json` @ `([0-9a-f]+)`/g)) {
    if (m[1] !== snapshotCommit)
      failures.push(`${file}: schema pin ${m[1]} != snapshot commit ${snapshotCommit}`);
  }
}

for (const f of failures) console.error(`BROKEN ${f}`);
console.log(
  `docs check: ${files.length} files, ${fencesChecked} typed fences, ${failures.length} finding(s)`,
);
process.exit(failures.length ? 1 : 0);
