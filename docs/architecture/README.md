# Architecture Documentation

## Overview

This directory contains architectural documentation for the Embers Platform, including decision records, system design patterns, and technical guidelines that shape the platform's structure and implementation.

## Documentation Index

### Architecture Decision Records (ADRs)

Decision records documenting important architectural choices and their rationale:

- **[ADR-001: Monorepo Structure](./decisions/001-monorepo-structure.md)**
  - Decision to use pnpm workspaces for frontend app and client SDK
  - Benefits: shared dependencies, consistent versioning, cross-package development
  - Implementation details and consequences

- **[ADR-002: React 19 with TypeScript](./decisions/002-react-19-typescript.md)**
  - Frontend technology stack selection and rationale
  - React 19, TypeScript, Vite, and SCSS Modules integration
  - Component architecture and state management strategy

- **[ADR-003: Biome for Unified Linting and Formatting](./decisions/003-biome-linting-formatting.md)**
  - Migration from ESLint + Prettier to Biome unified toolchain
  - Performance improvements and configuration simplification
  - Workspace-specific rule overrides and team adoption strategy

### Design Patterns

Established patterns and conventions for consistent development:

- **[Component Patterns](./patterns/component-patterns.md)**
  - React component organization and structure
  - SCSS module patterns and responsive design
  - State management, error handling, and performance patterns
  - Testing patterns and accessibility guidelines

### System Architecture (Planned)

High-level system design documentation:

- **System Diagrams** - Visual representations of system components and data flow
- **Integration Patterns** - How frontend, SDK, and blockchain services interact
- **Security Architecture** - Authentication, authorization, and data protection strategies
- **Deployment Architecture** - Infrastructure and deployment patterns

## For LLM Assistance

When working with Embers Platform architecture:

### Key Architectural Constraints

1. **Client-Side Security**: All private key operations must remain client-side
2. **Type Safety**: Full TypeScript coverage for blockchain operations
3. **Performance**: Bundle size <1.5MB, page loads <2s
4. **Accessibility**: WCAG 2.1 AA compliance throughout

### Architectural Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
2. **Immutable Data**: Blockchain entities are immutable with validation
3. **Error Boundaries**: Comprehensive error handling at component and API levels

### Technology Stack Decisions

- **Frontend**: React 19 + TypeScript + Vite for modern development experience
- **Styling**: SCSS Modules for component isolation and maintainability
- **State Management**: React Query for server state, Context for global client state
- **Code Quality**: Biome for unified linting and formatting with comprehensive rules
- **Blockchain**: Noble curves and Web Crypto API for secure operations
- **Build System**: pnpm workspaces for monorepo management

## Contributing to Architecture

### Adding New ADRs

1. Use the format: `###-descriptive-title.md`
2. Include Status, Context, Decision, Rationale, Consequences, and Alternatives
3. Reference related ADRs and update this index
4. Review with architecture team before merging

### Proposing Pattern Changes

1. Document current pattern limitations or issues
2. Propose new pattern with examples and benefits
3. Update component pattern documentation
4. Provide migration guide for existing code

### Architecture Review Process

1. **Technical RFC**: For major architectural changes
2. **Team Review**: All ADRs reviewed by development team
3. **Documentation Update**: Keep patterns and guidelines current
4. **Implementation Tracking**: Monitor adoption of new patterns

## Related Documentation

- **[Requirements](../requirements/)** - Business and user requirements driving architectural decisions

## Quick Reference

### Common Architecture Questions

**Q: Why use a monorepo structure?**
A: See [ADR-001](./decisions/001-monorepo-structure.md) - enables shared tooling, consistent versioning, and simplified cross-package development.

**Q: Why React 19 over other frameworks?**
A: See [ADR-002](./decisions/002-react-19-typescript.md) - provides concurrent features, excellent TypeScript integration, and mature ecosystem.

**Q: Why migrate from ESLint/Prettier to Biome?**
A: See [ADR-003](./decisions/003-biome-linting-formatting.md) - unified toolchain improves performance, reduces complexity, and eliminates tool conflicts.

**Q: How should I structure new components?**
A: Follow patterns in [Component Patterns](./patterns/component-patterns.md) - use SCSS modules, TypeScript interfaces, and established testing approaches.

**Q: What are the security requirements?**
A: Private keys must never leave client-side, all addresses validated with checksums, amounts use BigInt for precision.

---

_This architecture documentation follows Smart-Assets.io SSL documentation standards for LLM-enhanced development._
