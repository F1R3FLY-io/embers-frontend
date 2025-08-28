# ADR-003: Migration to Biome for Unified Linting and Formatting

## Status

Accepted

## Context

The project was using separate tools for code quality enforcement: ESLint for linting and Prettier for code formatting. This dual-tool approach required maintaining separate configurations, managing potential conflicts between the tools, and increased complexity in the development workflow.

## Decision

We will migrate from ESLint + Prettier to Biome as a unified linting and formatting solution across the entire monorepo.

## Rationale

### Problems with Previous Setup

1. **Tool Conflicts**: ESLint and Prettier occasionally had conflicting rules requiring careful configuration
2. **Configuration Complexity**: Separate `.eslintrc` and `.prettierrc` files with different syntaxes
3. **Performance**: Running two separate tools increases build and pre-commit hook time
4. **Maintenance Overhead**: Updates and rule changes required coordination between two tool configurations

### Benefits of Biome

1. **Unified Toolchain**: Single tool for both linting and formatting eliminates conflicts
2. **Performance**: Rust-based implementation is significantly faster than Node.js alternatives
3. **Zero Configuration**: Works out of the box with sensible defaults
4. **TypeScript First**: Excellent TypeScript support without additional plugins
5. **Modern Standards**: Built-in support for modern JavaScript/TypeScript patterns
6. **Consistent Formatting**: Single source of truth for code style across the entire codebase

### Migration Benefits

1. **Simplified Configuration**: Single `biome.jsonc` file with comments for documentation
2. **Faster CI/CD**: Reduced pre-push hook execution time
3. **Better Developer Experience**: Instant feedback with faster linting
4. **Unified Rules**: No more conflicts between linting and formatting rules
5. **Maintenance**: Single tool to update and maintain

## Implementation

### Configuration Structure

```jsonc
// biome.jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.2.2/schema.json",
  
  // VCS integration with Git
  "vcs": {
    "enabled": true,
    "clientKind": "git", 
    "useIgnoreFile": true
  },
  
  // File inclusion and exclusion patterns
  "files": {
    "includes": [
      "**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx", 
      "**/*.json", "**/*.mts", "**/*.css", "**/*.scss"
    ]
  },
  
  // Unified linting and formatting rules
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": { "recommended": true },
      "correctness": { 
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "warn"
      }
    }
  },
  
  // Code formatting configuration
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### Package.json Script Updates

```json
{
  "scripts": {
    "lint": "biome check --write .",
    "ci:lint": "biome check .",
    "format:code": "biome format --write .",
    "ci:check:code": "biome format ."
  }
}
```

### Pre-push Hook Integration

```bash
# .husky/pre-push
pnpm run format:code
pnpm --filter @f1r3fly-io/embers-frontend run format:code
pnpm --filter @f1r3fly-io/embers-client-sdk run format:code
pnpm --filter @f1r3fly-io/embers-frontend run ci:check:code
pnpm --filter @f1r3fly-io/embers-client-sdk run ci:check:code
pnpm --filter @f1r3fly-io/embers-client-sdk run lint
pnpm --filter @f1r3fly-io/embers-frontend run ci:lint
```

## Configuration Details

### Rule Categories Enabled

1. **Accessibility (a11y)**: Ensures WCAG compliance and screen reader compatibility
2. **Correctness**: Prevents runtime errors and enforces best practices
3. **Performance**: Identifies performance anti-patterns
4. **Security**: Detects potential security vulnerabilities
5. **Style**: Enforces consistent code style and modern patterns
6. **Suspicious**: Identifies potentially problematic code patterns

### Workspace-Specific Overrides

1. **Auto-generated API Client**: Relaxed rules for generated code
2. **Test Files**: Allow console usage and relaxed naming conventions
3. **TypeScript Modules**: Support for `.mts` files and ES module syntax

### Format Standards

1. **Indentation**: 2 spaces consistently across all file types
2. **Line Width**: 100 characters maximum
3. **Quotes**: Double quotes for strings and JSX attributes
4. **Semicolons**: Always required
5. **Trailing Commas**: All positions for better diffs

## Consequences

### Positive

- **Performance Improvement**: 50-70% faster linting and formatting operations
- **Simplified Configuration**: Single configuration file instead of multiple tool configs
- **Reduced Dependencies**: Removed 10+ ESLint/Prettier related packages from package.json
- **Better Developer Experience**: Instant feedback and consistent formatting
- **Maintenance Reduction**: Single tool to update and maintain

### Negative

- **Migration Effort**: One-time effort to migrate existing configurations and fix rule changes
- **Team Learning**: Developers need to learn Biome-specific configuration syntax
- **Editor Integration**: Team needs to update VSCode/editor settings for Biome

### Mitigation Strategies

1. **Documentation**: Comprehensive comments in `biome.jsonc` explaining all rules
2. **Training**: Team walkthrough of new configuration and commands
3. **Editor Setup**: VSCode extension installation and configuration guide
4. **Gradual Migration**: Incremental rule adoption to minimize disruption

## Migration Process

### Phase 1: Installation and Basic Configuration
- Install Biome as workspace dependency
- Create base `biome.jsonc` configuration
- Update package.json scripts

### Phase 2: Rule Migration
- Map existing ESLint rules to Biome equivalents
- Configure workspace-specific overrides
- Test configuration across all packages

### Phase 3: Cleanup and Integration
- Remove ESLint and Prettier dependencies
- Update Husky pre-push hooks
- Update documentation and CI/CD pipelines

### Phase 4: Team Adoption
- Update editor configurations
- Train team on new commands and workflows
- Monitor and adjust rules based on team feedback

## Alternatives Considered

### Keeping ESLint + Prettier

- **Pros**: No migration effort, established team familiarity
- **Cons**: Continued complexity, performance overhead, maintenance burden

### Migrating to Rome (now Biome)

- **Pros**: Same benefits as Biome (Biome is Rome's successor)
- **Cons**: Rome was discontinued in favor of Biome

### dprint

- **Pros**: Fast formatting, good TypeScript support
- **Cons**: Formatting only, would still need separate linting solution

### Standard.js

- **Pros**: Zero configuration approach
- **Cons**: Limited customization, JavaScript-focused

## Monitoring and Success Criteria

### Performance Metrics
- Pre-push hook execution time reduced by >50%
- Local development linting feedback <1 second

### Team Productivity
- Reduced configuration-related issues
- Faster onboarding for new developers
- Consistent code style across all contributions

### Code Quality
- Maintained or improved linting coverage
- Zero formatting inconsistencies
- Accessibility and security rule compliance

## References

- [Biome Documentation](https://biomejs.dev/)
- [Biome vs ESLint Performance Comparison](https://biomejs.dev/blog/biome-wins-prettier-challenge/)
- [Migration Guide from ESLint](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [Biome VSCode Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

---

*This ADR documents the migration completed in December 2024 as part of the development tooling modernization effort.*