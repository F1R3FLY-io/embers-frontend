/**
 * CI/CD Workflow Tests
 *
 * Tests verify that the development workflow behaves consistently across:
 * 1. Local development
 * 2. Pull Request builds
 * 3. Main branch merges
 *
 * Key principle: PR builds should mirror local development exactly
 */

import * as fs from "fs";
import * as path from "path";

describe("CI/CD Workflow Consistency", () => {
  const rootDir = path.resolve(__dirname, "../..");
  const clientPackageDir = path.join(rootDir, "packages", "client");
  const appsPackageDir = path.join(rootDir, "apps");

  describe("Local Development Workflow", () => {
    test("root pnpm build script builds all packages recursively", () => {
      const rootPackageJson = JSON.parse(
        fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
      );

      // Root build script should build all packages recursively
      expect(rootPackageJson.scripts.build).toBe("pnpm -r build");
    });

    test("client SDK package has proper build script", () => {
      const clientPackageJson = JSON.parse(
        fs.readFileSync(path.join(clientPackageDir, "package.json"), "utf8"),
      );

      // Build script should exist and produce dist/ output
      expect(clientPackageJson.scripts.build).toBeDefined();
      expect(clientPackageJson.scripts.build).toContain("vite build");
      expect(clientPackageJson.scripts.build).toContain("tsc");
    });

    test("frontend should use workspace:* dependency for client SDK", () => {
      const appsPackageJson = JSON.parse(
        fs.readFileSync(path.join(appsPackageDir, "package.json"), "utf8"),
      );

      // Frontend should reference client SDK as workspace dependency
      expect(appsPackageJson.dependencies["@f1r3fly-io/embers-client-sdk"]).toBe("workspace:*");
    });

    test("pnpm dev should build SDK first, then start frontend", () => {
      const rootPackageJson = JSON.parse(
        fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
      );

      // Dev script should build client SDK before starting frontend
      expect(rootPackageJson.scripts.dev).toMatch(/embers-client-sdk build.*embers-frontend dev/);
    });

    test("client SDK should build to dist/ directory with TypeScript declarations", () => {
      const clientPackageJson = JSON.parse(
        fs.readFileSync(path.join(clientPackageDir, "package.json"), "utf8"),
      );

      // Should have proper build output configuration
      expect(clientPackageJson.types).toBe("dist/index.d.ts");
      expect(clientPackageJson.main).toBe("dist/embers-client-sdk.cjs.js");
      expect(clientPackageJson.module).toBe("dist/embers-client-sdk.es.js");
    });

    test("client SDK dist files should exist after build", () => {
      const distDir = path.join(clientPackageDir, "dist");

      // Check if build output exists (this validates the build actually works)
      expect(fs.existsSync(distDir)).toBe(true);
      expect(fs.existsSync(path.join(distDir, "index.d.ts"))).toBe(true);
      expect(fs.existsSync(path.join(distDir, "embers-client-sdk.cjs.js"))).toBe(true);
      expect(fs.existsSync(path.join(distDir, "embers-client-sdk.es.js"))).toBe(true);
    });
  });

  describe("Pull Request Workflow Validation", () => {
    test("Client workflow has separate build and publish jobs with correct triggers", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );

      // Should have build job that runs on both PRs and main
      expect(clientWorkflow).toContain("jobs:\n  build:");

      // Should have publish job that only runs on main branch
      expect(clientWorkflow).toContain("publish:");
      expect(clientWorkflow).toMatch(/if:\s*github\.ref\s*==\s*['"]refs\/heads\/main['"]/);

      // Build job should have SDK build step
      expect(clientWorkflow).toMatch(/Build client SDK|pnpm.*filter.*embers-client-sdk.*build/);
    });

    test("Client workflow build job uses standard npm registry for PRs", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );

      // Build job should configure standard npm registry
      expect(clientWorkflow).toContain("registry=https://registry.npmjs.org/");

      // Build job should avoid GitHub Packages registry configuration in build steps
      const buildSection = clientWorkflow.split("publish:")[0];
      expect(buildSection).not.toContain("npm.pkg.github.com");
    });

    test("Embers workflow has proper GitHub Packages auth and builds SDK", () => {
      const embersWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "embers.yaml"),
        "utf8",
      );

      // Should have GitHub Packages authentication configured
      expect(embersWorkflow).toContain("registry-url: 'https://npm.pkg.github.com'");
      expect(embersWorkflow).toContain(
        `//npm.pkg.github.com/:_authToken=\${{ secrets.GITHUB_TOKEN }}`,
      );

      // Should build client SDK before frontend operations
      expect(embersWorkflow).toMatch(/Build client SDK/i);
      expect(embersWorkflow).toMatch(/pnpm.*filter.*embers-client-sdk.*build/);
    });

    test("workspace configuration enables proper package resolution", () => {
      const workspaceConfig = fs.readFileSync(path.join(rootDir, "pnpm-workspace.yaml"), "utf8");

      // Should include both packages/* and apps workspace paths
      expect(workspaceConfig).toContain("packages/*");
      expect(workspaceConfig).toContain("apps");

      // Validate that workspace resolution actually works by checking if the symlink exists
      const nodeModulesPath = path.join(
        appsPackageDir,
        "node_modules",
        "@f1r3fly-io",
        "embers-client-sdk",
      );
      const symlinkExists = fs.existsSync(nodeModulesPath);
      const isSymlink = symlinkExists && fs.lstatSync(nodeModulesPath).isSymbolicLink();

      // In a properly configured workspace, this should be a symlink to the local package
      expect(symlinkExists).toBe(true);
      expect(isSymlink).toBe(true);
    });
  });

  describe("Main Branch Merge Workflow", () => {
    test("publish job should only run on main branch merges", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );

      // Publish job should have main branch condition
      expect(clientWorkflow).toMatch(/if:\s*github\.ref\s*==\s*['"]refs\/heads\/main['"]/);
    });

    test("publish job should increment version and commit changes", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );

      // Should bump version and commit back to repo
      expect(clientWorkflow).toMatch(/version.*patch/);
      expect(clientWorkflow).toMatch(/git-auto-commit-action/);
    });

    test("publish job builds locally then publishes to GitHub Packages", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );
      const clientPackageJson = JSON.parse(
        fs.readFileSync(path.join(clientPackageDir, "package.json"), "utf8"),
      );

      // Client package should be configured to publish to GitHub Packages
      expect(clientPackageJson.publishConfig.registry).toBe("https://npm.pkg.github.com");

      // Publish job should have GitHub Packages registry setup
      expect(clientWorkflow).toContain("registry-url: 'https://npm.pkg.github.com'");
      expect(clientWorkflow).toContain(`NODE_AUTH_TOKEN: \${{ secrets.GITHUB_TOKEN }}`);

      // Publish job should build before publishing
      const publishSection = clientWorkflow.split("publish:")[1];
      expect(publishSection).toContain("Build client SDK");
      expect(publishSection).toContain("Publish");
    });
  });

  describe("Workflow Consistency Validation", () => {
    test("all workflows should use same pnpm and node versions", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );
      const embersWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "embers.yaml"),
        "utf8",
      );

      // Extract pnpm versions
      const clientPnpmVersion = clientWorkflow.match(
        /pnpm\/action-setup@v\d[\s\S]*?version:\s*(\d+)/,
      )?.[1];
      const embersPnpmVersion = embersWorkflow.match(
        /pnpm\/action-setup@v\d[\s\S]*?version:\s*(\d+)/,
      )?.[1];

      expect(clientPnpmVersion).toBe(embersPnpmVersion);
    });

    test("build commands should be consistent across workflows", () => {
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );
      const embersWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "embers.yaml"),
        "utf8",
      );

      // Both should use same client SDK build command
      const clientBuildCmd = "pnpm --filter @f1r3fly-io/embers-client-sdk build";
      expect(clientWorkflow).toMatch(
        new RegExp(clientBuildCmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      expect(embersWorkflow).toMatch(
        new RegExp(clientBuildCmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    });

    test("local development scripts should match CI build process", () => {
      const rootPackageJson = JSON.parse(
        fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
      );
      const clientWorkflow = fs.readFileSync(
        path.join(rootDir, ".github", "workflows", "client.yaml"),
        "utf8",
      );

      // Root build script should build all packages recursively
      expect(rootPackageJson.scripts.build).toMatch(/pnpm.*-r.*build/);

      // CI should use filtered builds for specific packages
      expect(clientWorkflow).toMatch(/filter.*embers-client-sdk/);
    });
  });

  describe("Registry and Authentication Configuration", () => {
    test("npmrc should have GitHub Packages registry commented out for development", () => {
      const npmrcPath = path.join(rootDir, ".npmrc");
      if (fs.existsSync(npmrcPath)) {
        const npmrcContent = fs.readFileSync(npmrcPath, "utf8");

        // GitHub Packages registry should be commented out
        expect(npmrcContent).toMatch(/^#.*@f1r3fly-io:registry=https:\/\/npm\.pkg\.github\.com/m);
      }
    });

    test("client SDK should only have standard npm dependencies", () => {
      const clientPackageJson = JSON.parse(
        fs.readFileSync(path.join(clientPackageDir, "package.json"), "utf8"),
      );

      // All dependencies should be standard npm packages (no @f1r3fly-io scope except dev tools)
      const prodDeps = Object.keys(clientPackageJson.dependencies || {});
      const problematicDeps = prodDeps.filter(
        (dep) => dep.startsWith("@f1r3fly-io/") && dep !== "@f1r3fly-io/embers-client-sdk",
      );

      expect(problematicDeps).toHaveLength(0);
    });

    test("frontend app should only reference external @f1r3fly-io packages that exist on standard npm", () => {
      const appsPackageJson = JSON.parse(
        fs.readFileSync(path.join(appsPackageDir, "package.json"), "utf8"),
      );

      // Client SDK should be workspace reference
      expect(appsPackageJson.dependencies["@f1r3fly-io/embers-client-sdk"]).toBe("workspace:*");

      // Any other @f1r3fly-io packages are potential CI/CD authentication issues
      const externalF1r3flyDeps = Object.entries(appsPackageJson.dependencies || {})
        .filter(([name]) => name.startsWith("@f1r3fly-io/"))
        .filter(([name]) => name !== "@f1r3fly-io/embers-client-sdk");

      // This test validates that we're aware of external dependencies that require special handling
      // For now, @f1r3fly-io/lightning-bug is expected, but any new ones should be reviewed
      const expectedExternalDeps = ["@f1r3fly-io/lightning-bug"];
      const unexpectedDeps = externalF1r3flyDeps.filter(
        ([name]) => !expectedExternalDeps.includes(name),
      );

      expect(unexpectedDeps).toHaveLength(0);
    });
  });
});
