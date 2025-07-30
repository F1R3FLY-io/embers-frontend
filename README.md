# Embers Platform
Blockchain-based AI agent deployment and management platform with integrated wallet functionality

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
cd apps/embers
pnpm dev

# Build project
pnpm build

# Run tests
pnpm test
```

## 📚 Documentation

Our project follows a documentation-first approach designed for both human contributors and LLM-assisted development:

### Core Documentation
- **[📋 Requirements](docs/requirements/)** - User stories, business requirements, and acceptance criteria  
- **[📐 Specifications](docs/specifications/)** - Technical specifications and design documents
  - [Visual Design](docs/specifications/visual-design/) - UI/UX mockups, wireframes, and style guides
  - [Technical Specs](docs/specifications/technical/) - API specifications, data schemas, and algorithms
- **[🏗️ Architecture](docs/architecture/)** - System design and architectural decisions
  - [Decision Records](docs/architecture/decisions/) - ADRs documenting important architectural choices
  - [System Diagrams](docs/architecture/diagrams/) - Visual representations of system components  
  - [Design Patterns](docs/architecture/patterns/) - Established patterns and conventions
- **[✅ Current Status](docs/ToDos.md)** - Live project status, active tasks, and priorities

### For Contributors
- **[🤝 Contributing Guide](CONTRIBUTING.md)** - Complete workflow for LLM-enhanced development
- **[🔧 Development Setup](docs/development-setup.md)** - Environment configuration and tools
- **[🧪 Testing Guide](docs/testing.md)** - Testing strategies and conventions

### For LLM Assistance
When using LLM tools, start by providing context from:
1. Relevant requirements from [`docs/requirements/`](./docs/requirements.md)
2. Technical specifications from [`docs/specifications/`](./docs/requirements/README.md)
3. Architecture constraints from [`docs/architecture/`](./docs/architecture/README.md)
4. Current priorities from [`docs/ToDos.md`](./docs/ToDos.md)
5. Source code context from directory-level READMEs

## Project Structure

```
embers-frontend/
├── docs/                    # Documentation hierarchy (see above)
├── apps/
│   └── embers/             # React frontend application
│       ├── src/
│       │   ├── lib/        # Shared components and utilities
│       │   ├── pages/      # Route components
│       │   └── public/     # Static assets
│       └── package.json    # Frontend dependencies
├── packages/
│   └── client/             # TypeScript client SDK
│       ├── src/
│       │   ├── api-client/ # Auto-generated API client
│       │   ├── entities/   # Core blockchain entities
│       │   └── functions.ts # Wallet operations
│       └── tests/          # SDK test suites
├── .github/workflows/      # CI/CD pipelines
├── CLAUDE.md              # Project context for LLM assistance
└── pnpm-workspace.yaml    # Monorepo configuration
```

## Development Workflow

1. **📖 Read Documentation** - Start with `docs/requirements/` and `docs/ToDos.md`
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

[![License: Apache 2.0](https://img.shields.io/github/license/saltstack/salt](https://www.apache.org/licenses/LICENSE-2.0)
