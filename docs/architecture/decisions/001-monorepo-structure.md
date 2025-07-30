# ADR-001: Monorepo Structure with pnpm Workspaces

## Status
Accepted

## Context
The Embers Platform requires both a frontend application and a client SDK that can be used independently. We need to decide on the project structure that best supports development, testing, and distribution of these components.

## Decision
We will use a monorepo structure with pnpm workspaces to manage the frontend application and client SDK as separate but related packages.

## Rationale

### Benefits of Monorepo Approach
1. **Shared Dependencies**: Common development tools (TypeScript, ESLint, testing) can be shared at the root level
2. **Consistent Versioning**: All packages can be versioned together for coordinated releases
3. **Cross-Package Development**: Frontend can directly reference the SDK during development without publishing
4. **Simplified CI/CD**: Single repository with coordinated build and test pipelines
5. **Code Sharing**: Common utilities and types can be shared between packages

### Why pnpm Workspaces
1. **Efficient Storage**: pnpm's linking strategy reduces disk usage and installation time
2. **Strict Dependencies**: Prevents packages from accessing undeclared dependencies
3. **Workspace Protocol**: Enables local package references with `workspace:*` syntax
4. **Performance**: Faster than npm/yarn for workspace operations
5. **Node_modules Structure**: Cleaner, more predictable dependency resolution

## Implementation

### Directory Structure
```
embers-frontend/
├── apps/
│   └── embers/              # Frontend React application
├── packages/
│   └── client/              # Client SDK package
├── package.json             # Root workspace configuration
├── pnpm-workspace.yaml      # Workspace definition
└── pnpm-lock.yaml          # Lockfile for all dependencies
```

### Workspace Configuration
```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Package Dependencies
```json
{
  "dependencies": {
    "embers-client-sdk": "workspace:*"
  }
}
```

## Consequences

### Positive
- **Development Velocity**: Faster iteration on SDK changes with immediate frontend integration
- **Type Safety**: Full TypeScript support across package boundaries
- **Testing**: Integrated testing across packages with shared test utilities
- **Deployment**: Coordinated releases with dependency alignment

### Negative
- **Complexity**: More complex setup compared to separate repositories
- **Build Dependencies**: Changes in SDK require frontend rebuilds
- **Repository Size**: Single repository grows larger with multiple packages

### Mitigation Strategies
1. **Clear Package Boundaries**: Maintain distinct package.json files and build processes
2. **Independent Deployment**: Packages can still be deployed independently
3. **Documentation**: Clear guidelines for cross-package development
4. **CI/CD Optimization**: Selective builds based on changed packages

## Alternatives Considered

### Separate Repositories
- **Pros**: Complete independence, simpler individual package management
- **Cons**: Complex dependency management, version coordination challenges, duplicated tooling

### Lerna/Rush
- **Pros**: More features for monorepo management
- **Cons**: Additional complexity, less performant than pnpm workspaces

### Yarn Workspaces
- **Pros**: Similar benefits to pnpm workspaces
- **Cons**: Less efficient storage, slower performance, phantom dependencies possible

## References
- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)