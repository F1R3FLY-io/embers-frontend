import * as jestDom from "@testing-library/jest-dom/matchers";

/**
 * DOM matchers, registered for every suite.
 *
 * `toBeVisible`, `toHaveAttribute`, and friends say what the assertion means;
 * the raw equivalents (`expect(el.style.display).not.toBe("none")`) say how it
 * is being checked, and a failure message about a style property is a poor
 * description of "the dialog was not on screen".
 *
 * The `/matchers` entry point is used rather than the package default because
 * the default extends `expect` on import, whereas this registers explicitly.
 * The matchers are plain functions that touch the DOM only when called, so this
 * file is safe in the node-environment suites too -- which matters because
 * `setupFilesAfterEnv` applies to every suite regardless of its environment,
 * and roughly half of these run without a DOM on purpose.
 *
 * The namespace import is filtered because the CommonJS interop this transform
 * produces adds a `default` key alongside the matchers, and `expect.extend`
 * rejects any entry that is not a function.
 */
expect.extend(
  Object.fromEntries(
    Object.entries(jestDom).filter(
      ([, matcher]) => typeof matcher === "function",
    ),
  ),
);
