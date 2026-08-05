# Embers Platform

Blockchain-based AI agent deployment and management platform with integrated wallet functionality

## Prerequisites

### GitHub Package Authentication

This project uses the `@f1r3fly-io/lightning-bug` package from GitHub Packages. Even though it's a public package, GitHub requires authentication to install packages from their registry.

#### Setup NPM_TOKEN

1. Create a GitHub Personal Access Token:

- Go to GitHub Settings → Developer settings → Personal access tokens
- Generate a new token (classic) with `read:packages` scope
- Copy the generated token

2. Set the environment variable:

   ```bash
   export NPM_TOKEN=your_github_token_here
   ```

3. Alternatively, add it to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
   ```bash
   echo 'export NPM_TOKEN=your_github_token_here' >> ~/.zshrc
   source ~/.zshrc
   ```

## Quick Start

```bash
# Ensure NPM_TOKEN is set (see Prerequisites above)
export NPM_TOKEN=your_github_token_here

# Install dependencies
pnpm install

# Start development server
cd apps/embers
pnpm dev

# Build project
cd apps/embers
pnpm build

# Run lint checks
pnpm ci:lint
```

## 📦 Local npm Package Development & Testing

This branch demonstrates **local npm package build and consumption** using pnpm workspaces without publishing to any registry:

### How It Works

- **Workspace Configuration**: Uses `apps/*` and `packages/*` in `pnpm-workspace.yaml`
- **Local Dependency**: Frontend app uses `"@f1r3fly-io/embers-client-sdk": "workspace:*"`
- **Local Build Process**: Client SDK builds to `packages/client/dist/` with TypeScript declarations
- **Direct Import**: Frontend imports SDK as if it were from npm, but uses local build

### Key Benefits

- ✅ **No Registry Needed**: Test npm package integration without publishing
- ✅ **Real Distribution**: Tests actual bundled output, not source files
- ✅ **Type Safety**: Full TypeScript support with generated `.d.ts` files
- ✅ **Multiple Formats**: Generates ES, CJS, and UMD bundles
- ✅ **True npm Experience**: Frontend consumes SDK exactly like a published package

### Testing Local Package Changes

```bash
# Make changes to client SDK source
edit packages/client/src/functions.ts

# Rebuild SDK (generates new dist/ files)
pnpm --filter @f1r3fly-io/embers-client-sdk build

# Build frontend that consumes the updated SDK
pnpm --filter @f1r3fly-io/embers-frontend build

# Or start development server
cd apps/embers && pnpm dev
```

### Workspace Commands

```bash
# Install all workspace dependencies
pnpm install

# Run script in specific workspace
pnpm --filter <package-name> <script-name>

# Examples:
pnpm --filter @f1r3fly-io/embers-frontend dev
pnpm --filter @f1r3fly-io/embers-frontend build
pnpm --filter @f1r3fly-io/embers-client-sdk build
```

## Project Structure

```
embers-frontend/
├── package.json              # Root package.json with basic tooling
├── pnpm-workspace.yaml       # Workspace: ["apps/*", "packages/*"]
├── CLAUDE.md                 # LLM development guidelines and context
│
├── docs/                     # Documentation hierarchy
│   ├── requirements/         # User stories and business requirements
│   ├── specifications/       # Technical specifications
│   ├── architecture/         # System design and decisions
│   ├── api/                  # Web API reference: protocol spec and per-method docs
│   ├── agent-teams/          # Agent Teams Workflow v2 corpus (theory, design, security, formal)
│   └── post-mortems/         # Incident analyses with diagrams
│
├── demo/                     # Customer demo assets
│   └── research-desk/        # On-chain RAG research desk: corpus, seed script,
│                             # agent Rholang, team fixture, smoke tests
│                             # (runbook: docs/agent-teams/usage/customer-demo-runbook.md)
│
├── packages/
│   └── client/              # @f1r3fly-io/embers-client-sdk
│       ├── src/             # TypeScript source code
│       ├── dist/            # Built library output (when built)
│       └── package.json     # SDK package configuration
│
└── apps/
    └── embers/              # @f1r3fly-io/embers-frontend
        ├── src/             # React 19 + TypeScript source
        ├── dist/            # Vite build output (when built)
        └── package.json     # Frontend dependencies including "workspace:*"
```

## Workspace Packages

1. **Root Package** (`embers`) - Basic linting and formatting tools
2. **Frontend App** (`@f1r3fly-io/embers-frontend`) - React application in `apps/embers/`
3. **Client SDK** (`@f1r3fly-io/embers-client-sdk`) - TypeScript library in `packages/client/`

## Available Commands

### Root Level

```bash
pnpm lint              # ESLint with --fix on all files
pnpm ci:lint           # ESLint check only
pnpm format:code       # Prettier formatting
pnpm ci:check:code     # Prettier check only
```

### Frontend App (`apps/embers/`)

```bash
pnpm dev               # Start Vite development server
pnpm build             # TypeScript compile + Vite build
pnpm preview           # Preview production build
pnpm typecheck         # TypeScript type checking only
pnpm lint              # ESLint with --fix
```

### Client SDK (`packages/client/`)

```bash
pnpm build             # Vite build + TypeScript declarations
pnpm test              # Run tests
pnpm lint              # ESLint with --fix
```

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

## 📚 Documentation

Our project follows a documentation-first approach designed for both human contributors and LLM-assisted development:

### Core Documentation

- **[📋 Requirements](docs/requirements/)** - User stories, business requirements, and acceptance criteria
- **[📐 Specifications](docs/specifications/)** - Technical specifications and design documents
- **[🏗️ Architecture](docs/architecture/)** - System design and architectural decisions
- **[🌐 Web API](../embers/docs/api/)** - HTTP API protocol specification and per-method reference with sequence diagrams (maintained in the sibling `embers` backend repository)
- **[🔥 Agent Teams Workflow v2](docs/agent-teams/)** - Cycles, branching, joins, runtime theory, security, formal model, and operations

### For LLM Assistance

When using LLM tools, start by providing context from:

1. Relevant requirements from [`docs/requirements/`](./docs/requirements/README.md)
2. Technical specifications from [`docs/specifications/`](./docs/specifications/README.md)
3. Architecture constraints from [`docs/architecture/`](./docs/architecture/README.md)
4. Source code context from directory-level READMEs

## Development Workflow

1. **📖 Read Documentation** - Start with `docs/requirements/`
2. **🤖 LLM Integration** - Use comprehensive context from our docs structure
3. **⚙️ Traditional Practices** - Follow CI/CD, testing, and code review standards
4. **📝 Update Documentation** - Keep all documentation current with changes
5. **🔍 Context Files** - This project uses CLAUDE.md for LLM system context

## License

[![License: Apache 2.0](https://img.shields.io/github/license/saltstack/salt.png)](https://www.apache.org/licenses/LICENSE-2.0)
