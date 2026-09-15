import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Where the `@jest-environment` pragma has to sit, and why it is worth a test.
 *
 * Jest reads the pragma only from the FIRST docblock in a file. Half the
 * suites here run under `node` and half under `jsdom`, chosen per file, so a
 * pragma that stops being first does not fail loudly -- the suite silently
 * runs in the wrong environment and every test in it breaks on `document` or
 * `localStorage` being undefined, with an error that points at the assertion
 * rather than at the cause.
 *
 * This is not hypothetical. Running `eslint --fix` sorted an import above the
 * docblock in two suites, which moved the pragma out of first position and
 * took 23 tests down with it. The blank line the check insists on is what
 * keeps the comment detached from the first import, so sorting cannot carry it
 * along again.
 */

const TEST_DIR = __dirname;

function testFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return testFiles(path);
    }
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")
      ? [path]
      : [];
  });
}

const files = testFiles(TEST_DIR)
  // This file talks ABOUT the pragma rather than declaring one, and it runs
  // under the default environment on purpose: it only reads the filesystem.
  .filter((path) => path !== __filename)
  .filter((path) => readFileSync(path, "utf8").includes("@jest-environment"));

it("has files that declare an environment", () => {
  // Guards the guard: if the pragma convention were replaced wholesale, the
  // check below would pass over an empty list and prove nothing.
  expect(files.length).toBeGreaterThan(5);
});

it("puts every environment pragma before anything else in its file", () => {
  const misplaced = files.filter((path) => {
    const source = readFileSync(path, "utf8");
    return !source.startsWith("/**\n * @jest-environment ");
  });

  // Named rather than counted: a failure should say which suite is about to
  // run in the wrong environment.
  expect(misplaced).toEqual([]);
});

it("declares an environment exactly once per file", () => {
  const duplicated = files.filter(
    (path) =>
      (readFileSync(path, "utf8").match(/@jest-environment/g) ?? []).length > 1,
  );

  // Two pragmas is worse than a misplaced one: Jest honours the first and
  // ignores the second, so the file reads as though it declares an
  // environment it does not actually run under.
  expect(duplicated).toEqual([]);
});
