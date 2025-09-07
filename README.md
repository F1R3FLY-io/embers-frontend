# Embers Platform

Blockchain-based AI agent deployment and management platform with integrated wallet functionality

## Quick Start

```bash
# Install dependencies for all workspace packages
pnpm install

# Start development server (automatically builds client SDK first, then runs frontend app)
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all code
pnpm lint
```

## 📦 Monorepo Workspace

This project uses **pnpm workspaces** for efficient monorepo management:

### Key Benefits
- **Single command setup**: `pnpm install` installs all workspace dependencies
- **Dependency sharing**: Common packages shared between workspaces  
- **Local package linking**: Frontend imports client SDK directly
- **Efficient storage**: Hard linking saves disk space
- **Single PR & CI/CD**: `git push` will run the same checks locally as on the remote for a Pull Request
- **Consistent versions**: Shared dependencies use same versions

### Workspace Commands
```bash
# Install all workspace dependencies
pnpm install

# Run script in all workspaces
pnpm -r <script-name>

# Run script in specific workspace
pnpm --filter <package-name> <script-name>

# Examples:
pnpm --filter @f1r3fly-io/embers-frontend dev
pnpm --filter @f1r3fly-io/embers-client-sdk build
```

## 📚 Documentation

Our project follows a documentation-first approach designed for both human contributors and LLM-assisted development:

### Core Documentation

- **[📋 Requirements](docs/requirements/)** - User stories, business requirements, and acceptance criteria
- **[📐 Specifications](docs/specifications/)** - Technical specifications and design documents
- **[🏗️ Architecture](docs/architecture/)** - System design and architectural decisions
  - [Decision Records](docs/architecture/decisions/) - ADRs documenting important architectural choices
  - [System Diagrams](docs/architecture/diagrams/) - Visual representations of system components
  - [Design Patterns](docs/architecture/patterns/) - Established patterns and conventions

### For Contributors

- **[🤝 Contributing Guide](CONTRIBUTING.md)** - Complete workflow for LLM-enhanced development
- **[🔧 Development Setup](docs/development-setup.md)** - Environment configuration and tools
- **[🧪 Testing Guide](docs/testing.md)** - Testing strategies and conventions

### For LLM Assistance

When using LLM tools, start by providing context from:

1. Relevant requirements from [`docs/requirements/`](./docs/requirements.md)
2. Technical specifications from [`docs/specifications/`](./docs/requirements/README.md)
3. Architecture constraints from [`docs/architecture/`](./docs/architecture/README.md)
4. Source code context from directory-level READMEs

## Project Structure

```
embers-frontend/
├── package.json              # Root package.json with workspaces: ["apps", "packages/*"]
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── tsconfig.json             # Root tsconfig with project references
├── tsconfig.base.json        # Base config for shared compiler options
├── node_modules/             # Shared dependencies (pnpm workspaces)
├── CLAUDE.md                 # LLM development guidelines and context
│
├── docs/                     # Documentation-first approach
│   ├── requirements/         # User stories and business requirements  
│   ├── specifications/       # Technical specifications
│   └── architecture/         # System design and decisions
│
├── packages/                 # Publishable library packages
│   └── client/              # @f1r3fly-io/embers-client-sdk
│       ├── src/             # TypeScript source code
│       ├── dist/            # Built library output  
│       ├── tests/           # Unit tests with Jest
│       ├── mocks/           # API mocks for testing
│       ├── package.json     # SDK package configuration
│       └── tsconfig.json    # TypeScript config (extends base)
│
└── apps/                    # Frontend application (single directory)
    ├── src/                 # React 19 + TypeScript source
    │   ├── pages/           # Route components
    │   ├── lib/             # Shared components and utilities
    │   └── public/          # Static assets
    ├── dist/                # Vite build output
    ├── package.json         # Private app package config
    ├── tsconfig.json        # TypeScript config (extends base)
    └── vite.config.ts       # Vite configuration
```

### Workspace Packages

1. **Root Package** (`embers`) - Development tooling and shared dependencies
2. **Frontend App** (`@f1r3fly-io/embers-frontend`) - React application in `apps/`
3. **Client SDK** (`@f1r3fly-io/embers-client-sdk`) - TypeScript library in `packages/client/`

## 🔄 Development & CI/CD Workflow

### Local Development
- **Workspace Linking**: Frontend app uses `"@f1r3fly-io/embers-client-sdk": "workspace:*"`
- **Local Build Process**: `pnpm build` from root builds client SDK to `packages/client/dist/` with full TypeScript declarations
- **Direct Import**: Frontend imports SDK as if it were from npm, but uses local build
- **Development Flow**: `pnpm dev` automatically builds SDK first, then starts frontend

### Pull Request Builds
- **Mirrors Local Development**: PR builds should build SDK locally and use it (not fetch from npm registries)
- **No Publishing**: SDK is built locally but not published to any registry
- **Testing**: All linting, type checking, and testing runs against locally built SDK
- **No Registry Dependencies**: Should not require authentication to GitHub Packages or other registries

### Main Branch Merges
- **Publish SDK**: Build and publish SDK to GitHub Packages (npm registry)
- **Version Increment**: Automatically bump version (patch increment)
- **Registry Update**: New version becomes available for future development

### Key Benefits
- ✅ **No Registry Needed for Development**: Test npm package integration without publishing
- ✅ **Real Distribution Testing**: Tests actual bundled output, not source files
- ✅ **Type Safety**: Full TypeScript support with generated `.d.ts` files
- ✅ **Multiple Formats**: Generates ES, CJS, and UMD bundles
- ✅ **True npm Experience**: Frontend consumes SDK exactly like a published package
- ✅ **Consistent Behavior**: Local development, PR builds, and production use same build process

### Testing Local Package Changes
```bash
# Make changes to client SDK source
edit packages/client/src/functions.ts

# Rebuild SDK (generates new dist/ files)
pnpm --filter @f1r3fly-io/embers-client-sdk build

# Frontend automatically picks up changes
pnpm --filter @f1r3fly-io/embers-frontend dev
```

### CI/CD Behavior
1. **PR Submission**: 
   - Builds SDK locally (same as `pnpm build`)
   - Frontend uses locally built SDK via `workspace:*`
   - Runs all checks against local build
   - No publishing or registry access needed

2. **Main Branch Merge**:
   - Builds SDK locally
   - Runs all checks
   - Publishes SDK to GitHub Packages
   - Increments version
   - Commits version change back to repository

### Workspace Management

#### Installing Dependencies
```bash
# Install root + all workspace dependencies
pnpm install

# Add dependency to specific workspace
pnpm --filter @f1r3fly-io/embers-frontend add react-query
pnpm --filter @f1r3fly-io/embers-client-sdk add zod
```

#### Development Scripts
```bash
# Start frontend development server (builds SDK first)
pnpm dev

# Build all packages in dependency order  
pnpm build

# Run all test suites
pnpm test

# Type-check all packages
pnpm typecheck
```

#### TypeScript Configuration
- **Consolidated Structure**: 4 total tsconfig files (reduced from 12)
- **Project References**: Root references workspace packages 
- **Shared Base**: Common compiler options in `tsconfig.base.json`
- **Path Resolution**: Automatic linking between workspace packages

## Development Workflow

1. **📖 Read Documentation** - Start with `docs/requirements/`
2. **🤖 LLM Integration** - Use comprehensive context from our docs structure
3. **⚙️ Traditional Practices** - Follow CI/CD, testing, and code review standards
4. **📝 Update Documentation** - Keep all documentation current with changes
5. **🔍 Context Files** - This project uses CLAUDE.md for LLM system context

## 🚀 Features

### Frontend Application (`apps/embers/`)

- **AI Agent Management**: Create, edit, and deploy AI agents to blockchain
- **Wallet Integration**: Secure wallet functionality with authentication
- **Protected Routes**: Authentication-gated access to sensitive operations
- **Modern UI**: React 19 with SCSS modules and responsive design

### Client SDK (`packages/client/`)

- **Wallet Operations**: Send tokens, check balances, manage wallet state
- **AI Agent Deployment**: Deploy and interact with AI agents on-chain
- **Cryptographic Security**: Built with Noble curves for secure key management
- **Type Safety**: Full TypeScript support with Zod validation

## 🛠️ Technical Stack

- **Frontend**: React 19, TypeScript, Vite, SCSS Modules
- **State Management**: TanStack Query, React Context
- **Routing**: React Router v7
- **Cryptography**: @noble/curves, js-sha3, blakejs
- **Testing**: Jest with React Testing Library
- **Build Tools**: Vite, pnpm workspaces
- **Linting**: ESLint, Prettier, Stylelint

## 🔐 Security & Architecture

- **Private Key Management**: Secure key generation and storage
- **Address Validation**: Cryptographic address verification
- **Type Safety**: Runtime validation with Zod schemas
- **Authentication**: Protected routes with wallet-based auth
- **API Integration**: Auto-generated client from OpenAPI schema

## License

[![License: Apache 2.0](https://img.shields.io/github/license/saltstack/salt.png)](https://www.apache.org/licenses/LICENSE-2.0)
