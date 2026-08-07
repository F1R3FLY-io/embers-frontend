import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import ts from "typescript";

/**
 * The bug class this whole audit exists for.
 *
 * The spinner overlay renders above every modal. A dialog awaited inside a
 * loader-wrapped callback is therefore covered by the spinner that is waiting
 * for it: the user cannot answer, the promise cannot settle, and the flow
 * stops. It has now happened twice -- once on the agents tab, and again on the
 * teams tab, which kept the original shape when the agents tab was corrected.
 * Two occurrences of one mistake in one codebase is the definition of a
 * pattern, so it is checked mechanically rather than by memory.
 *
 * The check reads the syntax tree rather than the text: it finds the local
 * names bound to `useAlert`, `useConfirm`, and `useFormModal`, then looks for
 * an `await` of one of those names anywhere inside a `useCallbackWithLoader`
 * argument. Binding-based detection is what keeps it honest -- `confirm` is
 * also a browser global, and a text search would flag `window.confirm` while
 * missing a dialog renamed at its binding.
 *
 * A flow that genuinely needs a dialog inside a loader wrap can say so with the
 * pragma below; nothing in the codebase does today, and adding one should have
 * to be argued for in review.
 */
const REVIEWED_PRAGMA = "dialog-under-loader-audit: reviewed";

const LOADER_WRAPPER = "useCallbackWithLoader";
const DIALOG_HOOKS = new Set(["useAlert", "useConfirm", "useFormModal"]);

const SOURCE_ROOT = join(__dirname, "..", "src");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

interface Violation {
  dialog: string;
  file: string;
  line: number;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(entryPath);
    }
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [entryPath] : [];
  });
}

/** The local names a file binds to the dialog hooks, e.g. `const confirm = useConfirm()`. */
function dialogBindings(source: ts.SourceFile): Set<string> {
  const names = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      DIALOG_HOOKS.has(node.initializer.expression.text)
    ) {
      names.add(node.name.text);
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return names;
}

/** Every awaited dialog call reachable inside a `useCallbackWithLoader` argument. */
function dialogsAwaitedUnderLoader(
  source: ts.SourceFile,
  dialogs: Set<string>,
): Violation[] {
  const violations: Violation[] = [];

  const collectAwaitedDialogs = (node: ts.Node): void => {
    if (
      ts.isAwaitExpression(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      dialogs.has(node.expression.expression.text)
    ) {
      violations.push({
        dialog: node.expression.expression.text,
        file: relative(SOURCE_ROOT, source.fileName),
        line:
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      });
    }
    ts.forEachChild(node, collectAwaitedDialogs);
  };

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === LOADER_WRAPPER
    ) {
      for (const argument of node.arguments) {
        collectAwaitedDialogs(argument);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return violations;
}

function auditFile(filePath: string): Violation[] {
  const text = readFileSync(filePath, "utf8");

  if (!text.includes(LOADER_WRAPPER) || text.includes(REVIEWED_PRAGMA)) {
    return [];
  }

  const source = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const dialogs = dialogBindings(source);

  return dialogs.size === 0 ? [] : dialogsAwaitedUnderLoader(source, dialogs);
}

const violations = sourceFiles(SOURCE_ROOT).flatMap(auditFile);

it("awaits no dialog inside a loader-wrapped callback", () => {
  const described = violations.map(
    ({ dialog, file, line }) =>
      `${file}:${line} awaits ${dialog}() inside ${LOADER_WRAPPER}`,
  );

  expect(described).toEqual([]);
});

it("audits the flows that have carried this bug", () => {
  // Guards the guard: if these files stopped being scanned -- renamed, moved,
  // or reshaped so the wrapper no longer appears -- the check above would pass
  // by examining nothing.
  const audited = sourceFiles(SOURCE_ROOT)
    .filter((file) => readFileSync(file, "utf8").includes(LOADER_WRAPPER))
    .map((file) => relative(SOURCE_ROOT, file));

  expect(audited).toContain(
    join("pages", "Dashboard", "components", "AgentsTab", "AgentsTab.tsx"),
  );
  expect(audited).toContain(
    join(
      "pages",
      "Dashboard",
      "components",
      "AgentTeamsTab",
      "AgentTeamsTab.tsx",
    ),
  );
});
